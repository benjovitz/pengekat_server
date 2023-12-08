import db from "../database/connection.js"
import { ObjectId } from "mongodb"
import { getExchangeRate } from "../util/currencyUtil.js"

async function addExpense( groupId, userId, currency, comment, amount, equalShare, customShare){
    const timestamp = new Date().toLocaleDateString("da-DK", {day: "2-digit", year: "numeric", month: "2-digit", hour: "numeric", minute: "numeric"})
    const mongoInsert = {_userId: new ObjectId(userId), _groupId: groupId, equalShare, currency, amount, comment, timestamp}
    if(!equalShare){
        mongoInsert.customShare = customShare
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

async function addMembers(members, group){
    console.log(members)
    const membersId = await db.users.find({username: {$in: members}}).toArray()
    membersId.map((member) => {
        group.members = [...group.members, {_userId: member._id, balance: 0}]
    })
    console.log(group.members)
    await db.groups.findOneAndUpdate({_id: group._id}, {$set: {members: group.members}})
}

async function updateBalance(group, expenseId, payingMember, exchangedAmount, exchangeRate){
    const expense = await db.expenses.findOne({_id: new ObjectId(expenseId)})

    if(expense.equalShare === true){
         group.members.map((member) => {
            if(member._userId.equals(new ObjectId(payingMember))){
                member.balance += exchangedAmount - (exchangedAmount / group.members.length)
            } else {
                member.balance -= (exchangedAmount / group.members.length)
            }
         })
    } else {
        if(expense.currency !== "DKK"){
            expense.customShare.map(member => member.share = member.share / exchangeRate)
        }
        console.log(expense.customShare)
        group.members.map((member) => {
            const foundMember = expense.customShare.find(sharer => new ObjectId(sharer.userId).equals(member._userId))
            if(foundMember){
                foundMember.payer ? member.balance += exchangedAmount - foundMember.share : member.balance -= foundMember.share
            }
        })
    }
    group.members.map(member => member.balance = Number(member.balance.toFixed(2)))
    await db.groups.findOneAndUpdate({_id: new ObjectId(group._id)}, {$set:{members: [...group.members]}})

}



export default {
    calculateExchangeRate,
    findGroup,
    findMember,
    addExpense,
    updateBalance,
    removeMember,
    addMembers
}