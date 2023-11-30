import db from "../database/connection.js"
import { ObjectId } from "mongodb"
import { getExchangeRate } from "../util/currencyUtil.js"

async function insertPayment( groupId, userId, currency, amount){
    const timestamp = new Date().toLocaleDateString("da-DK", {weekday: "long", year: "numeric", month: "long", hour: "numeric", minute: "numeric"})
    const response = await db.payments.insertOne({_userId: new ObjectId(userId), _groupId: new ObjectId(groupId), currency, amount, timestamp})
    return response
}

function calculateBalance(member, groupShare){
    member.balance = member.front - groupShare + member.paid   
}

async function calculateExchangeRate(member, currency, amount, group){
    if(currency !== "DKK"){
        const exchangedAmount = await getExchangeRate(amount, currency) 
        member.front += exchangedAmount
        return group.total_sum += exchangedAmount
    } else {
        member.front += amount
        return group.total_sum += amount
    }
}

async function findGroup(groupId){
        const group = await db.groups.findOne({_id: new ObjectId(groupId)})
        return group
}

async function findMember(sessionUserId, group){
    const userId = new ObjectId(sessionUserId)
    const member = group.members.find(member => member._userId.equals(userId))
    return member
}


export default {
    insertPayment,
    calculateBalance,
    calculateExchangeRate,
    findGroup,
    findMember
    
}