import { MongoClient } from 'mongodb';
import 'dotenv/config';

const url = process.env.MONGO_PORT;
const client = new MongoClient(url);
await client.connect();

const db = await client.db('pengekat');

export default {
  users: db.collection('users'),
  groups: db.collection('groups'),
  currencies: db.collection('currencies'),
  expenses: db.collection('expenses'),
  messages: db.collection('messages'),
};
