import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';

import cors from 'cors';

import session from 'express-session';

import http from 'http';

import { Server } from 'socket.io';

import authRouter from './routers/authRouter.js';

import groupsRouter from './routers/groupsRouter.js';

import expensesRouter from './routers/expensesRouter.js';

import messagesRouter from './routers/messageRouter.js';

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({
  credentials: true,
  origin: true,
}));
app.set('trust proxy', 1);

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
});
app.use(sessionMiddleware);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['*'],
  },
});

const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);
io.use(wrap(sessionMiddleware));

io.on('connection', (socket) => {
  socket.on('join-room', (data) => {
    socket.join(data);
  });
  socket.on('leave-room', (data) => {
    socket.leave(data);
  });
  socket.on('message-from-client', (data) => {
    console.log(data);
    io.in(data.groupId).emit('new-message', { data: { comment: data.comment, _userId: data._userId, username: data.username } });
  });
});

app.set('io', io);
app.use(authRouter);
app.use(groupsRouter);
app.use(expensesRouter);
app.use(messagesRouter);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`server started on ${PORT}`);
});
