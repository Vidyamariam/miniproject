const otpGenerator = require("otp-generator");
const otpCollection = require("../model/otpSchema");
const signupCollection = require("../model/userSignupSchema");

exports.sendOTP = async (req, res) => {
    try {
      const { email } = req.body;
      // Check if user is already present
      const checkUserPresent = await signupCollection.findOne({ email });
      // If user found with provided email
      if (checkUserPresent) {
        return res.status(401).json({
          success: false,
          message: "User is already registered",
        });
      }
      let otp = otpGenerator.generate(4, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      let result = await otpCollection.findOne({ otp: otp });
      while (result) {
        otp = otpGenerator.generate(4, {
          upperCaseAlphabets: false,
        });
        result = await otpCollection.findOne({ otp: otp });
      }
      const otpPayload = { email, otp };
      const otpBody = await otpCollection.create(otpPayload);
      res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        otp,
      });
      console.log(otpBody);
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  };


  exports.resendOTP = async (req, res) => {
    try {
      const { email } = req.body;
  
      // Check if the user is already present
      const checkUserPresent = await signupCollection.findOne({ email });
  
      // If user not found or not registered
      if (!checkUserPresent) {
        return res.status(401).json({
          success: false,
          message: "User is not registered",
        });
      }
  
      // Generate a new OTP
      let otp = otpGenerator.generate(4, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
  
      // Check if the new OTP already exists in the database
      let result = await otpCollection.findOne({ otp });
  
      while (result) {
        otp = otpGenerator.generate(4, {
          upperCaseAlphabets: false,
        });
        result = await otpCollection.findOne({ otp });
      }
  
      // Update the existing OTP in the database
      await otpCollection.findOneAndUpdate({ email }, { otp });
  
      res.status(200).json({
        success: true,
        message: "OTP resent successfully",
        otp,
      });
    } catch (error) {
      console.log(error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  };
