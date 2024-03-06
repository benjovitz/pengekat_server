import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import * as emailValidator from 'email-validator';
import db from '../database/connection.js';

export function bodyCheck(req, res, next) {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    res.status(400).send({ data: 'Please fill out all fields' });
  } else {
    next();
  }
}

export function checkSession(req, res, next) {
  if (!req.session.userId) {
    res.sendStatus(401);
  } else {
    next();
  }
}

export async function loginCheck(req, res, next) {
  const { username, password, email } = req.body;
  try {
    let user;
    username ? user = await db.users.findOne({ username: username.toLowerCase() }) : user = await db.users.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(400).send({ data: 'Wrong credentials' });
    } else {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        res.status(400).send({ data: 'Wrong password' });
      } else {
        req.session.userId = user._id;
        next();
      }
    }
  } catch (error) {
    res.sendStatus(500);
  }
}

export async function usernameCheck(req, res, next) {
  try {
    const user = await db.users.findOne({ username: req.body.username.toLowerCase() });
    if (user) {
      res.status(400).send({ data: 'username already taken' });
    } else {
      next();
    }
  } catch (error) {
    res.sendStatus(500);
  }
}

export async function emailCheck(req, res, next) {
  if (!emailValidator.validate(req.body.email)) {
    res.status(401).send({ data: 'please include valid email' });
  }
  try {
    const user = await db.users.findOne({ email: req.body.email.toLowerCase() });
    if (user) {
      res.status(400).send({ data: 'user with that email already exists' });
    } else {
      next();
    }
  } catch (error) {
    res.send(500);
  }
}
