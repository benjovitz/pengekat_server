import db from "../database/connection.js"
import { ObjectId } from "mongodb"
import { getExchangeRate } from "../util/currencyUtil.js"
import fs from "fs"
import { app, database, storage } from "../util/firebase.js"
import {ref, uploadBytes, getDownloadURL} from "firebase/storage"

async function getAllGroups(userId){
    const groups = await db.groups.find({members: {
        $elemMatch:{
            _userId: new ObjectId(userId)
        }}}).toArray()
        
    return groups
}

async function getExpenses(groupId){
    const expenses = await db.expenses.find({_groupId: groupId}).toArray()
    return expenses
}

async function addExpense(groupId, userId, currency, comment, amount, shareOverview, exchangedAmount, exchangeRate){
    const timestamp = new Date().toLocaleDateString("da-DK", {day: "2-digit", year: "numeric", month: "2-digit", hour: "numeric", minute: "numeric"})
    const mongoInsert = {_userId: new ObjectId(userId), _groupId: groupId, currency, share_overview: shareOverview, comment, timestamp}
    if(currency !== "DKK"){
        mongoInsert.amount = exchangedAmount
        mongoInsert.original_amount = amount
        mongoInsert.share_overview.map(member => {
            member.originalShare = member.share
            member.share = Number((member.share / exchangeRate).toFixed(2))
            }) 
    } else {
        mongoInsert.amount = amount
    }
    const response = await db.expenses.insertOne(mongoInsert)
    return {insertedId: response.insertedId, expense: mongoInsert}
}

async function calculateExchangeRate(currency){
    if(currency !== "DKK"){
        const exchangeRate = await getExchangeRate(currency) 
        return exchangeRate
    } 
    return 1
}

async function findGroup(groupId){
        const group = await db.groups.findOne({_id: groupId})
        return group
}

function findMember(userId, group){
    const member = group.members.find(member => member._userId.equals(userId))
    return member
}

async function removeMember(userIdToRemove, group){
    const member = group.members.find(member => new ObjectId(member._userId).equals(userIdToRemove))
    if(member.balance === 0){ 
        const newGroup = group.members.filter(member => !new ObjectId(member._userId).equals(userIdToRemove))
        await db.groups.findOneAndUpdate({_id: new ObjectId(group._id)}, {$set : {members: newGroup}})
        return true
    } 
    return false
}

async function modifyGroup(groupId, groupName){
   await db.groups.findOneAndUpdate({_id: groupId}, {$set : {group_name: groupName}})
}

async function addMembers(members, group){
    const membersId = await db.users.find({username: {$in: members}}).toArray()
    membersId.map((member) => {
        group.members = [...group.members, {_userId: member._id, balance: 0}]
    })
    await db.groups.findOneAndUpdate({_id: group._id}, {$set: {members: group.members}})
    return group
}

async function updateBalance(group, expenseId, payingMember){
    const expense = await db.expenses.findOne({_id: new ObjectId(expenseId)})
        group.members.map((member) => {
            const foundMember = expense.share_overview.find(sharer => sharer._userId.equals(member._userId))
            if(foundMember){
                foundMember._userId.equals(payingMember) ? 
                member.balance += expense.amount - foundMember.share : 
                member.balance -= foundMember.share
                member.balance = Number((member.balance).toFixed(2))
            }
        })
    const newSum = group.total_sum += expense.amount
    await db.groups.findOneAndUpdate({_id: new ObjectId(group._id)}, {$set:{members: [...group.members], total_sum: newSum}})
    await db.expenses.findOneAndUpdate({_id: expense._id}, {$set: {share_overview: expense.share_overview}})
    return group
}

function calculateAmount(amount, exchangeRate){
    return amount / exchangeRate
    
}

async function createGroup(groupName, userId){
    await db.groups.insertOne({group_name: groupName, members: [{_userId: userId, balance: 0}], total_sum: 0})
}

async function deleteExpense(expenseId, groupId, userId){
    const expense = await db.expenses.findOne({_id: expenseId})
    if(!expense._userId.equals(userId)){
        return false
    }
    const group = await db.groups.findOne({_id: groupId})
    group.members.map((member) => {
        const foundMember = expense.share_overview.find(sharer => sharer._userId.equals(member._userId))
        if(foundMember){
            foundMember._userId.equals(userId) ? 
            member.balance -= expense.amount - foundMember.share : 
            member.balance += foundMember.share
            member.balance = Number((member.balance).toFixed(2))
        }
        return group
    })
    await db.groups.findOneAndUpdate({_id: group._id}, {$set: {members: group.members}})
    await db.expenses.findOneAndDelete({_id: expense._id})
    return group
}

async function payDebt(group, payingMember){
    if(payingMember.balance >= 0 ){
        return false
    } else {
        const payback = payingMember.balance
        const membersOwed = group.members.filter(member => member.balance > 0)
        const totalSurplus = membersOwed.reduce((total, member) =>{
            return total + member.balance
        }, 0)
        membersOwed.map(member => {
            const percentage = member.balance / totalSurplus * 100
            const slice = percentage / 100 * payback
            member.balance += slice
        })
    }
    payingMember.balance = 0
    group.members.map(member => member.balance = Number(member.balance.toFixed(2)))
    await db.groups.findOneAndUpdate({_id: group._id}, {$set : {members: group.members}})
    return group
}

async function debtCalculator(group, member){
    if(member.balance >= 0){
        return false
    }
    const payback = member.balance
        const membersOwed = group.members.filter(member => member.balance > 0)
        const totalSurplus = membersOwed.reduce((total, member) =>{
            return total + member.balance
        }, 0)
        membersOwed.map(member => {
            const percentage = member.balance / totalSurplus * 100
            const slice = percentage / 100 * payback
            member.slice = slice * -1
        })
        group.members = group.members.filter(member => member.slice)
        return group
}

async function addGroupNames(group){
    const userIds = group.members.map(member => member._userId)
    const users = await db.users.find({_id: {$in: userIds}}).toArray()
    group.members.map((member) => {
        const foundMember = users.find(user => user._id.equals(member._userId))
        if(foundMember){
            member.username = foundMember.username
        }
    })
}

async function uploadGroupImage(groupId, photoString){
    const fileRef = ref(storage, groupId + "/" + photoString);
    const fileData = fs.readFileSync("./database/uploads/" + photoString);

    await uploadBytes(fileRef, fileData);

    const downloadUrl = await getDownloadURL(fileRef);
    await db.groups.findOneAndUpdate({_id: new ObjectId(groupId)}, {$set: {image: downloadUrl}})
}

export default {
    calculateExchangeRate,
    findGroup,
    findMember,
    addExpense,
    updateBalance,
    removeMember,
    addMembers,
    createGroup,
    modifyGroup,
    deleteExpense,
    payDebt,
    getAllGroups,
    getExpenses,
    addGroupNames,
    uploadGroupImage,
    calculateAmount,
    debtCalculator
}