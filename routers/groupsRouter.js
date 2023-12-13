import Router from "express"
const router = Router()

import { ObjectId } from "mongodb"

import { checkSession } from "../middleware/authMiddleware.js"
import { checkPartOfGroup } from "../middleware/groupMiddleware.js"
import groupsService from "../service/groupsService.js"

router.use(checkSession)

router.get("/api/groups", async (req, res) => {
    try {
        const groups = await groupsService.getAllGroups(new ObjectId(req.session.userId))
        groups.map((group) => {
           group.members =  group.members.filter((member) => member._userId.equals(new ObjectId(req.session.userId)))
        })
        res.send({data: groups})
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router.get("/api/groups/:groupId/balance", checkPartOfGroup,  async (req, res) => {
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

router.get("/api/groups/:groupId/leave", checkPartOfGroup, async (req, res) => {
    try {
        const group =  await groupsService.findGroup(new ObjectId(req.params.groupId))
        const response = await groupsService.removeMember(new ObjectId(req.session.userId), group)
        response ? res.send(200) : res.status(404).send({data: "Cant leave group until your balance is 0"})
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router.get("/api/groups/:groupId/pay", checkPartOfGroup, async (req, res) => {
    try {
        const group = await groupsService.findGroup(new ObjectId(req.params.groupId))
        const member = groupsService.findMember(new ObjectId(req.session.userId), group)
        await groupsService.payDebt(group, member)
        res.end()
    } catch (error) {
        res.sendStatus(500)
    }
})

router.post("/api/groups", async (req, res) => {
    const {groupName} = req.body
    try {
        await groupsService.createGroup(groupName, new ObjectId(req.session.userId))
        res.sendStatus(200)
    } catch (error) {
        res.sendStatus(500)
    }
})

router.post("/api/groups/:groupId/expense", checkPartOfGroup,  async (req, res) => {
    const {amount, currency, comment, shareOverview} = req.body
    try {
        const groupId = new ObjectId(req.params.groupId)
        const group = await groupsService.findGroup(groupId)
        const exchangeRate = await groupsService.calculateExchangeRate(currency) 
        const exchangedAmount = amount / exchangeRate
        const shareWithId = shareOverview.map(member =>  member = {_userId: new ObjectId(member.userId), share: member.share})
        const expenseResponse = await groupsService.addExpense(groupId, new ObjectId(req.session.userId), currency, comment, amount, shareWithId, exchangedAmount)
        await groupsService.updateBalance(group, expenseResponse.insertedId, new ObjectId(req.session.userId), exchangedAmount, exchangeRate)
        res.sendStatus(200)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router.post("/api/groups/:groupId/member", checkPartOfGroup, async (req, res) => {
    const {members} = req.body
    try {
        const group = await groupsService.findGroup(new ObjectId(req.params.groupId))
        const response = await groupsService.addMembers(members, group)
        response ? res.sendStatus(200) : res.sendStatus(404)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router.path("/api/groups/:groupId", checkPartOfGroup, async (req, res) => {
    const {groupName} = req.body
    try {
        await groupsService.modifyGroup(new ObjectId(req.params.groupId), groupName)
        res.sendStatus(200)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

router.delete("/api/groups/:groupId/expense", checkPartOfGroup, async (req, res) => {
    const {expenseId} = req.body
    try {
        const response = await groupsService.deleteExpense(new ObjectId(expenseId), new ObjectId(req.params.groupId), new ObjectId(req.session.userId))
        response ? res.sendStatus(200) : res.status(401).send({data: "You can only delete your own expenses"})
    } catch (error) {
        res.sendStatus(500)
    }
})


export default router