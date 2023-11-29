import Router from "express"
const router = Router()

import db from "../database/connection.js"
import { ObjectId } from "mongodb"

import { checkSession } from "../middleware/authMiddleware.js"
import { exchange } from "../util/currencyUtil.js"

router.use(checkSession)

router.get("/groups/:groupId/front", async (req, res) => {
    try {
        const group = await db.groups.findOne({_id: new ObjectId(req.params.groupId)})
        const userId = new ObjectId(req.session.userId)
        const member = group.members.find(member => member._userId.equals(userId))

        res.send({data: {
            front: member.front,
            balance: member.balance,
            paid: member.paid
        }})

    } catch (error) {
        res.sendStatus(500)
    }
})

router.post("/groups/:groupId/front", checkSession, async (req, res) => {
    const {amount, currency} = req.body
    const groupId = req.params.groupId
    try {
        const timestamp = new Date().toLocaleDateString("da-DK", {weekday: "long", year: "numeric", month: "long", hour: "numeric", minute: "numeric"})
        const response = await db.payments.insertOne({_userId: new ObjectId(req.session.userId), _groupId: new ObjectId(groupId), currency, amount, timestamp})
        const group = await db.groups.findOne({_id: new ObjectId(groupId)})
        const userId = new ObjectId(req.session.userId)
        const member = group.members.find(member => member._userId.equals(userId))
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
        group.members.map(member => calculateBalance(member, (newSum/group.members.length)))
        const newLog = [...group.log, response.insertedId]
        await db.groups.findOneAndUpdate({_id: new ObjectId(groupId)}, {$set: {total_sum: newSum, log: newLog, members: [...group.members]}})
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
    res.sendStatus(200)
})

function calculateBalance(member, groupShare){
    member.balance = member.front - groupShare + member.paid 
    
}
//create group
router.post("/groups", checkSession, (req, res, next) => {

})

//leave group (if you have no unpaid money)

//modify group

//pay

//add member to group, make sure we that the new member doesnt have to pay for the everything before they were added

//get group



export default router