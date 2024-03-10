const express = require("express");
const userCollection = require("../model/userSignupSchema");
const Address = require('../model/addressSchema');
const toastr= require('express-toastr')

exports.addAddress = async (req,res)=> {

    try{
     const userIds = req.session.user;
     const userData = await userCollection.findOne(userIds);
  
     const userId  = userData._id;
   
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

    console.log("fdagh", savedAddress);

    // Redirect to the address management page (adjust the route accordingly)
    const successMessage= "Address added successfully";
    res.redirect(`/address?success=${encodeURIComponent(successMessage)}`);

    }
    catch(error){
        console.error('Error adding new address:', error);
        // Handle the error (e.g., show an error page)
        res.status(500).send('Internal Server Error');

    }
}



exports.getEditAddress =  async ( req,res)=> {

     const id = req.params.id;
     console.log("Address ID:", id);

     try{
        const address = await Address.findById(id);

        console.log("Address:", address);

        if (!address) {
          // Handle the case where the address with the given ID is not found
          return res.render("user/addressManage", { message: "Address not found" });
        }
        console.log("testing", address);
      res.render("user/editAddress", {address: address});
     }
     catch(error){
      console.error("Error in getAddress:", error);
         res.render("user/addressManage", {message: "error in getAddress"});
     }
  
}


exports.postEditAddress = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the address by ID and update its details
    const updatedAddress = await Address.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Optionally, you can redirect to the address manage page with a success message
    const successMessage= "Address updated successfully";
    res.redirect(`/address?success=${encodeURIComponent(successMessage)}`); 

  } catch (error) {
    console.error('Error in postEditAddress:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    console.log('this is delete address');
      const addressId = req.params.addressId;
      console.log(addressId);
      
      const deletedAddress = await Address.findByIdAndDelete(addressId);

      if (!deletedAddress) {
          return res.status(404).send('Address not found');
      }
      const successMessage='Address Deleted Successfully'
      res.redirect(`/address?success=${encodeURIComponent(successMessage)}`);
      
  } catch (error) {
      console.error('Error deleting address:', error);
      // Handle the error (e.g., show an error page)
      res.status(500).send('Internal Server Error');
  }

}






