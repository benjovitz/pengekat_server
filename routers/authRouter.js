import { Router } from "express";
const router = Router()

import "dotenv/config"
import { bodyCheck, loginCheck, usernameCheck } from "../middleware/authMiddleware.js";
import db from "../database/connection.js"
import bcrypt from "bcrypt"



router.get("/auth/signOut", (req, res) => {
    delete req.session.userId
    res.send({data: "Signed out"})
})

router.post("/auth/signIn", bodyCheck, loginCheck, (req, res) => {
    res.send({data: "Successful sign in"})
})

router.post("/auth/signUp", bodyCheck, usernameCheck, async (req, res) => {
    //TODO: add email, maybe look at firebase auth
    try {

        const hashedPassword = await bcrypt.hash(req.body.password, Number(process.env.SALT_ROUNDS))
        console.log(hashedPassword)
        await db.users.insertOne({username: req.body.username.toLowerCase(), password: hashedPassword})

    } catch (error) {
        res.sendStatus(500)
    }
    res.send({data: "Successful sign up"})
})

export default router