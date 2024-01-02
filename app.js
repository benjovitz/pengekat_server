import "dotenv/config"
import express from "express"
import helmet from "helmet"

const app = express()
app.use(helmet())
app.use(express.json())

import cors from "cors"
app.use(cors({
  credentials: true,
  origin: true
}))

import session from "express-session"
app.set('trust proxy', 1)

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
})
app.use(sessionMiddleware)

import http from "http"
const server = http.createServer(app)

import { Server } from "socket.io"
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["*"],
  }
})

const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)
io.use(wrap(sessionMiddleware))

io.on("connection", (socket) => {
    socket.on("join-room", (data) => {
    socket.join(data)
    })
    socket.on("leave-room", (data) => {
      socket.leave(data)
    })
    socket.on("message-from-client", (data) => {
      io.in(data.groupId).emit("new-message", {data: {comment: data.comment, _userId: data._userId}})
    })
  }) 

app.set("io", io)

import authRouter from "./routers/authRouter.js"
app.use(authRouter)

import groupsRouter from "./routers/groupsRouter.js"
app.use(groupsRouter)

import usersRouter from "./routers/usersRouter.js"
app.use(usersRouter)


const PORT = process.env.PORT || 8080
server.listen(PORT, () => {
    console.log(`server started on ${PORT}`)
})

