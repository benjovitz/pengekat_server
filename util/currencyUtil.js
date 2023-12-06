import "dotenv/config"
import db from "../database/connection.js"

export async function getExchangeRate(amount, currency){
        try {
                const cachedCurrency = await db.currencies.findOne({currency_code: currency})
                const now = Date.now()             
                
                        console.log("FROM API")
                        const response = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=${process.env.CURRENCY_API_KEY}&currencies=${currency}&base_currency=DKK`)
                        const result = await response.json()
                        const exchangeRate = Object.values(result.data)[0]
                        cachedCurrency ?
                        await db.currencies.findOneAndReplace({_id: cachedCurrency._id }, {...cachedCurrency, timestamp: Date.now(), exchange_rate: exchangeRate}):
                        await db.currencies.insertOne({currency_code: currency, exchange_rate:exchangeRate, timestamp: now})
                        console.log(result)
                        const exchangedAmount = amount / exchangeRate
                        return Number(exchangedAmount.toFixed(2)) 
                           
                //return Number((amount/cachedCurrency.exchangeRate).toFixed(2)) 
        } catch (error) {
                return undefined
        }

        
}

