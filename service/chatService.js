import db from "../database/connection.js"

async function getMessages(groupId){
    const messages = await db.messages.find({_groupId: groupId}).toArray()
    return messages
}

function createChatLogs(messages, expenses){
    const chatLogs = messages.concat(expenses)
    chatLogs.map(message => {
        const [day, month, yearHour, minute] = message.timestamp.split(".")
        const [year, hour] = yearHour.split(" ")
        message.timestampSort = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`)
    })
    
    chatLogs.sort((a,b) => {
        return a.timestampSort - b.timestampSort
    })
    return chatLogs
}


export default {
    getMessages,
    createChatLogs
}