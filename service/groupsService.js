import db from "../database/connection.js"
import { ObjectId } from "mongodb"
import { getExchangeRate } from "../util/currencyUtil.js"

async function addExpense( groupId, userId, currency, amount, equalShare, customShare){
    const timestamp = new Date().toLocaleDateString("da-DK", {day: "2-digit", year: "numeric", month: "2-digit", hour: "numeric", minute: "numeric"})
    const mongoInsert = {_userId: new ObjectId(userId), _groupId: groupId, equalShare, currency, amount, timestamp}
    if(!equalShare){
        mongoInsert.customShare = customShare
    } 
    const response = await db.expenses.insertOne(mongoInsert)
    return response
}

async function calculateExchangeRate(currency, amount){
    if(currency !== "DKK"){
        const exchangedAmount = await getExchangeRate(amount, currency) 
        console.log(exchangedAmount)
        return exchangedAmount
    } 
    return amount
}

async function findGroup(groupId){
        const group = await db.groups.findOne({_id: groupId})
        return group
}

function findMember(userId, group){
    const member = group.members.find(member => member._userId.equals(userId))
    return member
}

async function updateBalance(group, expenseId, payingMember, exchangedAmount){
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
        group.members.map((member) => {
            const foundMember = expense.customShare.find(sharer => new ObjectId(sharer.userId).equals(member._userId))
            if(foundMember){
                console.log(foundMember)
                foundMember.payer ? member.balance += exchangedAmount - foundMember.share : member.balance -= foundMember.share
            }
        })
    }
    group.members.map(member => {
        member.balance = Number(member.balance).toFixed(2)
        member.balance = Number(member.balance)
    })
    await db.groups.findOneAndUpdate({_id: new ObjectId(group._id)}, {$set:{members: [...group.members]}})

}



export default {
    calculateExchangeRate,
    findGroup,
    findMember,
    addExpense,
    updateBalance
}