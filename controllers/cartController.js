const express = require("express");
const userCollection = require("../model/userSignupSchema");
const userCart = require("../model/cartModel");
const productsCollection = require("../model/productSchema");
const { ObjectId } = require('mongodb');
const Swal = require('sweetalert2');
const mongoose = require('mongoose');
const Address = require('../model/addressSchema');


exports.getCart = async (req, res) => {
  try {
    const session = req.session.user;
    const userData = await userCollection.findOne(session);
    const userId = userData._id;
     
    // Find the user's cart or create a new one if it doesn't exist
    let cart = await userCart.findOne({ userId }).populate({
      path: 'items.productId',
      model: "products",
    });

    console.log("usercart items:", cart.items);

    // Check if cart.items is available before calculating total price
    if (cart.items && cart.items.length > 0) {
      // Calculate the total price of items in the cart
      cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);
    } else {
      // If cart.items is not available, set totalPrice to 0 or any default value
      cart.totalPrice = 0;
    }

    let sum = cart.totalPrice;

    res.render("user/cart", { cart, sum });
  } catch (error) {
    console.log(error);
    // Handle the error and possibly send an error response to the client
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



exports.checkStock = async (req, res) => {
  try {
    console.log('This is check cart');
    const productId = req.params.productId;
    const quantity = req.params.quantity;

    let product = await productsCollection.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.isListed && product.stock > 0) {
      // Assuming req.session.user contains the userId
      const userId = '65e4507f5e141fef039a6500';

      // Find the user's cart
      let cartUser = await userCart.findOne({ userId });

      // If the user doesn't have a cart, create a new one
      if (!cartUser) {
        cartUser = await userCart.create({
          userId,
          items: [],
          totalPrice: 0,
        });
      }

      // Find the cart item with the given productId
      const cartItem = cartUser.items.find((item) => item.productId.equals(productId));

      if (cartItem) {
        // Update the quantity and grandPrice for the specified product in the cart
        cartItem.quantity = quantity;
        cartItem.grandPrice = quantity * product.price;
      } else {
        // If the item is not in the cart, add a new item
        cartUser.items.push({
          productId,
          quantity,
          grandPrice: quantity * product.price,
        });
      }

      // Recalculate the total price of all items in the cart
      console.log('Cart Items:', cartUser.items);
console.log('Total Price Before Recalculation:', cartUser.totalPrice);

// Recalculate the total price of all items in the cart
cartUser.totalPrice = cartUser.items.reduce((total, item) => {
  console.log(`Adding ${item.grandPrice} to total.`);
  return total + item.grandPrice;
}, 0);

      // Save the changes to the cart
      await cartUser.save();

      // Product is available for purchase
      return res.status(200).json({ message: 'Stock available' });
    } else {
      // Product is not available for purchase
      return res.status(400).json({ error: 'Product is not available for purchase' });
    }
  } catch (error) {
    console.error('Error checking stock:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


 

exports.addToCart = async (req,res)=> {

  try{
   const session = req.session.user;
   console.log(session);
   const userData = await userCollection.findOne(session);
   console.log(userData);
   const userId = userData._id;

  const productId = req.params.productId;
   console.log("productId", productId);
   const quantity = req.query.quantity;
   console.log("quantity",quantity);
   // Find the user's cart or create a new one if it doesn't exist
   let cart = await userCart.findOne({ userId });
   if (!cart) {
    cart = new userCart({ userId, items: [] });
   }

   // Check if the product is already in the cart
   const cartItem = cart.items.find(item => item.productId.toString() === productId);

   if(cartItem) {
           // If the product is already in the cart, increase the quantity
    cartItem.quantity += 1;
   }
   else{
     // If the product is not in the cart, add it as a new item
     const product = await productsCollection.findById(productId);

     if (product) {
      // Check if the product is listed and has available stock
      if (product.isListed && product.stock > 0) {
          cart.items.push({
              productId,
              quantity: 1,
              price: product.price, 
              grandPrice:product.price
          });

        await cart.save();

       return res.redirect('/cart');

      } else{

        res.render("user/home", { error: 'Product is not available for purchase.' });
      }     
   }
   else{
    return res.render("user/home", { error: 'Product not found.' })
   }
  }
    
  
    // Save the updated cart
    await cart.save();
   
    return res.redirect('/cart');

}catch(error){
  console.error('Error adding product to the cart:', error);
  return res.render('user/home',{ error: ' Internal server error.' } );
}

}

exports.removeItem = async (req, res) => {
  try {
    const session = req.session.user;
    const userData = await userCollection.findOne(session);
    const userId = userData._id;

    const productId = req.params.productId;
    console.log(productId);
    // Find the user's cart
    let cart = await userCart.findOne({ userId });

    // Check if the cart exists
    if (cart) {
      // Remove the item with the specified productId from the cart
      cart.items = cart.items.filter(item => item._id.toString() !== productId);
   
      
   cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
 
   await cart.save();

   return res.redirect('/cart');
 } else {
   // Handle the case where the cart does not exist
   return res.render('user/cart', { error: 'Cart not found.' });
 }

}catch (error) {
  console.error('Error removing product from the cart:', error);
  return res.render('user/cart', { error: 'Internal server error.' });
}

};


exports.updateQuantity = async (req, res) => {
  try {
    const itemId = req.params.itemId; // Corrected to use req.params.productId
     
    console.log("itemId",itemId);

    const newQuantity = Number(req.query.quantity);
    console.log("newQuantity",newQuantity);

    // const productData = await productsCollection.findOne({ "items.productId": productId });
    // console.log("productData", productData);
   
   
    const userEmail = req.session.user; // Assuming userId is stored in the session

    // Select only the 'email' field from the user document
    const userData = await userCollection.findOne(userEmail);
    const userId = userData._id;
  
    console.log("userId", userId);

    const cart = await userCart.findOne({userId: userId}).populate({
      path: 'items.productId',
      model: "products",
    });
     
     
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
  }
      // Find the item in the cart
      const item = cart.items.find(item => item._id.toString() === itemId);
       console.log("item",item);
     

      if (!item) {
          return res.status(404).json({ success: false, message: "Product not found in cart" });
      }

         
        // Update the quantity of the item in the cart
        item.quantity = newQuantity;

         
       newPrice = item.productId.price * newQuantity; 
        
        item.price = newPrice;
        console.log("item.quantity",item.quantity);
        console.log("item.price", newPrice);
         
         // Update the totalPrice in the cart by adjusting based on the price and quantity change
         cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);
          
     
         const totalPrice = cart.totalPrice;
        // Save the updated cart to the database
        await cart.save();
    
          // Send a success response with the updated cart
          return res.json({ success: true, message: "Quantity updated successfully", cart });


  } catch (error) {
    console.error('Error updating quantity and price in the cart:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getCheckoutPage = async (req,res)=> {

  const session = req.session.user;
  const userData = await userCollection.findOne(session);
  const userId = userData._id;
  console.log("userId",userId);
 
// Find the address associated with the user ID
const userAddress = await Address.find({ userId });

const cart = await userCart.findOne({userId}).populate({
  path: 'items.productId',
  model: "products",
});

  // console.log("userAddress",userAddress);
  res.render("user/checkout", {userAddress, cart});
}

exports.checkoutAddAddress = async ( req,res)=> {

  try{ 
    const userEmail = req.session.user;
    const userdata = await userCollection.findOne(userEmail);
    const userId = userdata._id;

    const data = { 
      userId:userId,  
      name: req.body.name,
      address: req.body.address,
      phone: req.body.phone,
      locality: req.body.locality,
      pincode: req.body.pincode,
      state: req.body.state,
    }
    console.log(data);

    const savedAddress = await Address.insertMany([data]);

    console.log("savedAddress",savedAddress);
    res.redirect("/checkout");

  } catch(error){
    console.error('Error adding new address:', error);
    // Handle the error (e.g., show an error page)
    res.status(500).send('Internal Server Error');

}

}
