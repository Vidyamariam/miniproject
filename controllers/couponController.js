const express = require("express");

const couponCollection = require('../model/couponModel');

const userCollection = require('../model/userSignupSchema');

const Address = require('../model/addressSchema');

const userCart = require('../model/cartModel');

const moment = require('moment');


exports.getCouponManage = async (req, res) => {
   try {
     // Pagination parameters
     const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
     const limit = parseInt(req.query.limit) || 3; // Default limit to 5 if not provided
 
     // Calculate skip value for pagination
     const skip = (page - 1) * limit;
 
     // Fetch coupons from the database with pagination
     const coupons = await couponCollection
       .find()
       .skip(skip)
       .limit(limit);
 
     // Count total number of coupons for pagination
     const totalCount = await couponCollection.countDocuments();
 
     // Calculate total pages based on total count and limit
     const totalPages = Math.ceil(totalCount / limit);
 
     // Render the template with coupon data and pagination parameters
     res.render("admin/couponManage", {
       coupons: coupons,
       currentPage: page,
       totalPages: totalPages,
     });
   } catch (error) {
     console.error("Error fetching coupons:", error);
     res.status(500).send("Internal Server Error");
   }
 };
 

exports.getAddCoupon = async ( req,res)=> {

    try{

        res.render("admin/addCoupon");

    }
    catch(error){

        console.log(error);
     }
}

exports.postAddCoupon = async (req, res) => {
   try {
      const { couponCode, discount, expiryDate, purchaseAmount, maxAmount, minAmount } = req.body;

      const existingCoupon = await couponCollection.findOne({couponCode});

      if(existingCoupon){
         return res.render("admin/addCoupon", {error:"Coupon already exists"});
      }

      const expiryDateAsDate = moment(expiryDate, 'DD-MM-YYYY').toDate(); // Adjusted format string

      console.log("expirydate object", expiryDateAsDate );

      // Create a new coupon object
      const newCoupon = new couponCollection({
         couponCode,
         discount,
         expiryDate: expiryDateAsDate,    
         maxAmount,
         minAmount
      });

      console.log("newCoupon",newCoupon);


          // Save the coupon to the database
      await newCoupon.save();

      console.log("Coupon added successfully:", newCoupon);

       res.redirect("/manage-coupon");

       
      
      // res.status(200).json({ message: "Coupon added successfully", coupon: newCoupon });
   } catch (error) {
      console.error("Error adding coupon:", error);
      res.status(500).json({ error: "Internal server error" });
   }
};


exports.getEditCoupon = async (req, res) => {
   const id = req.params.id;

   try {
      const coupon = await couponCollection.findById(id);

      if (!coupon) {
         return res.status(404).json({ error: "Coupon not found" });
      }

      // Pagination parameters (you can set these based on your requirements)
      const page = 1; // Default to page 1
      const limit = 3; // Limit to 3 coupons per page

      // Fetch coupons from the database with pagination (you might want to adjust this logic if needed)
      const skip = (page - 1) * limit;
      const coupons = await couponCollection.find().skip(skip).limit(limit);

      // Count total number of coupons for pagination
      const totalCount = await couponCollection.countDocuments();

      // Calculate total pages based on total count and limit
      const totalPages = Math.ceil(totalCount / limit);

      res.render("admin/editCoupon", {
         coupon: coupon,
         coupons: coupons,
         currentPage: page,
         totalPages: totalPages
      });
   } catch (error) {
      console.error("Error editing coupon:", error);
      res.status(500).json({ error: "Internal server error" });
   }
}


exports.postEditCoupon = async ( req,res)=> {

   try{

      const id = req.params.id;
      // console.log("coupinid post",id);
      console.log("req body",req.body);

      const coupon = await couponCollection.findById(id);
       console.log("coupon in post edit",coupon);

      const discount = parseInt(req.body.discount);
      console.log("discount in edit coupon", discount);

      if(discount > 90){
         return res.render("admin/editCoupon",{coupon: coupon ,discountError: "Cannot add discount percent above 90"});
     }


      await couponCollection.findByIdAndUpdate(id, {

         couponCode: req.body.couponCode,
         discount: req.body.discount,
         expiryDate: req.body.expiryDate,
        
         maxAmount: req.body.maxAmount,
         minAmount: req.body.minAmount,        

      })

      

      res.redirect("/manage-coupon");

   }
   catch (error) {
      console.error("Error editing coupon:", error);
      res.status(500).json({ error: "Internal server error" });
   }
}


exports.deleteCoupon = async (req, res) => {
   try {
      const id = req.params.id;

      // Delete the coupon
      const deletedCoupon = await couponCollection.findByIdAndDelete(id);
      console.log("deletedCoupon",deletedCoupon);
      if (!deletedCoupon) {
         return res.status(404).json({ error: "Coupon not found" });
      }

      const newCoupons = await couponCollection.find();

      // Pagination parameters (you can set these based on your requirements)
      const page = 1; // Default to page 1
      const limit = 3; // Limit to 3 coupons per page

      
      const totalCount = await couponCollection.countDocuments();

      // Calculate total pages based on total count and limit
    const totalPages = Math.ceil(totalCount / limit);

      res.render("admin/couponManage", { coupons: newCoupons, currentPage:page ,totalPages });
   } catch (error) {
      console.error("Error deleting coupon:", error);
      res.status(500).json({ error: "Internal server error" });
   }
}


exports.getUserCouponManage = async (req,res)=> {

   try{ 

      const session = req.session.user;
      const userdata = await userCollection.find(session);
      console.log("userdata",userdata);

      // Fetch all coupons from the database
    const coupons = await couponCollection.find();
    
   

      res.render("user/userCouponManage",{coupons, userdata});
   }
   catch (error) {
      console.error("Error getting coupons:", error);
      res.status(500).json({ error: "Internal server error" });
   }
  
}


exports.applyCoupon = async (req, res) => {
   try {
     const { couponCode } = req.body;
 
     // Fetch user details from session
     const session = req.session.user;
     const userData = await userCollection.findOne(session);
     const userId = userData._id;
 
     // Fetch user's address
     const userAddress = await Address.find({ userId });
 
     // Fetch user's cart
     const cart = await userCart.findOne({ userId }).populate({
       path: 'items.productId',
       model: "products",
     });
 
     // Initialize variables for totalPrice and discountedPrice
     let totalPrice = 0;
     let discountedPrice = 0;
 
     // Calculate total price of items in the cart after applying discounts
     cart.items.forEach(item => {
       let itemPrice = item.productId.price;
       if (item.productId.discount && item.productId.discount > 0) {
         // Apply discount to product price if it exists
         itemPrice -= (item.productId.discount / 100) * itemPrice;
       }
       totalPrice += itemPrice * item.quantity;
     });
 
     // Query the database to find the coupon
     const coupon = await couponCollection.findOne({ couponCode });
 
     // Check if the coupon exists
     if (!coupon) {
       return res.render('user/checkout', { error: 'Invalid coupon code', userAddress, cart, discountedPrice, totalPrice });
     }
 
     // Check if the coupon is expired
     if (coupon.expiryDate && coupon.expiryDate < Date.now()) {
       return res.render('user/checkout', { error: 'Coupon has expired', userAddress, cart, discountedPrice, totalPrice });
     }
 
     // Check if the total price is within the allowed range
     if (coupon.minAmount && totalPrice < coupon.minAmount) {
       return res.render('user/checkout', { error: 'Total price is less than minimum amount required for this coupon', userAddress, cart, discountedPrice, totalPrice });
     }
 
     if (coupon.maxAmount && totalPrice > coupon.maxAmount) {
       return res.render('user/checkout', { error: 'Total price exceeds maximum amount allowed for this coupon', userAddress, cart, discountedPrice, totalPrice });
     }
 
     // Calculate the discounted price
     const discountAmount = (coupon.discount / 100) * totalPrice;
     discountedPrice = totalPrice - discountAmount;
 
     // Pass the selected address, cart items, and discounted price to the checkout page
     return res.render('user/checkout', { userAddress, cart, totalPrice, discountedPrice });
   } catch (error) {
     console.error("Error applying coupon:", error);
     return res.status(500).json({ error: "Internal server error" });
   }
 };
 
 

 exports.removeCoupon = async (req,res)=> {

    try{
           
      res.redirect("/checkout");
      
    }
    catch (error) {
      console.error("Error removing coupon:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
 }
 

 exports.searchCoupon = async (req, res) => {
   try {
     const searchTerm = req.query.q;
     const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
     const limit = parseInt(req.query.limit) || 3; // Default limit to 3 if not provided
 
     // Calculate skip value for pagination
     const skip = (page - 1) * limit;
 
     console.log("Search term in coupon page:", searchTerm);
 
     // Fetch coupons from the database with pagination and search term
     const coupons = await couponCollection
       .find({ couponCode: { $regex: searchTerm, $options: 'i' } })
       .skip(skip)
       .limit(limit);
 
     // Count total number of coupons for pagination
     const totalCount = await couponCollection.countDocuments({ couponCode: { $regex: searchTerm, $options: 'i' } });
 
     // Calculate total pages based on total count and limit
     const totalPages = Math.ceil(totalCount / limit);
 
     console.log("Coupons searched:", coupons);
 
     res.render("admin/couponManage", {
       coupons: coupons,
       currentPage: page,
       totalPages: totalPages,
     });
   } catch (error) {
     console.error("Error searching for coupon:", error);
     res.status(500).send("Internal Server Error");
   }
 };
 


 