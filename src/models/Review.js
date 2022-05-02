const mongoose = require('mongoose');
const Tour = require('./Tour');

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
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must have a tour'],
  },
  createdAt: { type: Date, default: Date.now() },
});

//Prevent dup users
Schema.index({ tour: 1, user: 1 }, { unique: true });

Schema.pre(/^find/, function (next) {
  this.populate('user').populate('tour');

  next();
});

//Calc Avarage rating for each review
Schema.statics.calcAveRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        aveRatings: { $avg: '$ratings' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratings: stats[0].nRatings,
      ratingsAvg: stats[0].aveRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, { ratings: 0, ratingsAvg: 4.5 });
  }
};

Schema.post('save', function () {
  this.constructor.calcAveRatings(this.tour);
});

Schema.pre(/^findOneAnd/, async function (next) {
  this.currentDoc = await this.findOne();
  next();
});

Schema.post(/^findOneAnd/, async function () {
  await this.currentDoc.constructor.calcAveRatings(this.currentDoc.tour);
});

const Model = mongoose.model('Review', Schema);

module.exports = Model;
