const express = require("express");
const userCollection = require("../model/userSignupSchema");

const Address = require("../model/addressSchema");


exports.getProfile = async (req,res) => {

    try{

   const userEmail = req.session.user;
   const userdata = await userCollection.findOne(userEmail);
   
   res.render("user/profile", {userdata});

    }catch(error){
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
  
}



exports.getEditProfile = async (req,res)=> {

    try{
        const userId = req.session.user;   
        const userdata = await userCollection.findOne(userId);
       
        console.log("userdata",userdata);
        res.render("user/editProfile", {userdata});

    }
    catch(error){
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
        
}


exports.postEditProfile = async ( req,res)=> {
    try {
        const userEmail = req.params.user;
        const userData = await userCollection.findOne(userEmail);

        const userId = userData._id;
        
        // Assuming you have a user model with update method
        await userCollection.findByIdAndUpdate( userId, {

            name: req.body.name,
            email: req.body.email,
        }).then((pass)=> {

            console.log("updatedProfile", pass);
            res.redirect('/profile');
        });

    } catch (error) {
        console.error("error in editProfile",error);
        return res.status(500).json({ error: 'Internal server error' });
    }

}

exports.getAddressManage = async (req,res)=> {

    try{
        const addresses = await Address.find();
        const successMessage= req.query.success
        res.render("user/addressManage", {addresses,successMessage});
    }catch(error){

        console.error('Error fetching addresses:', error);
        res.status(500).send('Internal Server Error');
    }
  
}



