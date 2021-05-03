/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');
const { CronJob } = require('cron');
const mongoose = require('mongoose');
const User = require('./user.js');
const { isUpdated, normalizeDate, seasonIcons } = require('./utils.js');
const { timeZone, privatURL } = require('./config.js');

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to db.'))
  .catch((err) => console.log(err));

const bot = new TelegramBot(process.env.TOKEN, { polling: true });
const fetchPB = async () => (await fetch(privatURL)).json();
let isDataFetched = false;
// eslint-disable-next-line no-use-before-define

const sendRateMessage = async (id, { B, S }) => {
  const f2 = (value, decimal = 2) => parseFloat(value).toFixed(decimal);
  const delta = (value) => `${value < 0 ? '⬇' : '⬆'} ${f2(value)}`;
  const date = new Date(normalizeDate(B.date));
  const icon = seasonIcons[date.getMonth()];
  const formatter = new Intl.DateTimeFormat('uk', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const message = `\`\`\`
  Останнє оновлення:
  ${icon} ${formatter.format(date)}
  💵 USD купівля: ${f2(B.rate)} ${delta(B.rate_delta)}
  💵 USD продаж:  ${f2(S.rate)} ${delta(S.rate_delta)}
  \`\`\``;
  bot.sendMessage(id, message, { parse_mode: 'Markdown' });
};
const usersForAll = async (cb) => {
  const ids = (await User.find()).map((user) => user._id);
  ids.forEach(cb);
};


async function fetchData() {
  const { USD } = await fetchPB();
  if (!isUpdated(USD.B.date) || !isUpdated(USD.S.date)) {
    return null;
  }
  isDataFetched = true;
  return USD;
}

const fetchDataJob = new CronJob({
  cronTime: '* * * * *',
  onTick: async () => {
    const data = await fetchData();
    if (data) {
      fetchDataJob.stop();
      usersForAll((user) => sendRateMessage(user, data));
    }
  },
  start: false,
  timeZone,
});

const weekDayJob = new CronJob({
  cronTime: '0 10 * * 1-5',
  onTick: () => {
    isDataFetched = false;
    fetchDataJob.start();
  },
  start: false,
  timeZone,
});
weekDayJob.start();

const weekDayCancelJob = new CronJob({
  cronTime: '30 10 * * 1-5',
  onTick: () => {
    if (!isDataFetched) {
      fetchDataJob.stop();
    }
  },
  start: false,
  timeZone,
});
weekDayCancelJob.start();

bot.onText(/^\/subscribe$/, async ({ chat: { id, username } }) => {
  if (await User.findById(id)) {
    bot.sendMessage(id, '❗ Ви уже підписані на розсилку');
    return;
  }
  const user = new User({ _id: id, username });
  await user.save();
  bot.sendMessage(id, '✅ Ви успішно підписалися на розсилку');
});

bot.onText(/^\/unsubscribe$/, async ({ chat: { id } }) => {
  await User.findByIdAndDelete(id);
  bot.sendMessage(id, '🔕 Ви успішно відписалися від розсилки');
});

bot.onText(/^\/rate$/, async ({ chat: { id } }) => {
  const { USD } = await fetchPB();
  sendRateMessage(id, USD);
});

bot.onText(/^\/start$/, async ({ chat: { id } }) => {
  bot.sendMessage(id, '/subscribe — підписатися не щоденну розсилку курсу\n/unsubscribe — відписатися від розсилки \n/rate — дізнатися поточний курс');
});

bot.onText(/^\/users$/, async ({ chat: { id } }) => {
  if (id != process.env.ADMIN_ID) return;
  const usernames = (await User.find({}, { _id: false, username: true })).map(doc => doc.username);
  bot.sendMessage(id, [
    ...usernames,
    '-'.repeat(20),
    `${usernames.length} total`,
  ].join('\n'));
});
