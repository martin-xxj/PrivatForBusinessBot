module.exports = {
  timeZone: 'Europe/Kiev',
  privatURL: 'https://otp24.privatbank.ua/v3/api/1/info/currency/get',
  mongoURL: `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ds233320.mlab.com:33320/privatbot-users`,
};
