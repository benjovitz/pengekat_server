import { Router } from 'express';

import 'dotenv/config';
import bcrypt from 'bcrypt';
import {
  bodyCheck, loginCheck, usernameCheck, emailCheck,
} from '../middleware/authMiddleware.js';
import db from '../database/connection.js';

const router = Router();

router.get('/auth/signOut', (req, res) => {
  delete req.session.userId;
  res.send({ data: 'Signed out' });
});

router.post('/auth/signIn', loginCheck, (req, res) => {
  res.send({
    data: {
      message: 'Successful sign in',
      userId: req.session.userId,
    },
  });
});

router.post('/auth/signUp', bodyCheck, usernameCheck, emailCheck, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, Number(process.env.SALT_ROUNDS));
    await db.users.insertOne({ username: req.body.username.toLowerCase(), password: hashedPassword, email: req.body.email });
    res.send({ data: 'Successful sign up' });
  } catch (error) {
    res.sendStatus(500);
  }
});

export default router;
