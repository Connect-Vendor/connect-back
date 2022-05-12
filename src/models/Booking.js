const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
  service: {
    type: mongoose.Schema.ObjectId,
    ref: 'Service',
    required: [true, 'Booking must have a tour'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must have a User'],
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price'],
  },
  payment_reference: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

Schema.pre(/^find/, async function (next) {
  this.populate('user').populate('service');

  next();
});

const Model = mongoose.model('Booking', Schema);

module.exports = Model;
