import Router from "express"
const router = Router()

import { ObjectId } from "mongodb"

import { checkSession } from "../middleware/authMiddleware.js"
import { checkPartOfGroup } from "../middleware/groupMiddleware.js"
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

router.get("/api/groups/:groupId/leave", async (req, res) => {
    try {
        const group =  await groupsService.findGroup(new ObjectId(req.params.groupId))
        const response = await groupsService.removeMember(new ObjectId(req.session.userId), group)
        response ? res.send(200) : res.status(404).send({data: "Cant leave group until your balance is 0"})
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router.post("/api/groups/:groupId/front",  async (req, res) => {
    const {amount, currency, comment, equalShare, customShare} = req.body
    try {
        const groupId = new ObjectId(req.params.groupId)
        const expenseResponse = await groupsService.addExpense(groupId, req.session.userId, currency, comment, amount, equalShare, customShare)
        const group = await groupsService.findGroup(groupId)
        const exchangeRate = await groupsService.calculateExchangeRate(currency) 
        const exchangedAmount = amount / exchangeRate
        await groupsService.updateBalance(group, expenseResponse.insertedId, req.session.userId, exchangedAmount, exchangeRate)
        res.sendStatus(200)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router.post("/api/groups/:groupId/member", async (req, res) => {
    const {members} = req.body
    try {
        const group = await groupsService.findGroup(new ObjectId(req.params.groupId))
        await groupsService.addMembers(members, group)
        res.sendStatus(200)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})




//create group
router.post("/groups", (req, res) => {
    
})

//delete expense, update balance

//leave group (if you have no unpaid money)

//modify group

//pay, all what member owes. paid: true and is owed


//get group



export default router