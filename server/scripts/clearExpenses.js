const mongoose = require('mongoose');
const Expense = require('../src/models/Expense');

mongoose.connect('mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>');

async function clear() {
  await Expense.deleteMany({});
  console.log('All expenses deleted');
  process.exit();
}

clear();