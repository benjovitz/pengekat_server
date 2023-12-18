import db from "./connection.js"

import { users, currencies, groups, expenses, messages} from "./data/startData.js"

await db.groups.deleteMany({})
await db.users.deleteMany({})
await db.expenses.deleteMany({})
await db.messages.deleteMany({})


await db.users.insertMany(users)
await db.expenses.insertMany(expenses)
await db.groups.insertMany(groups)
await db.messages.insertMany(messages)
