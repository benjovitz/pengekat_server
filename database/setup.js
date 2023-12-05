import db from "./connection.js"

import { users, currencies, groups, entriesLog, paymentLogs} from "./data/startData.js"

await db.groups.deleteMany({})
await db.payments.deleteMany({})
await db.users.deleteMany({})
await db.currencies.deleteMany({})
await db.entries.deleteMany({})


await db.users.insertMany(users)
await db.payments.insertMany(paymentLogs)
await db.entries.insertMany(entriesLog)
await db.groups.insertMany(groups)
await db.currencies.insertMany(currencies)
