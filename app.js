import express from "express"
import helmet from "helmet"

const app = express()
app.use(helmet())
app.use(express.json())

import "dotenv/config"

import session from "express-session"
app.set('trust proxy', 1)

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}))

import authRouter from "./routers/authRouter.js"
app.use(authRouter)

import groupsRouter from "./routers/groupsRouter.js"
app.use(groupsRouter)

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
    console.log(`server started on ${PORT}`)
})