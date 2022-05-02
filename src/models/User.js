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
  phone: String,
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
    enum: ['user', 'admin', 'super-admin'],
    default: 'user',
  },
  password_changed_at: { type: Date, default: 0 },
  password_reset_expires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  status: {
    type: Number,
    default: 0
  }
});

Schema.methods.isPasswordCorrect = async function (password, hashPass) {
  return await bcrypt.compare(password, hashPass);
};

const UserModel = mongoose.model('User', Schema);

module.exports = UserModel;
