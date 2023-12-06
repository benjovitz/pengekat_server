import Router from "express"
const router = Router()

import { ObjectId } from "mongodb"

import { checkSession } from "../middleware/authMiddleware.js"
import groupsService from "../service/groupsService.js"

router.use(checkSession)

router.get("/api/groups/:groupId/balance", async (req, res) => {
    try {
        const group = await groupsService.findGroup(new ObjectId(req.params.groupId))
        const member = groupsService.findMember(new ObjectId(req.session.userId), group)
        res.send({data: {
            balance: member.balance
        }})

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
    const {amount, currency, equalShare, customShare} = req.body
    const groupId = new ObjectId(req.params.groupId)
    try {
        const expenseResponse = await groupsService.addExpense(groupId, req.session.userId, currency, amount, equalShare, customShare)
        const group = await groupsService.findGroup(groupId)
        const exchangedAmount = await groupsService.calculateExchangeRate(currency, amount) 

        await groupsService.updateBalance(group, expenseResponse.insertedId, req.session.userId, exchangedAmount)
        res.sendStatus(200)
    } catch (error) {
        res.sendStatus(500)
    }
    
})


//create group
router.post("/groups", (req, res) => {
    
})

//leave group (if you have no unpaid money)

//modify group

//pay, all what member owes. paid: true and is owed

//add member to group, make sure we that the new member doesnt have to pay for the everything before they were added

//get group



export default router