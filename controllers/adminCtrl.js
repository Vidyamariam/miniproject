
const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
const categoryCollection = require("../model/category");
const userCollection = require("../model/userSignupSchema");
const ordersCollection = require("../model/orderSchema");
const productsCollection = require("../model/productSchema");
const mongoose = require("mongoose");
const adminCollection =  require("../model/adminModel");



const login = (req,res)=>{
    if(req.session.admin) 
    res.redirect("/admin/dashboard");
    else
    res.render("admin/login");
    // if(!req.session.admin){
    //     res.render("admin/login")
    // }else{
    //     res.redirect('admin/productManagement');
    // }  
}

const loginpost = async (req, res) => {
  const adminData = {
      username: req.body.username,
      password: req.body.password,
  }

  try {

      const adminDetails = await adminCollection.findOne({ username: adminData.username, password: adminData.password });

      if(!adminDetails){
        res.render("admin/login", { errorMessage: 'Invalid username' });

      }
      
      if (adminDetails.length === 0) {
          res.render("admin/login", { errorMessage: 'Invalid username or password' });
      } else {
        let data = adminDetails.username;
        console.log("admindataincollection",data);
          req.session.admin = adminDetails._id;
          res.redirect("/admin/dashboard");
      }
  } catch (error) {
      console.error("Error finding admin:", error);
      res.render("admin/login", { errorMessage: 'An error occurred. Please try again later.' });
  }
}


const dashboard =(req,res)=>{

  try{

     res.render("admin/dashboard");
  }catch(err){

    console.log(err)
  }
  
}


const getUserManage = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1; // Get page number from query parameter, default to 1 if not provided
      const limit = 5; // Number of users per page
      const skip = (page - 1) * limit; // Calculate the number of documents to skip

      const totalUsers = await userCollection.countDocuments(); // Get total number of users
      const totalPages = Math.ceil(totalUsers / limit); // Calculate total pages

      const userFind = await userCollection.find().skip(skip).limit(limit); // Get users for the current page

      res.render("admin/userManageNew", { userFind, totalPages, currentPage: page });
  } catch (error) {
      console.log("Error while users find in adminctrl", error);
      res.status(500).send("Internal Server Error");
  }
};






// const postUserManage = async (req,res)=>{

//     try{
//         const userFind = await userCollection.find();
//         console.log("ifhsjdifhisjhfijoia",userFind);
//         res.render("admin/userManagement", {userFind});

//     }catch(error){

//         console.log("error in finding user in adminCtrl", error);
//     }
// };


//Block/unblock user
const blockUser = async (req,res)=> {

    try{
        const userId = req.params.userId;
          console.log("sdfg",userId);

        const user = await userCollection.findById(userId);
        console.log("user data from databse",user)

        if (!user) {
          return res.status(404).send("User not found");
        }
    
        user.isBlocked = !user.isBlocked;
    
        const updatedUser = await user.save();
    
        console.log("User Blocked/Unblocked:", updatedUser);
    
        res.redirect("/admin/usermanage");
      } catch (error) {
        console.error("Error blocking/unblocking user:", error);
        res.status(500).send("Internal Server Error");
      }

}

const getAdminLogout = (req,res) => {
   
  
    delete req.session.admin;
          res.redirect("/admin/login"); 
  
}

const postAdminLogout =  (req,res)=> {

    req.session.user = null;
  req.session.destroy((err)=>{

    if(err){
 
      console.error("Error destroying session:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }else{

      res.redirect("/admin/login");
    }
  })
}



//ORDERS

const getOrders = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 5; // Default limit to 5 if not provided

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Fetch orders from the database with pagination and sort by creation timestamp in descending order
    const orders = await ordersCollection
      .find()
      .populate({
        path: 'userId',
        model: 'newusers'
      })
      .populate({
        path: 'products.productId',
        model: 'products'
      })
      .sort({ createdAt: -1 }) // Sort by creation timestamp in descending order
      .skip(skip)
      .limit(limit);

    // Count total number of orders for pagination
    const totalCount = await ordersCollection.countDocuments();

    // Calculate total pages based on total count and limit
    const totalPages = Math.ceil(totalCount / limit);

    res.render("admin/orderlistN", { 
      orders, 
      currentPage: page, 
      totalPages 
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Internal Server Error");
  }
};



const postOrders = async (req, res) => {
  console.log("post order is getting in line 157");
  try {
    const { orderId, productId, status } = req.body; 
    console.log("orderId", orderId);
    console.log("productId", productId);
    console.log("status", status);

    const order = await ordersCollection.findOne({ _id: orderId });
    console.log("order",order);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const product = order.products.find(product => String(product._id) === productId);
    console.log("product",product);
    if (!product) {
      return res.status(404).json({ error: 'Product not found in the order' });
    }

    product.status = status;
    
    await order.save();
     
    console.log("Order status updated successfully");
    res.json(order);
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const filterByCategory = async (req, res) => {
  try {
      const category = req.query.category; // Get the selected category from query parameters
      console.log("category",category);

      let filter = {}; // Initialize an empty filter object
      if (category) {
          filter.category = category; // If a category is selected, add it to the filter
      }

      // Apply the filter to fetch products
      const products = await productsCollection.find(filter);

      // Fetch categories again to pass them to the frontend for rendering the filter dropdown
      const categories = await productsCollection.distinct("category");

      res.render("admin/productManageN", {
          categories,
          products,
          currentPage: 1, // Reset the page to 1 after applying filter
          totalPages: 1, // In case pagination needs to be updated after applying filter
      });
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
  }
};

const adminOrderDetails = async (req,res)=> {
  try {
    const  orderId= req.params.orderId;
    const productId = req.params.productId;
    // console.log("orderId",orderId);
    // console.log("productId",productId);

    // Find the order by orderId
    const order = await ordersCollection.findOne({ _id: orderId });

    if (!order) {
        return res.status(404).json({ error: "Order not found" });
    }

    // Find the product within the order by productId
    const product = order.products.find(product => product._id.toString() === productId);

    if (!product) {
        return res.status(404).json({ error: "Product not found in the order" });
    }

    // Render the order details page with the order and product details
    return res.render("admin/adminOrderDetails", { order, product });
   
} catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Internal Server Error" });
}
}





module.exports = {
    dashboard, login,loginpost,getUserManage,blockUser,getAdminLogout,postAdminLogout,getOrders,postOrders,filterByCategory,adminOrderDetails
}



