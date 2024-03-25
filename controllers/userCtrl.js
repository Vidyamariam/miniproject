const express = require("express");
const router = express.Router();
const session = require("express-session");

const signupCollection = require('../model/userSignupSchema');
const productsCollection = require('../model/productSchema');
const nodemailer = require('nodemailer');
const otpCollection = require("../model/otpSchema");
const bcrypt = require('bcrypt');


const signupGet = (req, res) => { //user signUp cheyunnathu
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





const sendOTPVerificationEmail = async (email, title, body) => {
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


const getVerifyEmail = (req, res) => {

    res.render("user/verifyEmail");
}


const verifyEmailPost = async (req, res) => {
    try {
        const { n1, n2, n3, n4 } = req.body;
        const isValidInput = n1 && n2 && n3 && n4 && /^\d+$/.test(n1 + n2 + n3 + n4);

        if (!isValidInput) {
            return res.render("user/verifyEmail", { message: "Only numeric values, and no white spaces" });
        }

        const otpData = `${n1}${n2}${n3}${n4}`;
        console.log("Entered OTP:", otpData);

        const signupData = req.session.signupData;

        console.log("signupData",signupData);

        if (!signupData) {
            return res.render("user/verifyEmail", { error: "User data not found. Please sign up again." });
        }

        const otpRecord = await otpCollection.findOne({ email: signupData.email });

        if (!otpRecord) {
            return res.render("user/verifyEmail", { error: "OTP not found. Please request a new one." });
        }

        console.log("Retrieved OTP from Database:", otpRecord.otp);

        if (otpData === otpRecord.otp) {
            const newUser = new signupCollection(signupData);
            await newUser.save();
            delete req.session.signupData;
            return res.redirect("/userlogin");
        } else {
            return res.render("user/verifyEmail", { message: "Incorrect OTP. Please try again." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error while verifying OTP' });
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

        res.redirect('/verifyemail'); // Removed the return statement here
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


const login = (req, res) => {

    res.render("user/login");
}

const landing = (req, res) => {
    res.render("user/landing");
}



const loginpost = async (req, res) => {


    try {

        const data = {
            email: req.body.email,
            password: req.body.password,

        };

        // console.log("user data form Req body ", data);

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



const getLogout = (req, res) => {

    try{
        delete req.session.user;
     res.redirect("/userlogin");

    }
    catch (error) {
        // Handle any errors that occur during database query or rendering
        console.error('Error logging out:', error);
        res.status(500).send('Internal Server Error');
    }
  
}

const postLogout = (req, res) => {

    req.session.user = null;

     res.redirect("/userlogin");
    
}

const getHome = async (req, res) => {

    try{
        const productList = await productsCollection.find();

        res.render('user/home', { productList });

    }
    catch (error) {
        // Handle any errors that occur during database query or rendering
        console.error('Error getting home:', error);
        res.status(500).send('Internal Server Error');
    }

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





const Ethnics = async (req, res) => {

    try{
        const productList = await productsCollection.find({ category: "Ethnic" });

    res.render("user/ethnic", { productList });

    }
    catch (error) {
        // Handle any errors that occur during database query or rendering
        console.error('Error getting page:', error);
        res.status(500).send('Internal Server Error');
    }

    
}

const Contemporary = async (req, res) => {

    try{
        const productList = await productsCollection.find({ category: "Contemporary" });

        res.render("user/Contemporary", { productList });

    }
    catch (error) {
        // Handle any errors that occur during database query or rendering
        console.error('Error getting page:', error);
        res.status(500).send('Internal Server Error');
    }
   
}


const PRODUCTS_PER_PAGE = 10; // Define the number of products per page

const allProducts = async (req, res) => {
    // Get the page number from the query parameters, default to 1 if not provided
    const page = parseInt(req.query.page) || 1;


    try {
        // Fetch the total count of products
        const totalCount = await productsCollection.countDocuments();

        // Fetch a subset of products based on pagination using Mongoose's skip and limit methods
        const products = await productsCollection
            .find()
            .skip((page - 1) * PRODUCTS_PER_PAGE)
            .limit(PRODUCTS_PER_PAGE);

        // Calculate the total number of pages based on the total count and products per page
        const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE);

        // Render the EJS template with the product list and pagination attributes
        res.render('user/allProducts', {
            products,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        // Handle any errors that occur during database query or rendering
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
};

const sortProduct = async (req, res) => {

    try {
        const sortBy = req.params.sortBy;
        console.log("sortBy", sortBy);

        let products;

        switch (sortBy) {
            case 'Popularity':
                // Implement sorting by popularity logic
                products = await productsCollection.find().sort({ popularity: -1 }); // Example: Sort in descending order of popularity
                break;
            case 'lowtoHigh':
                // Implement sorting by price low to high logic
                products = await productsCollection.find().sort({ price: 1 }); // Example: Sort in ascending order of price
                break;
            case 'HighToLow':
                // Implement sorting by price high to low logic
                products = await productsCollection.find().sort({ price: -1 }); // Example: Sort in descending order of price
                break;
            case 'newArrivals':
                // Implement sorting by new arrivals logic
                products = await productsCollection.find().sort({ createdAt: -1 }); // Example: Sort by descending order of createdAt
                break;
            case 'aA-zZ':
                // Implement sorting by name A to Z logic
                products = await productsCollection.find().collation({ locale: 'en' }).sort({ name: 1 });
                break;
            case 'zZ-aA':
                // Implement sorting by name Z to A logic
                products = await productsCollection.find().collation({ locale: 'en' }).sort({ name: -1 });
                break;
            default:
                // Handle invalid sortBy parameter
                return res.status(400).json({ error: 'Invalid sortBy parameter' });
        }
        // Fetch the total count of products (for pagination)
        const totalCount = await productsCollection.countDocuments();

        // Calculate the total number of pages based on the total count and products per page
        const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE);

        // Render the EJS template with the sorted items, pagination attributes, and other necessary data
        res.render('user/allProducts', {
            products,
            currentPage: 1, // Assuming the current page is 1 after sorting
            totalPages
        });

    } catch (error) {
        console.error('Error sorting products:', error);
        res.status(500).json({ error: 'Internal server error' });

    }

}



const searchItems = async (req, res) => {
    try {
        const searchTerm = req.query.q;
        const page = parseInt(req.query.page) || 1; // Get the page number from query parameters

        // Calculate the skip count based on the current page and number of items per page
        const skipCount = (page - 1) * PRODUCTS_PER_PAGE;

        // Query the products collection for products matching the searchTerm, with pagination
        const products = await productsCollection
            .find({ name: { $regex: searchTerm, $options: 'i' } })
            .skip(skipCount)
            .limit(PRODUCTS_PER_PAGE);

        // Fetch the total count of matching products for pagination
        const totalCount = await productsCollection.countDocuments({ name: { $regex: searchTerm, $options: 'i' } });

        // Calculate the total number of pages based on the total count and products per page
        const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE);

        // Render the EJS template with the search results and pagination attributes
        res.render('user/allProducts', {
            products,
            currentPage: page,
            totalPages
        });
       
    } catch (error) {
        // Handle any errors that occur during database query or rendering
        console.error('Error searching for products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};




const filterProducts = async (req, res) => {
    try {
        console.log("fetch has hit line 342");
        const sortBy = req.query.sortBy; // Retrieve sortBy from query parameters

        console.log("sortBy", sortBy);

        let sortCriteria = {};
        if (sortBy === "priceLowToHigh") {
            sortCriteria = { price: 1 }; // Ascending order
        } else if (sortBy === "priceHighToLow") {
            sortCriteria = { price: -1 }; // Descending order
        }

        // Fetch and sort products from the database
        const products = await productsCollection.find().sort(sortCriteria); // Convert cursor to array

        console.log("products", products);

        res.json(products);
    } catch (error) {
        console.error('Error filtering products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};





module.exports = {
    login, loginpost, signupGet, signupPost, landing, getVerifyEmail, verifyEmailPost, getLogout, postLogout,  getHome, resendOTP,
    searchItems, allProducts, filterProducts, sortProduct,Ethnics,Contemporary
}




