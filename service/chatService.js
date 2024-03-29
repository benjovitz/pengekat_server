import db from '../database/connection.js';

async function getMessages(groupId) {
  const messages = await db.messages.find({ _groupId: groupId }).toArray();
  return messages;
}

function createChatLogs(messages, expenses, group) {
  const chatLogs = messages.concat(expenses);
  chatLogs.map((message) => {
    const [day, month, yearHour, minute] = message.timestamp.split('.');
    const [year, hour] = yearHour.split(' ');
    message.timestampSort = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
  });

  chatLogs.sort((a, b) => a.timestampSort - b.timestampSort);
  chatLogs.map((message) => {
    const foundMember = group.members.find((member) => message._userId.equals(member._userId));
    if (foundMember) {
      message.username = foundMember.username;
    } else {
      message.username = 'not in group anymore';
    }
  });
  return chatLogs;
}

async function addMessage(userId, groupId, comment) {
  const timestamp = new Date().toLocaleDateString('da-DK', {
    day: '2-digit', year: 'numeric', month: '2-digit', hour: 'numeric', minute: 'numeric',
  });
  const mongoInsert = {
    _userId: userId, _groupId: groupId, comment, timestamp,
  };
  await db.messages.insertOne(mongoInsert);
  return mongoInsert;
}

export default {
  getMessages,
  createChatLogs,
  addMessage,
};
