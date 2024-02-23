const express = require("express");
const router = express.Router();
const session = require("express-session");

const signupCollection = require('../model/userSignupSchema');
const productsCollection = require('../model/productSchema');
const nodemailer = require('nodemailer');
const otpCollection = require("../model/otpSchema");



const signupGet = (req,res) =>{ //user signUp cheyunnathu
    res.render("user/signup");
   
}

const signupPost = async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;

    try {
        const existingUser = await signupCollection.findOne({ email });

        console.log(existingUser);

        if (existingUser) {
            return res.render("user/signup", { message: "User already exists" });
        }

        // Validate password
        if (!password.match(passwordRegex)) {
           return res.render("user/signup", { message: "Invalid password format" });
        }

        //generate otp
        const otpGenerated = Math.floor(1000 + Math.random() * 9000).toString();

        req.session.signupData = {
            name,
            email,
            password,
            confirmPassword,
        };

        const newOTP = new otpCollection({
            email,
            otp: otpGenerated,
        });
        await newOTP.save();

        const mailBody = `Your OTP for registration is ${otpGenerated}`;
        await sendOTPVerificationEmail(email, "otp registration", mailBody);
        console.log("email otp");

        // Redirect to verify OTP page
        return res.redirect('/verifyemail');
    } catch (error) {
        console.error(error); // Log the error details
        res.status(500).json({ message: 'Internal Server Error for signup' });
    }
}





const sendOTPVerificationEmail = async(email, title, body)=>{
    try {
       
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'vidyamathew13@gmail.com',
                pass: 'hiun aukw qjto ghpb'
            }
        });

        // Define email content
        let info = await transporter.sendMail({
            from: 'vidyamathew13@gmail.com',
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        });

       console.log("Info is here: ", info);
       return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }

}


const getVerifyEmail = (req,res)=>{

    res.render("user/verifyEmail");
} 


const verifyEmailPost=async(req,res)=>{

    try {
        const { n1, n2, n3, n4 } = req.body;
        
         // Validate input: Check for presence, numeric values, and no white spaces
    const isValidInput = n1 && n2 && n3 && n4 && /^\d+$/.test(n1 + n2 + n3 + n4);

    if (!isValidInput) {
        return res.render("user/verifyEmail",{message:"Only numeric values, and no white spaces"})
      }
    
      const otpData = `${n1}${n2}${n3}${n4}`;
      console.log(otpData);

      const signupData = req.session.signupData;

      if (!signupData) {
        return res.json({ error: "User data not found. Please sign up again." });
      }

      const otpRecord = await otpCollection.findOne({ email: signupData.email });

      if (!otpRecord) {
        return res.json({ error: "OTP not found. Please request a new one." });
      }

      console.log(otpRecord.otp);

       if(otpData === otpRecord.otp){

            const newUser = new signupCollection({
                name: signupData.name,
                email: signupData.email,
                password: signupData.password,
                confirmPassword: signupData.confirmPassword,
            });

            await newUser.save();

            delete req.session.signupData;
      
            res.redirect("/userlogin");
       } else{
           return res.render("user/verifyEmail", {message:"Incorrect OTP. Please try again."});
       }
        
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

        const data = {
            email: req.body.email,
            password: req.body.password,
            
        };
    
        console.log("user data form Req body ", data);

        const user = await signupCollection.findOne({
            email: data.email,
            password: data.password,
            
        });

        console.log("user data:", user);

        if (!user) {
            return res.render("user/login", { message: "User does not exist" });
        }

        // Check if the user is blocked
        if (user.isBlocked) {
            return res.render('user/login', { error: 'User is blocked. Please contact support.' });
        }

        // Check if the entered password is correct
        if (user.password === data.password) {
            req.session.user = { email: data.email };
            return res.redirect('/home');
        } else {
            return res.render('user/login', { error: 'Wrong password' });
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



const getAthletics = async (req,res) => {

    const productList = await productsCollection.find();

    console.log("dhadsjf",productList);
    res.render("user/athleticShoes", { productList });
  
}


module.exports = {
    login, loginpost,home,signupGet,signupPost,landing,getVerifyEmail,verifyEmailPost,getLogout,postLogout,getAthletics, 
}


