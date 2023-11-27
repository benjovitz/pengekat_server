import db from "../database/connection.js"
import bcrypt from "bcrypt"

export function bodyCheck(req, res, next){
    const {username, password, ...rest} = req.body
    if(!username || !password){
        res.status(404).send({data: "Need both username and password"})
    } else {
        next()
    }
}

export function checkSession(req, res, next){
    if(!req.session.userId){
        res.sendStatus(401)
    } else {
        next()
    }
}

export async function loginCheck(req, res, next){
    try {
        const user = await db.users.findOne({username: req.body.username})
        if(!user){
            res.status(404).send({data: `cant find user on username: ${req.body.username}`})
        } else{
            const isValid = await bcrypt.compare(req.body.password, user.password)
            if(!isValid){
                res.send({data: "Wrong password"})
            } else{
                req.session.userId = user._id
                next()
            }
        }
        
    } catch (error) {
        res.sendStatus(500)
    }
}

export async function usernameCheck(req, res, next) {
    try {
        const user = await db.users.findOne({username: req.body.username})
        if(user){
            res.send({data: "username already taken"})
        } else{
            next()
        }   
    } catch (error) {
        res.sendStatus(500)
    }
}