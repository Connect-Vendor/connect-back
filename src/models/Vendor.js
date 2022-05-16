const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    vendor_id: {type: mongoose.Types.ObjectId, ref: 'User'},
    business_name: {type: String, unique: true, required: [true, 'Business name is required']},
    location: [Object],
    vendor_code: {type: String, unique: true},
    phone: String,
    decription: String,
    business_logo: {type: String, default: 'public/vendors/logo.png'},
    date_created: {type: Date, default: Date.now()},
    status: {type: Number, default: 1}
});

const Model= mongoose.model('Vendor', Schema);

module.exports = Model;