import Router from 'express';

import { ObjectId } from 'mongodb';

import { checkSession } from '../middleware/authMiddleware.js';
import { checkPartOfGroup } from '../middleware/groupMiddleware.js';
import groupsService from '../service/groupsService.js';
import { upload } from '../util/imageUtil.js';

const router = Router();

router.get('/api/groups', checkSession, async (req, res) => {
  try {
    const groups = await groupsService.getAllGroups(new ObjectId(req.session.userId));
    groups.map((group) => {
        group.members = group.members.filter((member) => member._userId.equals(new ObjectId(req.session.userId)));
    });
    res.send({ data: groups });
  } catch (error) {
    console.log(error);
    res.status(500).send({ data: 'something went wrong, please try again later' });
  }
});

router.get('/api/groups/:groupId/', checkSession, checkPartOfGroup, async (req, res) => {
  try {
    const group = await groupsService.findGroup(new ObjectId(req.params.groupId));
    await groupsService.addGroupNames(group);
    res.send({ data: group });
  } catch (error) {
    console.log(error);
    res.status(500).send({ data: 'something went wrong, please try again later' });
  }
});

router.get('/api/groups/:groupId/leave', checkSession, checkPartOfGroup, async (req, res) => {
  try {
    const group = await groupsService.findGroup(new ObjectId(req.params.groupId));
    const response = await groupsService.removeMember(new ObjectId(req.session.userId), group);
    response ? res.send({ data: 'you left the group' }) : res.status(400).send({ data: 'Cant leave group until your balance is 0' });
  } catch (error) {
    res.status(500).send({ data: 'something went wrong, please try again later' });
  }
});

router.post('/api/groups', checkSession, async (req, res) => {
  const { groupName } = req.body;
  try {
    await groupsService.createGroup(groupName, new ObjectId(req.session.userId));
    res.send({ data: 'new group created' });
  } catch (error) {
    res.status(500).send({ data: 'something went wrong, please try again later' });
  }
});

router.post('/api/groups/:groupId/members', checkSession, checkPartOfGroup, async (req, res) => {
  const { members } = req.body;
  if (!members) {
    res.sendStatus(404).send({ data: 'need at least 1 member to add to the group' });
  }
  try {
    const group = await groupsService.findGroup(new ObjectId(req.params.groupId));
    const updatedGroup = await groupsService.addMembers(members, group);
    await groupsService.addGroupNames(updatedGroup);
    req.app.get('io').in(req.params.groupId).emit('update-group', { data: updatedGroup });
    res.send({ data: 'member(s) added to group' });
  } catch (error) {
    res.status(500).send({ data: 'something went wrong, please try again later' });
  }
});

router.patch('/api/groups/:groupId', checkSession, checkPartOfGroup, upload.single('image'), async (req, res) => {
  const { groupName } = req.body;
  try {
    if (req.file) {
      await groupsService.uploadGroupImage(req.params.groupId, req.body.photoString);
    }
    if (groupName) {
      await groupsService.modifyGroup(new ObjectId(req.params.groupId), groupName);
    }
    res.send({ data: 'group modified' });
  } catch (error) {
    res.status(500).send({ data: 'something went wrong, please try again later' });
  }
});

export default router;
