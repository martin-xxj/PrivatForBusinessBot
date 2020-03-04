require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api');
const fetch = require("node-fetch");
//const schedule = require('node-schedule');
const bot = new TelegramBot(process.env.TOKEN, { polling: true });
const privatURL = 'https://otp24.privatbank.ua/v3/api/1/info/currency/get';

bot.onText(/.*/, async (msg) => {
    const chatId = msg.chat.id;
    const json = await (await fetch(privatURL)).json();
    const Brate = parseFloat(json.USD.B.rate).toFixed(2);
    const Srate = parseFloat(json.USD.S.rate).toFixed(2);
    const message = `USD купівля: ${Brate}\nUSD продаж: ${Srate}`
    bot.sendMessage(chatId, message);
});