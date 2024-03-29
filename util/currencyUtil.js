import 'dotenv/config';
import db from '../database/connection.js';

export default async function getExchangeRate(currency) {
  try {
    const cachedCurrency = await db.currencies.findOne({ currency_code: currency });
    const now = Date.now();
    if (!cachedCurrency || now > (cachedCurrency.timestamp + 86400000)) {
      const response = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=${process.env.CURRENCY_API_KEY}&currencies=${currency}&base_currency=DKK`);
      const result = await response.json();
      const exchangeRate = Object.values(result.data)[0];
      cachedCurrency
        ? await db.currencies.findOneAndReplace({ _id: cachedCurrency._id }, { ...cachedCurrency, timestamp: Date.now(), exchange_rate: exchangeRate })
        : await db.currencies.insertOne({ currency_code: currency, exchange_rate: exchangeRate, timestamp: now });
      return exchangeRate;
    }
    return cachedCurrency.exchange_rate;
  } catch (error) {
    return undefined;
  }
}
