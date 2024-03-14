const express = require("express");
const router = express.Router();
const session = require("express-session");

const signupCollection = require('../model/userSignupSchema');
const productsCollection = require('../model/productSchema');
const nodemailer = require('nodemailer');
const otpCollection = require("../model/otpSchema");
const bcrypt = require('bcrypt');


const signupGet = (req,res) =>{ //user signUp cheyunnathu
    res.render("user/signup");
   
}

const signupPost = async (req, res) => {
    const { name, email, password } = req.body;


    try {
        const existingUser = await signupCollection.findOne({ email });

        console.log(existingUser);

        if (existingUser) {
            return res.render("user/signup", { message: "User already exists" });
        }


        //generate otp
        const otpGenerated = Math.floor(1000 + Math.random() * 9000).toString();

        req.session.signupData = {
            name,
            email,
            password: await bcrypt.hash(password, 10),
            
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

            const newUser = new signupCollection(signupData);

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

const resendOTP = async (req, res) => {
    try {
        const signupdata = req.session.signupData;
        if (!signupdata) {
            return res.json({ error: "User data not found. Please sign up again." });
        }

        const generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
        const email = signupdata.email;

        // Save the new OTP to the database
        await otpCollection.findOneAndUpdate(
            { email: email },
            { $set: { otp: generatedOTP } },
            { upsert: true }
        );

        // Send the new OTP to the user's email
        const mailBody = `Your new OTP for registration is ${generatedOTP}`;
        await sendOTPVerificationEmail(email, "New Registration OTP", mailBody);

        return res.redirect('/verifyemail');
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


const login=  (req,res)=> {      
   
       res.render("user/login");
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
            
        });

        console.log("user data:", user);

        if (!user) {
            return res.render("user/login", { message: "User does not exist" });
        }

        // Check if the user is blocked
        if (user.isBlocked) {
            return res.render('user/login', { error: 'User is blocked. Please contact support.' });
        }

        // Compare hashed password
        const isPasswordValid = await bcrypt.compare(data.password, user.password);

        if (isPasswordValid) {
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

const getHome = async (req,res)=> {
     
    const productList = await productsCollection.find();

    res.render('user/home', {productList});

}


//POST
// const home =async (req,res)=>{
     
//     if (!req.session.user) {
//         // If the user is not logged in, redirect to the login page
//         res.redirect('/userlogin');
//     } else {

//         const productList = await productsCollection.find();
//         // If the user is logged in, render the home page
//         res.render('user/home', {productList});
//     }
// }



const getAthletics = async (req,res) => {

    const productList = await productsCollection.find({category: "Athletic shoes"});

    res.render("user/athleticShoes", { productList });
  
}

const boots =  async (req,res)=> {
     
    const productList = await productsCollection.find({category: "Boots"});

    res.render("user/boots", { productList });
}

const casualShoes =  async (req,res)=> {
     
    const productList = await productsCollection.find({category: "Casual Shoes"});

    res.render("user/casualShoes", { productList });
}




module.exports = {
    login, loginpost,signupGet,signupPost,landing,getVerifyEmail,verifyEmailPost,getLogout,postLogout,getAthletics, getHome,boots,casualShoes,resendOTP,
}




