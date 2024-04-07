const express = require("express");
const userCollection = require("../model/userSignupSchema");
const ordersCollection = require("../model/orderSchema");
const Address = require("../model/addressSchema");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.getProfile = async (req,res) => {

    try{

   const userEmail = req.session.user;
   const userdata = await userCollection.findOne(userEmail);

   console.log("userdata in profile",userdata);

   
   res.render("user/profile", {userdata});

    }catch(error){
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
  
}



exports.getEditProfile = async (req, res) => {
    try {
        const userId = req.session.user;
        const userdata = await userCollection.findOne(userId);

        console.log("userdata", userdata);

        res.render("user/editProfile", { 
            userdata,
            nameError: "",
            emailError: ""
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.postEditProfile = async (req, res) => {
    try {
        const userEmail = req.params.user;
        const userData = await userCollection.findOne(userEmail);

        const userId = userData._id;

        // Define error messages
        let nameError = "";
        let emailError = "";

       // Check if name is empty
       if (!req.body.name.trim()) {
        nameError = "Name is required";
    } 
    
        // Check if email is empty or not in a valid format
        if (!req.body.email.trim() || !/^\S+@\S+\.\S+$/.test(req.body.email)) {
            emailError = "Invalid email format";
        }

        // If there are validation errors, render the form again with error messages
        if (nameError || emailError) {
            return res.render("user/editProfile", {
                userdata: userData,
                nameError,
                emailError
            });
        }

        // Update user profile if no validation errors
        await userCollection.findByIdAndUpdate(userId, {
            name: req.body.name,
            email: req.body.email,
        });

        console.log("Profile updated successfully");
        res.redirect('/profile');
    } catch (error) {
        console.error("Error in editProfile:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

exports.downloadInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const productId = req.params.productId;
        console.log("orderid in download invoice router", orderId);
        console.log("productid in download invoice router", productId);

        // Fetch order details from the database
        const order = await ordersCollection.findOne({_id: orderId });
        console.log("order in download invoice router", order);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Find the product with the given productId
        const product = order.products.find(product => product.productId.toString() === productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found in order' });
        }

        // Create a new PDF document
        const doc = new PDFDocument();

        // Set response headers to trigger download in the browser
        res.setHeader('Content-Disposition', `attachment; filename="invoice_${orderId}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');

        // Pipe the PDF document to the response
        doc.pipe(res);

        // Write order details to the PDF document
        doc.moveDown();
        doc.fontSize(14).text('Order Details', { align: 'center' }).moveDown();
        doc.fontSize(12).text(`Order ID: ${order.orderId}`);
        doc.fontSize(12).text(`Total Quantity: ${order.totalQuantity}`);
        doc.fontSize(12).text(`Total Price: ${order.totalPrice}`);
        doc.fontSize(12).text(`Order Date: ${order.orderDate}`);
        doc.fontSize(12).text(`Payment Method: ${order.paymentMethod}`);
        doc.moveDown();

        // Write address details to the PDF document
        doc.fontSize(14).text('Delivery Address', { align: 'center' }).moveDown();
        doc.fontSize(12).text(`Name: ${order.address.name}`);
        doc.fontSize(12).text(`Address: ${order.address.address}`);
        doc.fontSize(12).text(`Locality: ${order.address.locality}`);
        doc.fontSize(12).text(`Pincode: ${order.address.pincode}`);
        doc.fontSize(12).text(`Phone: ${order.address.phone}`);
        doc.fontSize(12).text(`State: ${order.address.state}`);
        doc.moveDown();

        // Write product details to the PDF document
        doc.fontSize(14).text('Product Details', { align: 'center' }).moveDown();
        doc.fontSize(12).text(`Product Name: ${product.productName}`);
        doc.fontSize(12).text(`Description: ${product.productDescription}`);
        doc.fontSize(12).text(`Quantity: ${product.quantity}`);
        doc.fontSize(12).text(`Price: ${product.price}`);
        doc.moveDown();

        // End the document
        doc.end();
    } catch (error) {
        console.error('Error in downloading Invoice:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};







