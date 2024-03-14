
const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
const categoryCollection = require("../model/category");
const userCollection = require("../model/userSignupSchema");
const ordersCollection = require("../model/orderSchema");
const mongoose = require("mongoose");


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

const loginpost = (req,res)=>{
    
    const name = 'admin@gmail.com'
    const password = '123'
    if(name ===  req.body.username && password === req.body.password){
        //adding session 
        req.session.admin = req.body.username;
        adminsession = req.session.admin;

        res.redirect("/admin/dashboard");
       
    }else {
        
        res.render("admin/login",  { errorMessage: 'Invalid username or password' });
    }

}

const dashboard = (req,res)=>{
    res.render("admin/dashboard");
}


const getUserManage = async(req, res) => {

    try{
        const userFind = await userCollection.find();
        // console.log("ifhsjdifhisjhfijoia",userFind);
        res.render("admin/userManageNew",{userFind});

    }catch(error){
        console.log("Error while users find in adminctrl", error);
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
   
    req.session.destroy((err)=>{
 
        if(err){
    
          console.error("Error destroying session:", err);
          res.status(500).json({ error: "Internal Server Error" });
        }else{
    
          res.redirect("/admin/login"); 
        }
    
      })
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
    // Fetch orders from the database
    const orders = await ordersCollection.find().populate({
      path: 'userId',
      model: 'newusers'
    }).populate({
      path: 'products.productId',
      model: 'products'
    });

  //  console.log("orders",orders);

    res.render("admin/orderlistN", { orders });
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





module.exports = {
    dashboard, login,loginpost,getUserManage,blockUser,getAdminLogout,postAdminLogout,getOrders,postOrders
}



