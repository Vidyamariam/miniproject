const express = require("express");
const userCollection = require("../model/userSignupSchema");
const userCart = require("../model/cartModel");
const productsCollection = require("../model/productSchema");
const { ObjectId } = require('mongodb');
const Swal = require('sweetalert2');
const mongoose = require('mongoose');
const Address = require('../model/addressSchema');
const ordersCollection = require('../model/orderSchema');
const Razorpay = require('razorpay');
const moment = require('moment');
const couponCollection = require('../model/couponModel');


exports.getCart = async (req, res) => {
  try {
    const session = req.session.user;
    const userData = await userCollection.findOne(session);
    const userId = userData._id;

    // Find the user's cart or create a new one if it doesn't exist
    let cart = await userCart.findOne({ userId }).populate({
      path: 'items.productId',
      model: 'products',
    });

    if (!cart) {
      // If cart doesn't exist, create a new cart for the user
      cart = new userCart({ userId });
      await cart.save();
    }

    // Calculate total price of items in the cart after applying discounts
    let totalPrice = 0;
    cart.items.forEach(item => {
      if (item.productId && item.productId.price) {
        let itemPrice = item.productId.price;
        if (item.productId.discount && item.productId.discount > 0) {
          // Calculate discounted price if the product has a discount
          itemPrice -= (item.productId.discount / 100) * itemPrice;
        }
        totalPrice += itemPrice * item.quantity;
      } else {
        console.log("Invalid item found:", item);
      }
    });

    totalPrice = totalPrice.toFixed(2);

    // Render the view with cart and total price
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


exports.addToCart = async (req, res) => {
  try {
    const session = req.session.user;
    const userData = await userCollection.findOne(session);
    const userId = userData._id;

    const productId = req.params.productId;
    const quantity = req.query.quantity || 1;

    // Find the user's cart or create a new one if it doesn't exist
    let cart = await userCart.findOne({ userId });
    if (!cart) {
      cart = new userCart({ userId, items: [], totalPrice: 0 });
    }

    // Check if the product is already in the cart
    const cartItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (cartItemIndex !== -1) {
      // If the product is already in the cart, increase the quantity and update price
      const product = await productsCollection.findById(productId);
      if (product && product.isListed && product.stock >= cart.items[cartItemIndex].quantity + parseInt(quantity)) {
        const cartItem = cart.items[cartItemIndex];
        cartItem.quantity += parseInt(quantity); // Update quantity

        // Update individual item price based on new quantity
        let price = product.price;
        if (product.discount > 0 && product.discount < 100) {
          price -= (product.discount / 100) * price;
        }
        cartItem.price = price * cartItem.quantity; // Update item price based on discounts and quantity
      } else {
        return res.status(400).json({ success: false, message: 'Product is not available or out of stock.' });

      }
    } else {
      // If the product is not in the cart, add it as a new item
      const product = await productsCollection.findById(productId);
      if (product && product.isListed && product.stock >= quantity) {
        let price = product.price;
        if (product.discount > 0 && product.discount < 100) {
          price -= (product.discount / 100) * price;
        }
        cart.items.push({ productId, quantity, price });
      } else {
        return res.status(400).json({ success: false, message: 'Product is not available or out of stock.' });
      }
    }

    // Update total price in the cart
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);
    // Round totalPrice to 2 decimal places
    if (!isNaN(cart.totalPrice)) {
      cart.totalPrice = parseFloat(cart.totalPrice.toFixed(2));
    }

    await cart.save();

    return res.redirect("/cart");
  } catch (error) {
    console.error("Error adding product to the cart:", error);
    // Handle error appropriately
    return res.status(500).json({ error: 'Internal server error.' });
  }
};




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

  } catch (error) {
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
    let price = item.productId.price;

    // Check if the product has a discount
    if (item.productId.discount > 0) {
      // Calculate the discounted price
      const discountAmount = (price * item.productId.discount) / 100;
      price -= discountAmount;
    }

    item.price = (price * newQuantity).toFixed(2);

    // Update the totalPrice in the cart by recalculating
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price, 0);

    cart.totalPrice = parseFloat(cart.totalPrice.toFixed(2));

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

exports.getCheckoutPage = async (req, res) => {
  try {
    const session = req.session.user;
    const userData = await userCollection.findOne(session);
    const userId = userData._id;
    console.log("userId", userId);

    // Find the address associated with the user ID
    const userAddress = await Address.find({ userId });

    // Find the user's cart
    const cart = await userCart.findOne({ userId }).populate({
      path: 'items.productId',
      model: "products",
    });

    // Calculate total price of items in the cart after applying discounts
    let totalPrice = 0;
    let discountedPrice = 0; // Initialize discounted price
    cart.items.forEach(item => {
      if (item.productId && item.productId.price) {
        let itemPrice = item.productId.price;
        if (item.productId.discount && item.productId.discount > 0) {
          // Calculate discounted price if the product has a discount
          itemPrice -= (item.productId.discount / 100) * itemPrice;
          totalPrice += itemPrice * item.quantity;
        }
      } else {
        console.log("Invalid item found:", item);
      }
    });

    totalPrice = totalPrice.toFixed(2);
   
     // Fetch available coupons from the database
     const coupons = await couponCollection.find({ expiryDate: { $gte: new Date() } });

    res.render("user/checkout", { userAddress, cart, totalPrice, discountedPrice, coupons });
  } catch (error) {
    console.log(error);
    // Handle the error and possibly send an error response to the client
    res.status(500).json({ error: 'Internal Server Error' });
  }
}




exports.checkoutAddAddress = async (req, res) => {

  try {
    const userEmail = req.session.user;
    const userdata = await userCollection.findOne(userEmail);
    const userId = userdata._id;

    const data = {
      userId: userId,
      name: req.body.name,
      address: req.body.address,
      phone: req.body.phone,
      locality: req.body.locality,
      pincode: req.body.pincode,
      state: req.body.state,
    }
    console.log(data);

    const savedAddress = await Address.insertMany([data]);

    console.log("savedAddress", savedAddress);
    res.redirect("/checkout");

  } catch (error) {
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
    const { totalPrice} = req.body;

    console.log("totalPrice in place order", req.body);
    console.log("Total Price:", totalPrice );

   

    // Get the selected address from the request body
    const shippingAdrsId = req.body.selectedAddressId;

    // Retrieve the selected address details from the database
    const selectedAddress = await Address.findById(shippingAdrsId);

    const paymentOption = req.body.selectedPaymentOption;

    console.log("paymentOption selected", paymentOption);

     // Access orderId from the request body after it's generated by the middleware
     const orderId = req.body.orderId;
     console.log("Order ID:", orderId);

    const cart = await userCart.findOne({ userId }).populate({
      path: 'items.productId',
      model: 'products',
    });
    console.log("Cart:", cart);
    // Check if the cart is empty
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

     // Check if any product in the cart is out of stock
     for (const cartItem of cart.items) {
      if (cartItem.productId.stock < cartItem.quantity) {
        return res.status(400).json({ error: `Product ${cartItem.productId.name} is out of stock` });
      }
    }

   
    // Check if payment option is wallet and user has sufficient balance
    if (paymentOption === 'walletPayment') {
      // Retrieve user's wallet balance
      const userWallet = userData.Wallet;
      const walletBalance = userWallet.balance;

      // Check if wallet balance is sufficient
      if (walletBalance < totalPrice) {
        return res.status(400).json({ error: 'Insufficient funds in wallet' });
      }

      // Deduct amount from wallet balance
      const updatedBalance = walletBalance - totalPrice;
      console.log("updated balance in wallet", updatedBalance);

      // Update wallet balance and transaction in the database
      const transaction = {
        amount: -totalPrice,
        description: `Payment for order ${orderId} (${paymentOption})`, // Description for transaction
        date: new Date(), // Current date
        paymentMethod: paymentOption // Payment method used
      };

      // Update wallet balance and add transaction in the database
      await userCollection.updateOne({ _id: userId }, { $set: { 'Wallet.balance': updatedBalance }, $push: { 'Wallet.transactions': transaction } });
    }

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
        price: cartItem.price,
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
    console.log("Order Data:", orderData);
    // Create the order
    const newOrder = await ordersCollection.create(orderData);

    console.log("newOrder", newOrder);

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



//PAYMENT FAILURE

exports.paymentFailure = async ( req,res)=> {

  try{

    const { selectedAddressId, selectedPaymentOption, totalPrice, orderId } = req.body;

    // You can now use the extracted data as needed
    console.log("Selected Address ID:", selectedAddressId);
    console.log("Selected Payment Option:", selectedPaymentOption);
    console.log("Total Price:", totalPrice);
    console.log("order Id: ",orderId);

    const session = req.session.user;
    const userData = await userCollection.findOne(session);
    const userId = userData._id;
    console.log("userid in payment failure",userId);

    const selectedAddress = await Address.findById(selectedAddressId);
   console.log("seleted address: ", selectedAddress);

    const cart = await userCart.findOne({ userId }).populate({
      path: 'items.productId',
      model: 'products',
    });

    // Create order document
    const newOrder = new ordersCollection({
      orderId: orderId,
      userId: userId,
      products: cart.items.map(item => ({
        productId: item.productId._id,
        productName: item.productId.name,
        productDescription: item.productId.description,
        productRating: item.productId.rating,
        stockCount: item.productId.stock,
        productImage: item.productId.productImage,
        quantity: item.quantity,
        price: item.price,
        status: "failed",
        reason: "", 
        discountPrice: 0, 
        couponCode: "", 
        referralCode: "",
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
      paymentMethod: selectedPaymentOption,
      orderDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    });


    const savedOrder = await newOrder.save();
    console.log("Order saved successfully:", savedOrder);


    await userCart.deleteOne({ userId });
    console.log("User's cart cleared successfully");

    // Send response
    res.status(200).json({ message: "Order saved successfully" });
  }
  catch (error) {
    console.error('Error in payment failure:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

}



exports.retryPayment = (req, res) => {
  try {
    const { orderId, productId, price } = req.body;

    // Now you can use orderId, productId, and price as needed
    console.log('Order ID:', orderId);
    console.log('Product ID:', productId);
    console.log('Price:', price);

      // Convert price to paisa (smallest currency unit)
      const amountInPaisa = Math.round(price * 100);

    // Create a new instance of Razorpay
    const razorpay = new Razorpay({ key_id: process.env.KEY_ID, key_secret: process.env.KEY_SECRET });

    // Options for creating the order
    const options = {
      amount: amountInPaisa, // Amount should be in paisa
      currency: 'INR',
      receipt: 'receipt_id', // Custom receipt ID
    };

      // Log all fields
      console.log("Price:", price);
      console.log("Total Price in Paisa:", amountInPaisa );
      console.log("Key ID:", process.env.KEY_ID);
      console.log("Key Secret:", process.env.KEY_SECRET);
      console.log("Options:", options);

    

    // Creating the order
    razorpay.orders.create(options, (err, order) => {
      if (err) {
        console.error('Error creating order:', err);
        return res.status(500).json({ error: 'Error creating order' });
      }

      // Send the order details in the response
      res.status(200).json({ orderId: order.id, productId: productId, orderprice: price });
    });
  } catch (error) {
    console.error('Error in retry payment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


exports.updateOrderStatus = async (req, res) => {
  try {
    const session = req.session.user;
    const userData = await userCollection.findOne(session);
    const userId = userData._id;

    const { orderId, productId, status } = req.body;

    // Log orderId, productId, and status
    console.log("Update Order Status - Order ID:", orderId, "Product ID:", productId, "Status:", status);

    const updatedOrder = await ordersCollection.findOneAndUpdate(
      { _id: orderId, "products.productId": productId },
      { $set: { "products.$.status": status } },
      { new: true }
  );

  if (!updatedOrder) {
    console.log('Order not found or product not found in order.');
    return res.status(404).json({ error: 'Order not found or product not found in order' });
}

console.log('Order status updated successfully:', updatedOrder);

// Send the updated order details along with the status update response
res.json({ updatedOrder, message: 'Order status updated successfully' });

  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};




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

    console.log("product", product);

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
    const userId = userData._id; // Assuming userId is an ObjectId

    // Pagination parameters
    const page = parseInt(req.query.page) || 1; // Current page, default is 1
    const perPage = 10; // Number of orders per page

    // Calculate the number of orders to skip
    const skip = (page - 1) * perPage;

    // Retrieve orders for the user with pagination
    const userOrders = await ordersCollection
      .find({ userId })
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(perPage)
      .populate('userId'); // Populate the user details

    // Count total orders for pagination
    const totalOrders = await ordersCollection.countDocuments({ userId });

    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / perPage);

    // console.log("userOrder in orderhistory,", userOrders);

    // Render the order history page with the order details and pagination information
    return res.render("user/orderHistory", { 
      orders: userOrders,
      currentPage: page,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};




exports.orderSuccessPage = (req, res) => {

  try {
    res.render("user/orderSuccess");
  }
  catch (error) {
    console.error('Error getting order success page:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }


}

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId, productId, reason } = req.body;

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

    // Calculate the refunded amount based on the totalPrice or the original price if totalPrice is less
    let refundedAmount = product.price;
    if (order.totalPrice < product.price) {
      refundedAmount = order.totalPrice;
    }

    // Check if the payment method is Razorpay
    if (order.paymentMethod === 'Razorpay') {
      // Add the refunded amount to the user's wallet balance
      const user = await userCollection.findOne({ _id: order.userId });
      user.Wallet.balance += refundedAmount;

      // Add a transaction record to the user's wallet
      user.Wallet.transactions.push({
        amount: refundedAmount,
        description: `Cancellation refund for ${product.productName}`,
      });

      // Save the updated user document
      await user.save();
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

    if (order.paymentMethod === 'Razorpay') {
      const userId = order.userId;
      const totalPrice = product.price;

      const user = await userCollection.findOne({ _id: userId });

      user.Wallet.balance += totalPrice;

      user.Wallet.transactions.push({

        amount: totalPrice,
        description: `Return refund for ${product.productName}`,
      })


      await user.save();
    }


    // If the order is successfully updated, send a success response
    return res.status(200).json({ message: "Reason for return saved successfully", order });
  } catch (error) {
    // If any error occurs, return a 500 status code with an error message
    console.error('Error saving reason for return:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


exports.razorpay = async (req, res) => {

  try {

    const { amount } = req.body;

    // Convert totalPrice to an integer by multiplying it by 100
    const totalPriceInPaisa = Math.round(amount * 100);

    var instance = new Razorpay({ key_id: process.env.KEY_ID, key_secret: process.env.KEY_SECRET });
    var options = {
      amount: totalPriceInPaisa,
      currency: "INR",
      receipt: "order_rcptid_11",
    };

      // Log all fields
      // console.log("Amount:", amount);
      // console.log("Total Price in Paisa:", totalPriceInPaisa);
      // console.log("Key ID:", process.env.KEY_ID);
      // console.log("Key Secret:", process.env.KEY_SECRET);
      // console.log("Options:", options);

    // Creating the order
    instance.orders.create(options, function (err, order) {
      if (err) {
        console.error(err);
        res.status(500).send("Error creating order");
        return;
      }

      // console.log("Order ID:", order.id);
      // console.log("Order Price:", amount);

      res.send({ orderId: order.id, orderprice: amount });

    });


  } catch (err) {

    console.log(err);
  }
}




exports.razorpayOrder = async (req, res) => {

  try {

    const session = req.session.user;
    const userData = await userCollection.findOne(session);
    const userId = userData._id;
    const { orderprice, razorpay_payment_id, address } = req.body;
   
    console.log("razorpay details ", req.body);

    const selectedAddress = await Address.findOne({ userId: userId, _id: address });
    console.log("selectedAddress", selectedAddress);

    const paymentOption = req.body.selectedPaymentOption;

    const cart = await userCart.findOne({ userId }).populate({
      path: 'items.productId',
      model: 'products',
    });


    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Access orderId from the request body after it's generated by the middleware
    const orderId = req.body.orderId;
    console.log("orderId", orderId);

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
        price: cartItem.price,
        status: 'Pending', // Initial status
        reason: '',
        discountPrice: 0, // Initial discount
        couponCode: '',
        refferalCode: '',
      })),
      totalQuantity: cart.items.reduce((total, item) => total + item.quantity, 0),
      totalPrice: orderprice,
      address: {
        name: selectedAddress.name,
        address: selectedAddress.address,
        locality: selectedAddress.locality,
        pincode: selectedAddress.pincode,
        phone: selectedAddress.phone,
        state: selectedAddress.state,
      },
      paymentMethod: "Razorpay",
      orderDate: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    };

    // Create the order
    const newOrder = await ordersCollection.create(orderData);
    console.log("newOrder", newOrder);

    // Update product stock and clear the user's cart
    await Promise.all([
      updateProductStock(cart.items),
      clearUserCart(userId)
    ]);

    return res.redirect('/order-success');



  } catch (err) {


    console.log(err)
  }

}




