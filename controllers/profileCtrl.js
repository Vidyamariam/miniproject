const express = require("express");
const userCollection = require("../model/userSignupSchema");
const ordersCollection = require("../model/orderSchema");
const Address = require("../model/addressSchema");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

exports.getProfile = async (req,res) => {

    try{

   const userEmail = req.session.user;
   const userdata = await userCollection.findOne(userEmail);

//    console.log("userdata in profile",userdata);

   
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

        // console.log("userdata", userdata);

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
        const userEmail = req.session.user;   
        const userData = await userCollection.findOne(userEmail); // Find user by email
        const userid = userData._id; 

        console.log("userdata in edit profile",userData);
        console.log("userid in edit profile",userid);

        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log("req body in post edit profile", req.body);

        // Update user profile if no validation errors
      const updatedProfile =  await userCollection.findOneAndUpdate(userid, { // Update user by email
            name: req.body.name,
            email: req.body.email,
        });

        console.log("Profile updated successfully", updatedProfile);
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
        res.setHeader('Content-Disposition', `attachment; filename="invoice_${order.orderId}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');

        // Pipe the PDF document to the response
        doc.pipe(res);

         // Hardcoded site title and logo
         const siteTitle = "Amoli Jewels";
        
         // Title and logo
         doc.fontSize(20).text(siteTitle, { align: 'center' }).moveDown();
         

        // Write order details to the PDF document
        doc.moveDown();
        doc.fontSize(14).text('Order Details', { align: 'center' }).moveDown();
        doc.fontSize(12).text(`Order ID: ${order.orderId}`);
        doc.fontSize(12).text(`Total Quantity: ${order.totalQuantity}`);
        doc.fontSize(12).text(`Total Price paid: ${order.totalPrice}`);
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


exports.getChangePassword = async (req,res)=> {

     try{
        const userEmail = req.session.user;   
        const userData = await userCollection.findOne(userEmail); // Find user by email
        const userid = userData._id; 
        
        console.log("userdata i change password", userData);
        console.log("userid in change password", userid);
        

          
        res.render("user/changePassword");

     }
     catch (error) {
        console.error('Error in getting change password page:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}


exports.postChangePassword = async (req, res) => {
    try {
        const { existingPassword, newPassword, confirmPassword } = req.body;
        const userEmail = req.session.user;

        console.log("req.body in post change pw ", req.body);

        // Find the user by email
        const userData = await userCollection.findOne(userEmail);
        console.log("userdata in post change pw", userData);

        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Compare existing password with the hashed password stored in the database
        const passwordMatch = await bcrypt.compare(existingPassword, userData.password);
         
        console.log("password match", passwordMatch);
        if (!passwordMatch) {
            return res.render("user/changePassword",{ error: 'Existing password is incorrect' });
        }

        // Check if the new password matches the confirm password
        if (newPassword !== confirmPassword) {
            return res.render("user/changePassword",{ newPassworderror: 'New password and confirm password do not match' });
        }

        // Check if the new password is the same as the existing password
        if (existingPassword === newPassword) {
            return res.render("user/changePassword",{ error: 'New password should be different from existing password' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password in the database
        await userCollection.findByIdAndUpdate(userData._id, { password: hashedPassword });

        console.log('Password updated successfully');
        res.redirect('/profile');
    } catch (error) {
        console.error('Error in change password:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};






