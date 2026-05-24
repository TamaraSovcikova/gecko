require('dotenv').config();
const mongoose = require('mongoose');
const Expense = require('../src/models/Expense');

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set. Add it to server/.env before running this script.');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI);

async function clear() {
  await Expense.deleteMany({});
  console.log('All expenses deleted');
  process.exit();
}

clear();