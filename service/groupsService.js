import db from "../database/connection.js"
import { ObjectId } from "mongodb"
import { getExchangeRate } from "../util/currencyUtil.js"

async function insertEntry( groupId, userId, currency, amount){
    const timestamp = new Date().toLocaleDateString("da-DK", {weekday: "long", year: "numeric", month: "long", hour: "numeric", minute: "numeric"})
    const response = await db.entries.insertOne({_userId: new ObjectId(userId), _groupId: groupId, currency, amount, timestamp})
    return response
}

async function findBalance(member, groupId){
    const userId = new ObjectId(member._userId)
    const entries = await db.entries.find({_userId: userId, _groupId: groupId}).toArray()
    const entryIds = entries.map(entry => entry._id)
    const missingToUser = await db.payments.find({_entryId: {$in: entryIds}, paid: false}).toArray()
    const missingFromUser = await db.payments.find({_userId: userId, paid: false}).toArray()
    const balance = calculateBalance(missingToUser, missingFromUser)
    return balance
}

findBalance({_userId: "65648831acc0de3c896609b6"}, new ObjectId("65649807acc0de3c896609bd"))

function calculateBalance(missingToUser, missingFromUser){
let balance = 0

missingToUser.map(payment => balance += payment.amount)
missingFromUser.map(payment => balance -= payment.amount)
return balance
}

async function calculateExchangeRate(currency, amount){
    if(currency !== "DKK"){
        const exchangedAmount = await getExchangeRate(amount, currency) 
        return exchangedAmount
    } 
    return amount
}

async function findGroup(groupId){
        const group = await db.groups.findOne({_id: groupId})
        return group
}

async function findMember(sessionUserId, group){
    const userId = new ObjectId(sessionUserId)
    const member = group.members.find(member => member._userId.equals(userId))
    return member
}

//skal laves om eller deles op

async function insertPayments(payingMember, group, entryId, exchangedAmount, unExchangedAmount, currency){
    const share = exchangedAmount / group.members.length 
    const entryIdOBJ = new ObjectId(entryId)
    if(currency !== "DKK"){
        const originalAmount = unExchangedAmount / group.members.length 
        await db.payments.insertOne({_entryId: entryIdOBJ, _userId: new ObjectId(payingMember), amount: share, paid: true, originalAmount, originalCurrency: currency})
        group.members.filter(member => !member._userId.equals(new ObjectId(payingMember))).map(async(member) => {
        await db.payments.insertOne({_entryId: entryIdOBJ, _userId: new ObjectId(member._userId), amount: share, paid: false, originalAmount, originalCurrency: currency})})
    } else {
        await db.payments.insertOne({_entryId: entryIdOBJ, _userId: new ObjectId(payingMember), amount: share, paid: true})
        group.members.filter(member => !member._userId.equals(new ObjectId(payingMember))).map(async(member) => {
        await db.payments.insertOne({_entryId: entryIdOBJ, _userId: new ObjectId(member._userId), amount: share, paid: false})})
    }
    
}


export default {
    insertPayments,
    findBalance,
    calculateExchangeRate,
    findGroup,
    findMember,
    insertEntry
}