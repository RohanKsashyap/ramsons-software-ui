const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

const getAppDataPath = (filename) => {
  return path.join(__dirname, '../', filename);
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

module.exports = {
  getAppDataPath,
  formatCurrency,
  formatDate,
  isDev,
};