import db from "../database/connection.js"
import { ObjectId } from "mongodb"
import { getExchangeRate } from "../util/currencyUtil.js"

async function addExpense(groupId, userId, currency, comment, amount, shareOverview, exchangedAmount){
    const timestamp = new Date().toLocaleDateString("da-DK", {day: "2-digit", year: "numeric", month: "2-digit", hour: "numeric", minute: "numeric"})
    const mongoInsert = {_userId: new ObjectId(userId), _groupId: groupId, currency, share_overview: shareOverview, comment, timestamp}
    if(currency !== "DKK"){
        mongoInsert.amount = Number(exchangedAmount.toFixed(2))
        mongoInsert.originalAmount = amount
    } else {
        mongoInsert.amount = amount
    }
    const response = await db.expenses.insertOne(mongoInsert)
    return response
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
}

async function updateBalance(group, expenseId, payingMember, exchangedAmount, exchangeRate){
    const expense = await db.expenses.findOne({_id: new ObjectId(expenseId)})
        if(expense.currency !== "DKK"){
            expense.share_overview.map(member => {
                member.originalShare = member.share
                member.share = member.share / exchangeRate
                })
        }
        group.members.map((member) => {
            const foundMember = expense.share_overview.find(sharer => sharer._userId.equals(member._userId))
            if(foundMember){
                foundMember._userId.equals(payingMember) ? 
                member.balance += exchangedAmount - foundMember.share : 
                member.balance -= foundMember.share
                foundMember.share = Number(foundMember.share.toFixed(2))
            }
        })
    group.members.map(member => member.balance = Number(member.balance.toFixed(2)))
    await db.groups.findOneAndUpdate({_id: new ObjectId(group._id)}, {$set:{members: [...group.members]}})
    await db.expenses.findOneAndUpdate({_id: expense._id}, {$set: {share: expense.share}})
}


async function createGroup(groupName, userId){
    await db.groups.insertOne({group_name: groupName, members: [{_userId: userId, balance: 0}]})
}

async function deleteExpense(expenseId, groupId, userId){
    const expense = await db.expenses.findOne({_id: expenseId})
    if(!expense._userId.equals(userId)){
        return false
    }
    const group = await db.groups.findOne({_id: groupId})
    group.members.map((member) => {
        const foundMember = expense.share.find(sharer => sharer._userId.equals(member._userId))
        if(foundMember){
            foundMember._userId.equals(userId) ? 
            member.balance -= expense.amount - foundMember.share : 
            member.balance += foundMember.share
        }
    })
    await db.groups.findOneAndUpdate({_id: group._id}, {$set: {members: group.members}})
    await db.expenses.findOneAndDelete({_id: expense._id})
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
    deleteExpense
}