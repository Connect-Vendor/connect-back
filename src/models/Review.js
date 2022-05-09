const mongoose = require('mongoose');
const Service = require('./Service');

const Schema = new mongoose.Schema({
  review: { type: String, required: [true, 'Review requuired'] },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },

  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must Have a user'],
  },
  service: {
    type: mongoose.Schema.ObjectId,
    ref: 'Service',
    required: [true, 'Review must have a service'],
  },
  createdAt: { type: Date, default: Date.now() },
  status: {
    type: Number,
    default: 1
  }
});

//Prevent dup users
Schema.index({ tour: 1, user: 1 }, { unique: true });

//Query middleware for populating user and tour
Schema.pre(/^find/, function (next) {
  this.populate('user').populate('service');

  next();
});

//Calc Avarage rating for each review
Schema.statics.calcAveRatings = async function (serviceId) {
  const stats = await this.aggregate([
    {
      $match: { service: serviceId },
    },
    {
      $group: {
        _id: '$service',
        nRatings: { $sum: 1 },
        aveRatings: { $avg: '$ratings' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Service.findByIdAndUpdate(serviceId, {
      ratings: stats[0].nRatings,
      ratingsAvg: stats[0].aveRatings,
    });
  } else {
    await Service.findByIdAndUpdate(serviceId, { ratings: 0, ratingsAvg: 4.5 });
  }
};

Schema.post('save', function () {
  this.constructor.calcAveRatings(this.service);
});

Schema.pre(/^findOneAnd/, async function (next) {
  this.currentDoc = await this.findOne();
  next();
});

Schema.post(/^findOneAnd/, async function () {
  await this.currentDoc.constructor.calcAveRatings(this.currentDoc.service);
});

const Model = mongoose.model('Review', Schema);

module.exports = Model;
