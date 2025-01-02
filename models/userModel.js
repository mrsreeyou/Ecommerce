// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    firstname: String,
    email: String,
    password: String,
    age: Number,
    otp: String,
    otpExpires: Date,
    isBlocked: {type: Boolean, default: false}
});

module.exports = mongoose.model('User', UserSchema);
