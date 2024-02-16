const express = require("express");
const router = express.Router();
const session = require("express-session");

const signupCollection = require('../model/userSignupSchema');
const productsCollection = require('../model/productSchema');
const nodemailer = require('nodemailer');




const signupGet = (req,res) =>{ //user signUp chyeyunnathu
    res.render("user/signup");
   
}

const signupPost = async (req, res) => {
    console.log(req.body, "here in the signup");
    
    try {
        const { name, email, password } = req.body;

        console.log("entered");

        const existingUser = await signupCollection.findOne({ email });

        console.log(existingUser);

        if (existingUser) {
            return res.render("user/signup", { mes: "User already exists" });
        }

        //generate otp
        const otpCode = Math.floor(100000 + Math.random() * 900000);

      

        const userData = new signupCollection({
            name,
            email,
            password,
            otp: {
                code: otpCode.toString(),
                expiration: new Date(Date.now() + 1 * 60 * 1000) // OTP expiration time (1 minute)
            }
        });

        await userData.save();

        // Send OTP via email
        await sendOTPVerificationEmail(email, otpCode);
        console.log("email otp");

        // Store email and user data in session for OTP verification
        req.session.verifyEmail = email;
        req.session.userData = userData;

        // Redirect to verify OTP page
        return res.render('user/verifyEmail');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error for signup' });
    }
}




const sendOTPVerificationEmail = async(email, otp)=>{
    try {
        // Configure nodemailer with your email service provider details
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'vidyamathew13@gmail.com',
                pass: 'hiun aukw qjto ghpb'
            }
        });

        // Define email content
        const mailOptions = {
            from: 'vidyamathew13@gmail.com',
            to: email,
            subject: 'OTP Verification',
            text: `Your OTP for signup is: ${otp}.`
        };

        // Send email
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }

}



const verifyEmailPost=async(req,res)=>{

    try {
        let verifyEmail = "";
        let userData;
 
        const { otp } = req.body;
        console.log(otp,"showing otp");

        // Retrieve the email and user data from the session
        if (req.session.verifyEmail && req.session.userData) {
            verifyEmail = req.session.verifyEmail;
            userData = req.session.userData;
        }

        const user = await signupCollection.findOne({ email: verifyEmail });
        console.log(user, "verifyEmail in verifyOtp");

        if (!user) {
          console.log('User not found signupVerifyOtp')
        }
    
        // Check if OTP is expired 
        if (user.otp.expiration && user.otp.expiration < new Date()) {
         const message=  'OTP has expired'
          return res.render("user/verifyEmail",{ message});
        }
    
        // Check if the entered OTP matches the stored OTP
        if (user.otp.code !== otp) {
         const wrongOtp="Invalid OTP, Recheck Your OTP"

          return res.render("user/verifyEmail",{wrongOtp})
    
        }
    
        // Clear the OTP details after successful verification
        user.otp = {
          code: null,
          expiration: null
        };
    
        await user.save();
        console.log('OTP verified successfully in verifyOtp. Please Login Again')

        // Clear the resendEnabled flag in the session after successful verification
        delete req.session.resendEnabled;

        res.redirect('/userlogin')
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error while verifying OTP' });
      }
}




const login= (req,res)=> {
  res.render("user/login")
}

const landing=(req,res)=>{
    res.render("user/landing");
}



const loginpost = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(email + " loginpost");
        const user = await signupCollection.findOne({ email: email });

        if (user) {
            // Check if the user is blocked
            if (user.isBlocked) {
                return res.render('user/login', { error: 'User is blocked. Please contact support.' });
            }

            // Check if the entered password is correct
            if (user.password === password) {
                console.log("next chq");
                console.log(user.email);
                req.session.user = email;
                res.redirect('/home'); // Redirect to the homepage route
            } else {
                res.render('user/login', { error: 'Wrong password' });
            }
        } else {
            res.render('user/login', { error: 'User not found' });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};



const getLogout = (req,res) => {
   
    req.session.destroy((err)=>{
 
        if(err){
    
          console.error("Error destroying session:", err);
          res.status(500).json({ error: "Internal Server Error" });
        }else{
    
          res.redirect("/userlogin"); 
        }
    
      })
}

const postLogout = (req,res)=> {

    req.session.user = null;
  req.session.destroy((err)=>{

    if(err){
 
      console.error("Error destroying session:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }else{

      res.redirect("/userlogin");
    }
  })
}



const home =async (req,res)=>{

    if (!req.session.user) {
        // If the user is not logged in, redirect to the login page
        res.redirect('/userlogin');
    } else {
        // If the user is logged in, render the home page
        res.render('user/home');
    }
}

const getVerifyEmail = (req,res)=>{

    res.render("user/verifyEmail");
} 

const getAthletics = async (req,res) => {

    const productList = await productsCollection.find();

    console.log("dhadsjf",productList);
    res.render("user/athleticShoes", { productList });
  
}


module.exports = {
    login, loginpost,home,signupGet,signupPost,landing,getVerifyEmail,verifyEmailPost,getLogout,postLogout,getAthletics, 
}


