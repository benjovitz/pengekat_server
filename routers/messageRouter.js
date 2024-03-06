import { Router } from 'express';

import { ObjectId } from 'mongodb';
import chatService from '../service/chatService.js';
import groupsService from '../service/groupsService.js';

import { checkSession } from '../middleware/authMiddleware.js';
import { checkPartOfGroup } from '../middleware/groupMiddleware.js';

const router = Router();

router.get('/api/groups/:groupId/messages', checkSession, checkPartOfGroup, async (req, res) => {
  try {
    const groupId = new ObjectId(req.params.groupId);
    const group = await groupsService.findGroup(groupId);
    await groupsService.addGroupNames(group);
    const messages = await chatService.getMessages(groupId);
    const expenses = await groupsService.getExpenses(groupId);
    const chatLogs = chatService.createChatLogs(messages, expenses, group);
    res.send({ data: chatLogs });
  } catch (error) {
    res.status(500).send({ data: 'something went wrong, please try again later' });
  }
});

router.post('/api/groups/:groupId/messages', checkSession, checkPartOfGroup, async (req, res) => {
  const { comment } = req.body;
  try {
    await chatService.addMessage(new ObjectId(req.session.userId), new ObjectId(req.params.groupId), comment);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send({ data: 'something went wrong, please try again later' });
  }
});

export default router;
