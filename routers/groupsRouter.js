import Router from "express"
const router = Router()

import { ObjectId } from "mongodb"

import { checkSession } from "../middleware/authMiddleware.js"
import groupsService from "../service/groupsService.js"

router.use(checkSession)

router.get("/api/groups/:groupId/balance", async (req, res) => {
    try {
        const member = await groupsService.findMember(req.session.userId, group)

        const balance = await groupsService.findBalance(member, new ObjectId(req.params.groupId))

        res.send({data: {balance}})

    } catch (error) {
        res.sendStatus(500)
    }
})
//make it possible to not share between every1 in group and leave some out of the payment!! i morgen 
/* 
[
    {userId: "noget",
amount: 200
},
{userId: "noget andet",
amount: 200 
}

 ]
*/
router.post("/api/groups/:groupId/front", async (req, res) => {
    const {amount, currency, ...share} = req.body
    const groupId = new ObjectId(req.params.groupId)

    try {
        const entryLog = await groupsService.insertEntry(groupId, req.session.userId, currency, amount)
        const group = await groupsService.findGroup(groupId)
        const exchangedAmount = await groupsService.calculateExchangeRate(currency, amount) 
        await groupsService.insertPayments(req.session.userId, group, entryLog.insertedId, exchangedAmount, amount, currency)

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