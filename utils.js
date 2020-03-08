const normalizeDate = (date) => {
  const [d, t] = date.split(' ');
  const [day, m, y] = d.split('-');
  return [[y, m, day].join('-'), t].join('T');
};

module.exports.normalizeDate = normalizeDate;
module.exports.isUpdated = (date) => {
  const d = Date.parse(normalizeDate(date));
  const today = new Date();
  const now = Date.parse(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`);
  return now > d;
};

module.exports.seasonIcons = {
  0: '❄',
  1: '❄',
  2: '🌼',
  3: '🌼',
  4: '🌼',
  5: '☀',
  6: '☀',
  7: '☀',
  8: '🍁',
  9: '🍁',
  10: '🍁',
  11: '❄',
};
