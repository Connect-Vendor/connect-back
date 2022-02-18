const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Schema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, 'First Name is required'],
    trim: true,
  },
  last_name: {
    type: String,
    required: [true, 'Last Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
  },
  photo: { type: String, default: 'default.png' },
  password: {
    type: String,
    required: [true, 'Password required'],
    minlength: 8,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'lead-guide'],
    default: 'user',
  },
  passwordChangedAt: { type: Date, default: 0 },
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

Schema.methods.isPasswordCorrect = async function (password, hashPass) {
  return await bcrypt.compare(password, hashPass);
};

const UserModel = mongoose.model('User', Schema);

module.exports = UserModel;
