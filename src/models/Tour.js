const mongoose = require('mongoose');
const validator = require('validator');

const Schema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tour name required'],
    unique: true,
    trim: true,
  },
  duration: { type: String, required: [true, 'Tour duration is required'] },
  groupSize: {
    type: Number,
    required: [true, 'Group size is required'],
    default: 0,
  },
  coverImage: {
    type: String,
    required: true,
  },
  tourImages: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  slug: String,
  summary: {
    type: String,
    required: true,
    trim: true,
  },
  discription: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Tour must have a price'],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  ratingsAvg: {
    type: Number,
    default: 4.5,
    min: [1, 'Ratings cannot be less than 1.0'],
    min: [1, 'Ratings cannot be less than 5.0'],
    set: (val) => Math.random(val * 10) / 10,
  },
  discountPrice: {
    type: Number,
    validate: {
      validator: function (val) {
        return val < this.price;
      },
      message: 'Discount price {VALUE} cannot be greater or equal to price',
    },
  },
  difficulty: {
    type: String,
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'diffculty can either be easy, medium or difficulty',
    },
    required: [true, 'Difficulty is required'],
  },
  startLocation: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: [Number],
    address: String,
    description: String,
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number,
    },
  ],
  guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
});

const Tour = mongoose.model('Tour', Schema);

module.exports = Tour;
