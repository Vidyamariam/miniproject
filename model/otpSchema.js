const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 20,
    },
  });
  
  const otpCollection = mongoose.model("OTP", otpSchema);

  module.exports = otpCollection;
  