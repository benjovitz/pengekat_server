import Router from "express"
const router = Router()

import db from "../database/connection.js"
import { ObjectId } from "mongodb"

import { checkSession } from "../middleware/authMiddleware.js"
import groupsService from "../service/groupsService.js"

router.use(checkSession)

router.get("/groups/:groupId/front", async (req, res) => {
    try {
        const group = await groupsService.findGroup(req.params.groupId)
        const member = await groupsService.findMember(req.session.userId, group)

        res.send({data: {
            front: member.front,
            balance: member.balance,
            paid: member.paid
        }})

    } catch (error) {
        res.sendStatus(500)
    }
})
//make it possible to not share between every1 in group and leave some out of the payment
router.post("/groups/:groupId/front", async (req, res) => {
    const {amount, currency} = req.body
    const groupId = req.params.groupId

    try {
        const paymentLog = await groupsService.insertPayment(groupId, req.session.userId, currency, amount)
        const group = await groupsService.findGroup(req.params.groupId)
        const member = await groupsService.findMember(req.session.userId, group)
        const newSum = await groupsService.calculateExchangeRate(member, currency, amount, group) 
        const newLog = [...group.log, paymentLog.insertedId]

        group.members.map(member => groupsService.calculateBalance(member, (newSum/group.members.length)))
        
        await db.groups.findOneAndUpdate({_id: new ObjectId(groupId)}, {$set: {total_sum: newSum, log: newLog, members: [...group.members]}})
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
    res.send({data: "New front added to group and split evenly"})
})


//create group
router.post("/groups", (req, res) => {
    
})

//leave group (if you have no unpaid money)

//modify group

//pay

//add member to group, make sure we that the new member doesnt have to pay for the everything before they were added

//get group



export default router