import Router from "express"
const router = Router()

import db from "../database/connection.js"
import { ObjectId } from "mongodb"

import { checkSession } from "../middleware/authMiddleware.js"
import { exchange } from "../util/currencyUtil.js"

router.get("/groups/:groupId/front", checkSession, async (req, res) => {
    try {
        const group = await db.groups.findOne({_id: new ObjectId(req.params.groupId)})
        console.log(group.members)
        const member = group.members.find(member => member._userId === req.session.userId)

        const share = member.front - (group.total_sum/group.members.length)
        res.send({data: {
            front: member.front,
            share: share
        }})

    } catch (error) {
        res.sendStatus(500)
    }
})

router.post("/groups/:groupId/front", checkSession, async (req, res) => {
    const {amount, currency} = req.body
    const groupId = req.params.groupId
    try {
        const response = await db.payments.insertOne({_userId: new ObjectId(req.session.userId), _groupId: new ObjectId(groupId), currency, amount})
        const group = await db.groups.findOne({_id: new ObjectId(groupId)})
        const member = group.members.find(member => member._userId === req.session.userId)
        let newSum
        if(currency !== "DKK"){
            const exchangedAmount = await exchange(amount, currency) 
            if(!exchangedAmount){
                res.sendStatus(500)
            }
            newSum = group.total_sum += exchangedAmount
            member.front += exchangedAmount
        } else {
            newSum = group.total_sum += amount
            member.front += amount
        }
        
        const newLog = [...group.log, response.insertedId]
        await db.groups.findOneAndUpdate({_id: new ObjectId(groupId)}, {$set: {total_sum: newSum, log: newLog, members: [...group.members]}})
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
    res.sendStatus(200)
})

export default router