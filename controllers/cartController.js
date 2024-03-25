const express = require("express");
const userCollection = require("../model/userSignupSchema");
const userCart = require("../model/cartModel");
const productsCollection = require("../model/productSchema");
const { ObjectId } = require('mongodb');
const Swal = require('sweetalert2');
const mongoose = require('mongoose');
const Address = require('../model/addressSchema');
const  ordersCollection = require('../model/orderSchema');



exports.getCart = async (req, res) => {
  try {
    const session = req.session.user;
    const userData = await userCollection.findOne(session);
    const userId = userData._id;
     console.log("session",session);
     console.log("userData",userData);
     console.log("userId",userId);



    // Find the user's cart or create a new one if it doesn't exist
    let cart = await userCart.findOne({ userId }).populate({
      path: 'items.productId',
      model: "products",
    });
             
    if (!cart) {
      // If cart doesn't exist, create a new cart for the user
      cart = new userCart({ userId });
      await cart.save();
    }

     // Calculate total price of items in the cart
     let totalPrice = 0;
     cart.items.forEach(item => {
       totalPrice += item.productId.price * item.quantity;
     });
 
     console.log("Total price:", totalPrice);

     // If cart is empty, render a view without passing cart and sum
     return res.render("user/cart", { cart, totalPrice });
  } catch (error) {
    console.log(error);
    // Handle the error and possibly send an error response to the client
    res.status(500).json({ error: 'Internal Server Error1' });
  }
};



// exports.checkStock = async (req, res) => {
//   try {
//     console.log('This is check cart');
//     const productId = req.params.productId;
//     const quantity = req.params.quantity;

//     let product = await productsCollection.findById(productId);

//     if (!product) {
//       return res.status(404).json({ error: 'Product not found' });
//     }

//     if (product.isListed && product.stock > 0) {
//       // Assuming req.session.user contains the userId
//       const userId = '65e4507f5e141fef039a6500';

//       // Find the user's cart
//       let cartUser = await userCart.findOne({ userId });

//       // If the user doesn't have a cart, create a new one
//       if (!cartUser) {
//         cartUser = await userCart.create({
//           userId,
//           items: [],
//           totalPrice: 0,
//         });
//       }

//       // Find the cart item with the given productId
//       const cartItem = cartUser.items.find((item) => item.productId.equals(productId));

//       if (cartItem) {
//         // Update the quantity and grandPrice for the specified product in the cart
//         cartItem.quantity = quantity;
//         cartItem.grandPrice = quantity * product.price;
//       } else {
//         // If the item is not in the cart, add a new item
//         cartUser.items.push({
//           productId,
//           quantity,
//           grandPrice: quantity * product.price,
//         });
//       }

//       // Recalculate the total price of all items in the cart
//       console.log('Cart Items:', cartUser.items);
// console.log('Total Price Before Recalculation:', cartUser.totalPrice);

// // Recalculate the total price of all items in the cart
// cartUser.totalPrice = cartUser.items.reduce((total, item) => {
//   console.log(`Adding ${item.grandPrice} to total.`);
//   return total + item.grandPrice;
// }, 0);

//       // Save the changes to the cart
//       await cartUser.save();

//       // Product is available for purchase
//       return res.status(200).json({ message: 'Stock available' });
//     } else {
//       // Product is not available for purchase
//       return res.status(400).json({ error: 'Product is not available for purchase' });
//     }
//   } catch (error) {
//     console.error('Error checking stock:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// };


 
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
          });

        await cart.save();

      

     
      res.redirect("/cart",  );
      
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
  // return res.render('user/home',{ error: ' Internal server error.' } );
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
    const itemId = req.params.itemId;
    const newQuantity = parseInt(req.query.quantity);
    const userEmail = req.session.user;
    
    const userData = await userCollection.findOne(userEmail);
    const userId = userData._id;
  
    const cart = await userCart.findOne({ userId }).populate({
      path: 'items.productId',
      model: 'products',
    });

    
     
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.find(item => item._id.toString() === itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Product not found in cart' });
    }

     // Check if the new quantity exceeds the stock limit
     if (newQuantity > item.productId.stock) {
      return res.status(400).json({ success: false, message: 'Stock limit reached' });
    }

    // Update the quantity of the item in the cart
    item.quantity = newQuantity;

    // Calculate the new price based on the quantity
    item.price = item.productId.price * newQuantity;

    // Update the totalPrice in the cart by recalculating
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);

    // Save the updated cart to the database
    await cart.save();

    // Send a success response with the updated cart
    return res.json({ success: true, message: 'Quantity updated successfully', cart });
  } catch (error) {
    console.error('Error updating quantity in the cart:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


//CHECKOUT

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

 // Calculate total price of items in the cart
 let totalPrice = 0;
 cart.items.forEach(item => {
   totalPrice += item.productId.price * item.quantity;
 });

  
  res.render("user/checkout", {userAddress, cart, totalPrice});
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



exports.placeOrder = async (req, res) => {
  try {
    const session = req.session.user;
    const userData = await userCollection.findOne(session);
    const userId = userData._id;
    const { totalPrice } = req.body;

    // Get the selected address from the request body
    const shippingAdrsId = req.body.selectedAddressId;

    // Retrieve the selected address details from the database
    const selectedAddress = await Address.findById(shippingAdrsId);

    const paymentOption = req.body.selectedPaymentOption;

    const cart = await userCart.findOne({ userId }).populate({
      path: 'items.productId',
      model: 'products',
    });

    // Check if the cart is empty
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

     // Access orderId from the request body after it's generated by the middleware
     const orderId = req.body.orderId;
     console.log("orderId",orderId);

    // Create an order document
    const orderData = {
      userId,
      orderId,  
      products: cart.items.map((cartItem) => ({
        productId: cartItem.productId._id,
        productName: cartItem.productId.name,
        productDescription: cartItem.productId.description,
        productRating: cartItem.productId.rating,
        StockCount: cartItem.productId.stock,
        productImage: cartItem.productId.productImage,
        quantity: cartItem.quantity,
        price: cartItem.productId.price,
        status: 'Pending', // Initial status
        reason: '',
        discountPrice: 0, // Initial discount
        couponCode: '',
        refferalCode: '',
      })),
      totalQuantity: cart.items.reduce((total, item) => total + item.quantity, 0),
      totalPrice: totalPrice,
      address: {
        name: selectedAddress.name,
        address: selectedAddress.address,
        locality: selectedAddress.locality,
        pincode: selectedAddress.pincode,
        phone: selectedAddress.phone,
        state: selectedAddress.state,
      },
      paymentMethod: paymentOption,
      orderDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    };

    // Create the order
    const newOrder = await ordersCollection.create(orderData);
    console.log("newOrder",newOrder);

    // Update product stock and clear the user's cart
    await Promise.all([
      updateProductStock(cart.items),
      clearUserCart(userId)
    ]);

    return res.redirect('/order-success'); // Redirect to a success page after placing the order
  } catch (error) {
    console.error('Error placing order:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Function to update product stock
async function updateProductStock(cartItems) {
  const updateStockPromises = cartItems.map(async (cartItem) => {
    const newQuantity = cartItem.productId.stock - cartItem.quantity;
    await productsCollection.findByIdAndUpdate(cartItem.productId._id, { $set: { stock: newQuantity } });
  });
  await Promise.all(updateStockPromises);
}

// Function to clear user's cart
async function clearUserCart(userId) {
  await userCart.updateOne({ userId }, { $set: { items: [] } });
}



//ORDER DETAILS

exports.orderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const productId = req.params.productId;
    console.log("orderId", orderId);
    console.log("productId", productId);

    // Find the order with the matching orderId and productId
    const order = await ordersCollection.findOne({
      _id: orderId,
      'products.productId': productId
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find the product within the order that matches the productId
    const product = order.products.find(prod => String(prod.productId) === productId);

    console.log("product",product);

    // Render the order details page with the order and product details
    return res.render("user/orderDetails", { order, product });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};



exports.orderHistory = async (req, res) => {
  try {
    const session = req.session.user;
    const userData = await userCollection.findOne(session);
    const userId = userData._id;

    // Retrieve all orders for the user
    const userOrders = await ordersCollection
      .find({ userId })
      .sort({ orderDate: -1 }); // Assuming orderDate is the field for sorting orders
     
      // console.log("userOrders",userOrders);

    // Render the order history page with the order details
    return res.render("user/orderHistory", { orders: userOrders });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};



exports.orderSuccessPage = (req,res)=> {

  res.render("user/orderSuccess");
}

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId, productId, reason } = req.body;
    console.log("orderId", orderId);
    console.log("productId", productId);
    console.log("Cancellation reason", reason);

    // Find the order by its orderId
    const order = await ordersCollection.findOne({ _id: orderId });

    if (!order) {
      // If the order is not found, return a 404 status code
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find the product within the order's products array based on productId
    const product = order.products.find(product => String(product.productId) === productId);

    if (!product) {
      // If the product is not found in the order, return a 404 status code
      return res.status(404).json({ error: 'Product not found in the order' });
    }

    // Update the status and reason for cancellation for the specific product
    product.status = 'cancelled';
    product.reason = reason;

    // Update stock in the products collection
await productsCollection.updateOne(
  { _id: product.productId },
  { $inc: { stock: product.quantity } } // Increment stock by the quantity of the canceled product
);

    // Save the updated order to the database
    await order.save();
    console.log("Updated Order", order);

    // If the order is successfully updated, send a response with the updated order
    return res.status(200).json({
      message: "Product cancelled successfully",
      order: order
    });
  } catch (error) {
    // If any error occurs, return a 500 status code with an error message
    console.error('Error cancelling product:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};



exports.returnOrder = async (req, res) => {
  const { orderId, productId, reason } = req.body;

  console.log("orderId", orderId);
  console.log("productId", productId);
  console.log("reason", reason);

  try {
    // Find the order by its orderId
    const order = await ordersCollection.findOne({ _id: orderId });

    if (!order) {
      // If the order is not found, return a 404 status code
      return res.status(404).json({ error: 'Order not found' });
    }

    // Find the product within the order's products array based on productId
    const product = order.products.find(product => String(product.productId) === productId);

    if (!product) {
      // If the product is not found in the order, return a 404 status code
      return res.status(404).json({ error: 'Product not found in the order' });
    }

    // Update the reason for return for the specific product
    product.reason = reason;

    // Update the status of the order to "returned"
    order.products.forEach(product => {
      if (String(product.productId) === productId) {
        product.status = 'Returned';
      }
    });

    // Save the updated order to the database
    await order.save();
    console.log("updated order", order);

    // If the order is successfully updated, send a success response
    return res.status(200).json({ message: "Reason for return saved successfully", order });
  } catch (error) {
    // If any error occurs, return a 500 status code with an error message
    console.error('Error saving reason for return:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
