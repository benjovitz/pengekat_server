import Router from 'express';

import { ObjectId } from 'mongodb';
import groupsService from '../service/groupsService.js';

import { checkSession } from '../middleware/authMiddleware.js';
import { checkPartOfGroup } from '../middleware/groupMiddleware.js';

const router = Router();

router.get('/api/groups/:groupId/expenses', checkSession, checkPartOfGroup, async (req, res) => {
  try {
    const group = await groupsService.findGroup(new ObjectId(req.params.groupId));
    const member = groupsService.findMember(new ObjectId(req.session.userId), group);
    const response = await groupsService.debtCalculator(group, member);
    await groupsService.addGroupNames(response);
    response ? res.send({ data: response }) : res.status(409).send({ data: 'nothing to pay' });
  } catch (error) {
    res.status(500).send({ data: 'something went wrong, please try again later' });
  }
});

router.get('/api/groups/:groupId/pay', checkSession, checkPartOfGroup, async (req, res) => {
  try {
    const group = await groupsService.findGroup(new ObjectId(req.params.groupId));
    const member = groupsService.findMember(new ObjectId(req.session.userId), group);
    const updatedGroup = await groupsService.payDebt(group, member);
    await groupsService.addGroupNames(updatedGroup);
    req.app.get('io').in(req.params.groupId).emit('update-group', { data: updatedGroup });
    res.send({ data: 'payment was successful' });
  } catch (error) {
    res.status(500).send({ data: 'something went wrong, please try again later' });
  }
});

router.post('/api/groups/:groupId/expenses', checkSession, checkPartOfGroup, async (req, res) => {
  const {
    amount, currency, comment, shareOverview,
  } = req.body;
  try {
    const groupId = new ObjectId(req.params.groupId);
    const group = await groupsService.findGroup(groupId);
    const exchangeRate = await groupsService.calculateExchangeRate(currency);
    const exchangedAmount = groupsService.calculateAmount(amount, exchangeRate);
    const shareWithId = shareOverview.map((member) => member = { _userId: new ObjectId(member.userId), share: member.share });
    const { insertedId, expense } = await groupsService.addExpense(groupId, new ObjectId(req.session.userId), currency, comment, amount, shareWithId, exchangedAmount, exchangeRate);
    const updatedGroup = await groupsService.updateBalance(group, insertedId, new ObjectId(req.session.userId), exchangedAmount, exchangeRate);
    await groupsService.addGroupNames(updatedGroup);
    req.app.get('io').in(req.params.groupId).emit('update-group', { data: updatedGroup });
    req.app.get('io').in(req.params.groupId).emit('new-message', { data: expense });
    res.send({ data: 'expense added' });
  } catch (error) {
    res.status(500).send({ data: 'something went wrong, please try again later' });
  }
});

router.delete('/api/groups/:groupId/expenses', checkSession, checkPartOfGroup, async (req, res) => {
  const { expenseId } = req.body;
  const groupId = new ObjectId(req.params.groupId);
  try {
    const updatedGroup = await groupsService.deleteExpense(new ObjectId(expenseId), groupId, new ObjectId(req.session.userId));
    if (updatedGroup) {
      await groupsService.addGroupNames(updatedGroup);
      req.app.get('io').in(req.params.groupId).emit('update-group', { data: updatedGroup });
      req.app.get('io').in(req.params.groupId).emit('update-messages', { data: expenseId });
    }

    updatedGroup ? res.send({ data: 'expense deleted' }) : res.status(401).send({ data: 'You can only delete your own expenses' });
  } catch (error) {
    res.status(500).send({ data: 'something went wrong, please try again later' });
  }
});

export default router;
