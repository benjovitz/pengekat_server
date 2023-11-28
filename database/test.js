import db from "./connection.js"


db.currencies.findOneAndReplace({currency_code: "EUR"}, {timestamp: Date.now()})