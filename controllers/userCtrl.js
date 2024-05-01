const express = require("express");
const router = express.Router();
const session = require("express-session");

const signupCollection = require('../model/userSignupSchema');
const productsCollection = require('../model/productSchema');
const nodemailer = require('nodemailer');
const otpCollection = require("../model/otpSchema");
const bcrypt = require('bcryptjs');
const categoryCollection = require("../model/category");
const Banner = require('../model/bannerModel');


const signupGet = (req, res) => {

    try {
        if (req.session.user)
            return res.redirect("/home");

        res.render("user/signup");
    }
    catch (error) {
        console.error(error); // Log the error details
        res.status(500).json({ message: 'Internal Server Error for signup' });
    }

}

const signupPost = async (req, res) => {
    const { name, email, password, referralCode } = req.body;

    console.log("signuppost data", req.body);

    try {
        if (req.session.user)
            return res.redirect("/home");

        const existingUser = await signupCollection.findOne({ email });

        console.log("existingUser in signup post", existingUser);

        if (existingUser) {
            return res.render("user/signup", { message: "User already exists" });
        }


        //generate otp
        const otpGenerated = Math.floor(1000 + Math.random() * 9000).toString();

        req.session.signupData = {
            name,
            email,
            password: await bcrypt.hash(password, 10),
            referredCode: referralCode,
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

    try {

        // Calculate the expiration time for the OTP
        const expirationTime = new Date(Date.now() + 60 * 1000); // 60 seconds from now

        // Render the verify email page and pass the expiration time as a variable
        res.render("user/verifyEmail", { expirationTime });
    }
    catch (error) {
        console.error("Error getting varify Email page:", error);
        throw error;
    }


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

        console.log("signupData in verify email post", signupData);

        if (!signupData) {
            return res.render("user/verifyEmail", { error: "User data not found. Please sign up again." });
        }

        const otpRecord = await otpCollection.findOne({ email: signupData.email });

        if (!otpRecord) {
            return res.render("user/verifyEmail", { error: "OTP not found. Please request a new one." });
        }

        console.log("Retrieved OTP from Database:", otpRecord.otp);

        if (otpData === otpRecord.otp) {
            const newUser = new signupCollection({

                name: signupData.name,
                email: signupData.email,
                password: signupData.password,
                referredCode: signupData.referredCode
            });

            if (signupData.referredCode) {
                // Add 50 Rs to the wallet balance
                newUser.Wallet.balance += 50;
            }

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



const forgotPassword = (req, res) => {

    try {


        res.render("user/checkEmail");

    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


const postForgotPassword = async (req, res) => {

    const email = req.body.email;

    try {

        req.session.otpemail = req.body.email;

        console.log("email in forgot password", req.body);

        // Check if the email exists in the user collection
        const existingUser = await signupCollection.findOne({ email });

        console.log("existing user in forgot pw", existingUser);

        if (!existingUser) {
            return res.render("user/checkEmail", { errorMessage: "Email not found" });
        }

        if (existingUser) {

            //generate otp
            const otpGenerated = Math.floor(1000 + Math.random() * 9000).toString();

            const otpData = new otpCollection({
                email: email,
                otp: otpGenerated
            });
            await otpData.save();

            const mailBody = `Your OTP for registration is ${otpGenerated}`;
            await sendOTPVerificationEmail(email, "otp registration", mailBody);
            console.log("email otp");

            // Redirect to verify OTP page
            return res.redirect('/verifyOtp');

        }
        else {
            // If the email doesn't exist, handle it based on your application's requirements
            return res.status(404).json({ error: 'Email not found' });
        }

    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

const getverifyOtp = (req, res) => {

    try {

        res.render("user/verifyOtp");

    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}






const postverifyOtp = async (req, res) => {

    try {

        const { n1, n2, n3, n4 } = req.body;
        console.log("hgdsfj", req.body);
        const isValidInput = n1 && n2 && n3 && n4 && /^\d+$/.test(n1 + n2 + n3 + n4);

        if (!isValidInput) {
            return res.render("user/verifyOtp", { message: "Only numeric values, and no white spaces" });
        }

        const otpEntered = `${n1}${n2}${n3}${n4}`;
        console.log("Entered OTP:", otpEntered);

        const otpData = await otpCollection.findOne({}).sort({ _id: -1 }).limit(1);

        console.log("otp data in postverifyOtp", otpData);

        // Check if the OTP exists and matches the entered OTP
        if (otpData && otpEntered === otpData.otp) {
            // If OTP is valid, redirect to the change password route
            return res.redirect('/update-password');
        } else {
            // If OTP is invalid or doesn't match, display an error message
            return res.render("user/verifyOtp", { message: "Invalid OTP. Please try again." });
        }


    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}



const resendForgotOtp = async (req, res) => {

    try {

        const email = req.session.otpemail;
        console.log("email", email);

        if (!email) {
            // Handle the case where the email is not available in the session
            console.error("Email not found in session");
            return res.status(400).render("user/verifyOtp", { errorMessage: "Email not found in session" });
        }


        //generate otp
        const otpGenerated = Math.floor(1000 + Math.random() * 9000).toString();

        const otpData = new otpCollection({
            email: email,
            otp: otpGenerated
        });
        await otpData.save();

        const mailBody = `Your OTP for registration is ${otpGenerated}`;
        await sendOTPVerificationEmail(email, "otp registration", mailBody);
        console.log("email otp");


        res.redirect("/verifyOtp");

    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}



const getChangePassword = (req, res) => {

    try {

        // Now you have access to the email in the route handler
        res.render("user/updatePassword");

    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

const postChangePassword = async (req, res) => {

    const newPassword = req.body.password;
    console.log("newpassword in post change pw", newPassword);

    try {
        const user = await signupCollection.findOne({ email: req.session.otpemail });

        if (!user) {
            return res.status(404).send("User not found");
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password field with the hashed password
        user.password = hashedPassword;

        // Save the updated user to the database
        await user.save();


        res.redirect("/password-changed");

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


const passwordChangeSuccess = (req, res) => {

    try {


        res.render("user/pwChangeSuccess");

    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}




const login = (req, res) => {

    try {
        if (req.session.user)
            return res.redirect("/home")
        res.render("user/login");
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }


}

const landing = async (req, res) => {
    try {
        if (req.session.user) {
            return res.redirect("/home");
        }

        // Fetch banner images from the database
        const banners = await Banner.find();

        // Render the landing page and pass banner data to the view
        res.render("user/landing", { banners });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
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

    try {
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

    try {
        req.session.user = null;

        res.redirect("/userlogin");

    }
    catch (error) {
        // Handle any errors that occur during database query or rendering
        console.error('Error logging out:', error);
        res.status(500).send('Internal Server Error');
    }

}

const getHome = async (req, res) => {

    try {
        const userEmail = req.session.user;

        if (!userEmail) {
            // User is not authenticated, redirect to login page
            return res.redirect('/userlogin');
        }

        const userdata = await signupCollection.findOne(userEmail);
        const userId = userdata._id;
        console.log("userid in home page", userId);

        const productList = await productsCollection.find();

        // Fetch banner images from the database
        const banners = await Banner.find();

        if (userEmail) {

            res.render('user/home', { productList: productList, banners });
        }

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
    try {
        // Query the category collection to find the category discount for "Ethnic"
        const category = await categoryCollection.findOne({ categoryName: "Ethnic" });

        // Retrieve the product list
        const productList = await productsCollection.find({ category: "Ethnic" });

        // Initialize maxDiscount with the category discount if available
        let maxDiscount = category && category.categoryOffer > 0 ? category.categoryOffer : 0;

        // Iterate through the products to find the maximum discount
        productList.forEach(product => {
            if (product.discount > maxDiscount) {
                maxDiscount = product.discount;
            }
        });

        // Calculate the discounted price for each product
        productList.forEach(product => {
            if (product.discount > 0) {
                // Apply the maximum discount
                const discountedPrice = product.price - (product.price * (maxDiscount / 100));
                product.discountedPrice = discountedPrice;
            } else {
                // If there's no discount, set discounted price as the original price
                product.discountedPrice = product.price;
            }
        });

        res.render("user/ethnic", { productList });
    } catch (error) {
        // Handle any errors that occur during database query or rendering
        console.error('Error getting page:', error);
        res.status(500).send('Internal Server Error');
    }
}



const Contemporary = async (req, res) => {
    try {
        // Query the category collection to find the category discount for "Contemporary"
        const category = await categoryCollection.findOne({ categoryName: "Contemporary" });

        // Retrieve the product list
        const productList = await productsCollection.find({ category: "Contemporary" });

        // Initialize maxDiscount with the category discount if available
        let maxDiscount = category && category.categoryOffer > 0 ? category.categoryOffer : 0;

        // Iterate through the products to find the maximum discount
        productList.forEach(product => {
            if (product.discount > maxDiscount) {
                maxDiscount = product.discount;
            }
        });

        // Calculate the discounted price for each product
        productList.forEach(product => {
            if (product.discount > 0) {
                // Apply the maximum discount
                const discountedPrice = product.price - (product.price * (maxDiscount / 100));
                product.discountedPrice = discountedPrice;
            } else {
                // If there's no discount, set discounted price as the original price
                product.discountedPrice = product.price;
            }
        });

        res.render("user/Contemporary", { productList });
    } catch (error) {
        // Handle any errors that occur during database query or rendering
        console.error('Error getting page:', error);
        res.status(500).send('Internal Server Error');
    }
}




const ITEMS_PER_PAGE = 10;
const allProducts = async (req, res) => {
   
    try{
         // Get the page number from the query parameters, default to 1 if not provided
    let action=req.params.action;
    const page=+req.query.page||1;
    const search=req.query.search
    let searchquery;
    console.log(req.query.page)
    if(search){
        searchquery=true;
    }
        let product_count;
        const products=await filterProducts(action,page,search,searchquery)
        product_count=await productsCollection.find({isListed:true}).countDocuments();
        if(searchquery){
            product_count=await productsCollection.find({isListed:true,name:{ $regex: '^' + search, $options:'i'}}).countDocuments();
        }

         // Fetch distinct categories from the products collection
         const categories = await productsCollection.distinct('category');

        /* console.log(products) */
        res.render("user/allProducts",{
            products,
            categories,
            currentPage: page,
            hasNextPage: (page*ITEMS_PER_PAGE)<product_count,
            hasPreviousPage: page>1,
            nextPage: page+1,
            previousPage: page-1,
            lastPage:Math.ceil(product_count / ITEMS_PER_PAGE),
            action:action,
            search: (search)?search : ""
        })
    }catch(err){
        console.log(err)
    }

};


async function filterProducts(action,page,search,searchquery){   
    let products;
    if(action==="lowToHigh"&&searchquery){
        products=await productsCollection.find({isListed:true,name:{ $regex: '^' + search, $options:'i'}}).sort({price:1}).skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE).populate("category");  
    }else if(action==="highToLow"&&searchquery){
        products=await productsCollection.find({isListed:true,name:{ $regex: '^' + search, $options:'i'}}).sort({price:-1}).skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE).populate("category");
    }else if(action==="newArrivals"&&searchquery){
        products=await productsCollection.find({isListed:true,name:{ $regex: '^' + search, $options:'i'}}).sort({_id:-1}).skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE).populate("category");
    }else if(action==="aA-Zz"&&searchquery){
        products=await productsCollection.find({isListed:true,name:{ $regex: '^' + search, $options:'i'}}).sort({name:1}).skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE).populate("category");
    }else if(action==="Zz-aA"&&searchquery){
        products=await productsCollection.find({isListed:true,name:{ $regex: '^' + search, $options:'i'}}).sort({name:-1}).skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE).populate("category");
    }else if(action==="lowToHigh"){
        products=await productsCollection.find({isListed:true}).sort({price:1}).skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE).populate("category");  
    }else if(action==="highToLow"){
        products=await productsCollection.find({isListed:true}).sort({price:-1}).skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE).populate("category");
    }else if(action==="newArrivals"){
        products=await productsCollection.find({isListed:true}).sort({_id:-1}).skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE).populate("category");
    }else if(action==="aA-Zz"){
        products=await productsCollection.find({isListed:true}).sort({name:1}).skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE).populate("category");
    }else if(action==="Zz-aA"){
        products=await productsCollection.find({isListed:true}).sort({name:-1}).skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE).populate("category");
    }else if(searchquery){
        products=await productsCollection.find({isListed:true,name:{ $regex: '^' + search, $options:'i'}}).skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE).populate("category")
    }
    else{
        products=await productsCollection.find({isListed:true}).skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE).populate("category");
    }
    return products 
}





const userFilterByCategory = async (req, res) => {
    try {
        const category = req.query.category;
        const page = +req.query.page || 1; // Get the page number from the query parameters, default to 1 if not provided
        const search = req.query.search;
        let searchquery;

        if (search) {
            searchquery = true;
        }

        let filter = {};
        if (category) {
            filter.category = category; // If a category is selected, add it to the filter
        }

        // Apply the filter to fetch products with pagination
        let products = await productsCollection.find(filter);

        // Calculate the total count of products
        let product_count = await productsCollection.find(filter).countDocuments();

        // Calculate pagination variables
        const hasNextPage = (page * ITEMS_PER_PAGE) < product_count;
        const hasPreviousPage = page > 1;
        const nextPage = page + 1;
        const previousPage = page - 1;
        const lastPage = Math.ceil(product_count / ITEMS_PER_PAGE);

        // Fetch categories again to pass them to the frontend for rendering the filter dropdown
        const categories = await productsCollection.distinct("category");

        // Pass the action parameter to the template rendering context
        const action = req.params.action;

        // Render the template with necessary variables
        res.render("user/allProducts", {
            categories,
            products,
            currentPage: page,
            hasNextPage,
            hasPreviousPage,
            nextPage,
            previousPage,
            lastPage,
            action,
            search: search || "",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

// const sortProducts = async (products, sortBy) => {
//     try {
//         switch (sortBy) {
//             case 'Popularity':
//                 // Implement sorting by popularity logic
//                 console.log("Sorting by popularity...");
//                 return products.sort((a, b) => b.popularity - a.popularity); // Sort in descending order of popularity
//             case 'lowtoHigh':
//                 // Implement sorting by price low to high logic
//                 console.log("Sorting by price low to high...");
//                 return products.sort((a, b) => a.price - b.price); // Sort in ascending order of price
//             case 'HighToLow':
//                 // Implement sorting by price high to low logic
//                 console.log("Sorting by price high to low...");
//                 return products.sort((a, b) => b.price - a.price); // Sort in descending order of price
//             case 'newArrivals':
//                 // Implement sorting by new arrivals logic
//                 console.log("Sorting by new arrivals...");
//                 return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by descending order of createdAt
//             case 'aA-zZ':
//                 // Implement sorting by name A to Z logic
//                 console.log("Sorting by name A to Z...");
//                 return products.sort((a, b) => a.name.localeCompare(b.name));
//             case 'zZ-aA':
//                 // Implement sorting by name Z to A logic
//                 console.log("Sorting by name Z to A...");
//                 return products.sort((a, b) => b.name.localeCompare(a.name));
//             default:
//                 // Handle invalid sortBy parameter
//                 console.error('Invalid sortBy parameter');
//                 throw new Error('Invalid sortBy parameter');
//         }
//     } catch (error) {
//         console.error("Error sorting products:", error);
//         throw error;
//     }
// };


// const sortProduct = async (req, res) => {
//     try {
//         const sortBy = req.query.sortBy;
//         console.log("Sort By:", sortBy);

//         // Fetch the category from the query parameters
//         const category = req.query.category;
//         console.log("Category:", category);

//         // Prepare the filter object
//         let filter = {};
//         if (category) {
//             filter.category = category;
//         }

//         // Fetch products based on the filter
//         let products = await productsCollection.find(filter);
//         console.log("Filtered Products:", products);

//         // Sort the products based on the specified criteria
//         products = await sortProducts(products, sortBy);
//         console.log("Sorted Products:", products);

//         // Fetch the distinct categories for rendering the filter dropdown
//         const categories = await productsCollection.distinct("category");
//         console.log("Categories:", categories);

//         // Fetch the total count of products (for pagination)
//         const totalCount = await productsCollection.countDocuments(filter);
//         console.log("Total Count:", totalCount);

//         // Calculate the total number of pages based on the total count and products per page
//         const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE);
//         console.log("Total Pages:", totalPages);

//         // Render the EJS template with the sorted items, pagination attributes, and other necessary data
//         res.render('user/allProducts', {
//             products,
//             categories,
//             currentPage: 1, // Assuming the current page is 1 after sorting
//             totalPages
//         });
//     } catch (error) {
//         console.error('Error sorting products:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// };




const getWallet = async (req, res) => {

    try {

        const userEmail = req.session.user;
        const userdata = await signupCollection.findOne(userEmail);
        const userId = userdata._id;
        console.log("userid in wallet get", userId);


        const userDetails = await signupCollection.findById({ _id: userId });
        console.log("userdetails in wallet get", userDetails);
        res.render("user/wallet", { userDetails });

    } catch (error) {
        // Handle any errors that occur during database query or rendering
        console.error('Error getting wallet:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


const createReferral = async (req, res) => {
    try {

        // Get the user's email from the session
        const userEmail = req.session.user;
        // Find the user in the database
        const userData = await signupCollection.findOne(userEmail);
        // Check if the user already has a referral code
        if (!userData.referralCode) {
            // Generate a referral code
            const referralCode = generateReferralCode();
            // Update the user's document with the referral code
            await signupCollection.updateOne({ _id: userData._id }, { $set: { referralCode: referralCode } });
            // Return the generated referral code
            return res.status(200).json({ referralCode: referralCode });
        } else {
            // If the user already has a referral code, return it
            return res.status(200).json({ referralCode: userData.referralCode });
        }
    } catch (error) {
        // Handle any errors that occur during database query or rendering
        console.error('Error generating referral code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


// Function to generate a random referral code
const generateReferralCode = () => {
    // Define the characters allowed in the referral code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let referralCode = '';
    // Generate a random 8-character referral code
    for (let i = 0; i < 8; i++) {
        referralCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return referralCode;
}



const checkReferralCode = async (req, res) => {

    const { referralCode } = req.body;

    console.log("referral entered in signup", req.body);
    try {
        // Check if the referral code exists in the database
        const existingUser = await signupCollection.findOne({ referralCode });
        if (existingUser) {

            return res.json({ isValid: true, message: 'Referral code is valid.' });
        }
        else {
            return res.json({ isValid: false, message: 'Invalid referral code.' });

        }
    } catch (error) {
        console.error('Error checking referral code:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    login, loginpost, signupGet, signupPost, landing, getVerifyEmail, verifyEmailPost, getLogout, postLogout, getHome, resendOTP, allProducts, Ethnics, Contemporary, userFilterByCategory, getWallet, createReferral, checkReferralCode, forgotPassword, postForgotPassword, getverifyOtp, postverifyOtp, resendForgotOtp, getChangePassword, postChangePassword, passwordChangeSuccess
}




