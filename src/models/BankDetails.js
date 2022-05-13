const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    bank_name: String,
    account_name: String,
    account_number: String,
    account_code: String,
    bank_code: String,
    split_code: String,
    owner: {type :mongoose.Types.ObjectId, ref: 'Vendor'},
    status: {type: Number, default: 1},
    date_created: {type: Date, default: Date.now()}
});

const Model = mongoose.model('Account', Schema);

module.exports = Model;