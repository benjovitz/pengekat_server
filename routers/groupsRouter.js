import Router from "express"
const router = Router()

import { ObjectId } from "mongodb"

import { checkSession } from "../middleware/authMiddleware.js"
import { checkPartOfGroup } from "../middleware/groupMiddleware.js"
import groupsService from "../service/groupsService.js"
import { upload } from "../util/imageUtil.js"


router.get("/api/groups", checkSession, async (req, res) => {
    try {
        const groups = await groupsService.getAllGroups(new ObjectId(req.session.userId))
        groups.map((group) => {
           group.members =  group.members.filter((member) => member._userId.equals(new ObjectId(req.session.userId)))
        })
        res.send({data: groups})
    } catch (error) {
        console.log(error)
        res.status(500).send({data: "something went wrong, please try again later"})
    }
})

router.get("/api/groups/:groupId/", checkSession, checkPartOfGroup,  async (req, res) => {
    try {
        const group = await groupsService.findGroup(new ObjectId(req.params.groupId))
        await groupsService.addGroupNames(group)
        res.send({data: group})
    } catch (error) {
        console.log(error)
        res.status(500).send({data: "something went wrong, please try again later"})
    }
})

/* router.get("/api/groups/:groupId/messages", checkSession, checkPartOfGroup, async(req, res) => {
    try {
        const groupId = new ObjectId(req.params.groupId)
        const messages = await chatService.getMessages(groupId)
        const expenses = await groupsService.getExpenses(groupId)
        const chatLogs = chatService.createChatLogs(messages, expenses)
        res.send({data: chatLogs})
    } catch (error) {
        res.status(500).send({data: "something went wrong, please try again later"})
    }
}) */

router.get("/api/groups/:groupId/leave", checkSession, checkPartOfGroup, async (req, res) => {
    try {
        const group =  await groupsService.findGroup(new ObjectId(req.params.groupId))
        const response = await groupsService.removeMember(new ObjectId(req.session.userId), group)
        response ? res.send({data: "you left the group" }): res.status(400).send({data: "Cant leave group until your balance is 0"})
    } catch (error) {
        res.status(500).send({data: "something went wrong, please try again later"})
    }
})

/* router.get("/api/groups/:groupId/expenses", checkSession, checkPartOfGroup, async (req, res) => {
    try {
        const group =  await groupsService.findGroup(new ObjectId(req.params.groupId))
        const member = groupsService.findMember(new ObjectId(req.session.userId), group)
        const response = await groupsService.debtCalculator(group, member)
        await groupsService.addGroupNames(response)
        response ? res.send({data: response }) : res.send({data: "Nothing to pay"})
    } catch (error) {
        res.status(500).send({data: "something went wrong, please try again later"})
    }

}) */

/* router.get("/api/groups/:groupId/pay", checkSession, checkPartOfGroup, async (req, res) => {
    try {
        const group = await groupsService.findGroup(new ObjectId(req.params.groupId))
        const member = groupsService.findMember(new ObjectId(req.session.userId), group)
        const updatedGroup = await groupsService.payDebt(group, member)
        await groupsService.addGroupNames(updatedGroup)
        req.app.get("io").in(req.params.groupId).emit("update-group", {data: updatedGroup})
        res.send({data: "payment was successful"})
    } catch (error) {
        res.status(500).send({data: "something went wrong, please try again later"})
    }
}) */

router.post("/api/groups", checkSession, async (req, res) => {
    const {groupName} = req.body
    try {
        await groupsService.createGroup(groupName, new ObjectId(req.session.userId))
        res.send({data: "new group created"})
    } catch (error) {
        res.status(500).send({data: "something went wrong, please try again later"})
    }
})

/* router.post("/api/groups/:groupId/expenses", checkSession, checkPartOfGroup,  async (req, res) => {
    const {amount, currency, comment, shareOverview} = req.body
    try {
        const groupId = new ObjectId(req.params.groupId)
        const group = await groupsService.findGroup(groupId)
        const exchangeRate = await groupsService.calculateExchangeRate(currency) 
        const exchangedAmount = groupsService.calculateAmount(amount, exchangeRate)
        const shareWithId = shareOverview.map(member =>  member = {_userId: new ObjectId(member.userId), share: member.share})
        const {insertedId, expense} = await groupsService.addExpense(groupId, new ObjectId(req.session.userId), currency, comment, amount, shareWithId, exchangedAmount, exchangeRate)
        const updatedGroup = await groupsService.updateBalance(group, insertedId, new ObjectId(req.session.userId), exchangedAmount, exchangeRate)
        await groupsService.addGroupNames(updatedGroup)
        req.app.get("io").in(req.params.groupId).emit("update-group", {data: updatedGroup})
        req.app.get("io").in(req.params.groupId).emit("new-message", {data: expense})
        res.send({data: "expense added"})
    } catch (error) {
        res.status(500).send({data: "something went wrong, please try again later"})
    }
}) */

router.post("/api/groups/:groupId/members", checkSession, checkPartOfGroup, async (req, res) => {
    const {members} = req.body
    if(!members){
        res.sendStatus(404).send({data: "need at least 1 member to add to the group"})
    }
    try {
        const group = await groupsService.findGroup(new ObjectId(req.params.groupId))
        const updatedGroup = await groupsService.addMembers(members, group)
        await groupsService.addGroupNames(updatedGroup)
        req.app.get("io").in(req.params.groupId).emit("update-group", {data: updatedGroup})
        res.send({data: "member(s) added to group"})
    } catch (error) {
        console.log(error)
        res.status(500).send({data: "something went wrong, please try again later"})
    }
})

/* router.post("/api/groups/:groupId/messages", checkSession, checkPartOfGroup, async (req, res) => {
    const {comment} = req.body
    try {
        const message = await chatService.addMessage(new ObjectId(req.session.userId), new ObjectId(req.params.groupId), comment)
        res.sendStatus(200)
    } catch (error) {
        console.log(error)
        res.status(500).send({data: "something went wrong, please try again later"})
    }
}) */

router.patch("/api/groups/:groupId", checkSession, checkPartOfGroup, upload.single("image"), async (req, res) => {
    const {groupName} = req.body
    try { 
        if(req.file){
            await groupsService.uploadGroupImage(req.params.groupId, req.body.photoString)
        }
        if(groupName){
            await groupsService.modifyGroup(new ObjectId(req.params.groupId), groupName)
        }
        res.send({data: "group modified"})
    } catch (error) {
        res.status(500).send({data: "something went wrong, please try again later"})
    }
})

/* router.delete("/api/groups/:groupId/expenses", checkSession, checkPartOfGroup, async (req, res) => {
    const {expenseId} = req.body
    const groupId = new ObjectId(req.params.groupId)
    try {
        const updatedGroup = await groupsService.deleteExpense(new ObjectId(expenseId), groupId, new ObjectId(req.session.userId))
        if(updatedGroup){
            await groupsService.addGroupNames(updatedGroup)
            req.app.get("io").in(req.params.groupId).emit("update-group", {data: updatedGroup})
            req.app.get("io").in(req.params.groupId).emit("update-messages", {data: expenseId})    
        }
          
        updatedGroup ? res.send({data: "expense deleted"}) : res.status(401).send({data: "You can only delete your own expenses"})
    } catch (error) {
        console.log(error)
        res.status(500).send({data: "something went wrong, please try again later"})
    }
}) */


export default router