
import { ObjectId } from "mongodb";
import groupsService from "../service/groupsService.js";

export async function checkPartOfGroup(req, res, next){
    try {
        const group = await groupsService.findGroup(new ObjectId(req.params.groupId))
        const memberStatus = group.members.findIndex(member => new ObjectId(member._userId).equals(new ObjectId(req.session.userId)))
    
        if(memberStatus === -1){
            res.sendStatus(401)
        } else {
            next()
        }   
    } catch (error) {
        res.sendStatus(500)
    }
   
}