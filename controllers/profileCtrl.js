const express = require("express");
const userCollection = require("../model/userSignupSchema");

const Address = require("../model/addressSchema");


exports.getProfile = async (req,res) => {

    try{

   const userEmail = req.session.user;
   const userdata = await userCollection.findOne(userEmail);

   console.log("userdata",userdata);

   
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
    } else if (req.body.name.trim().split(' ').length < 2) {
        nameError = "Please enter your full name";
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







