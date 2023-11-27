import "dotenv/config"

export async function exchange(amount, currency){

        const response = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=${process.env.CURRENCY_API_KEY}&currencies=${currency}&base_currency=DKK`)
        const result = await response.json()
        const exchangeRate = Object.values(result.data)[0]
        const exchangedAmount = amount / exchangeRate
        return exchangedAmount.toFixed(2)
}
