const signupCollection = require("../model/userSignupSchema");

const isblocked = async (req,res,next)=> {

      try{
        const email = req.session.user;
        const userData = await signupCollection.findOne(email);
        console.log("userData",userData);
        console.log("session",req.session.user);
        if( req.session.user && userData.isBlocked === false){
            next();
        }
        else{
            res.redirect("/userlogin");
        }
      }
      catch(error){
        console.error(error);       
      }
}

module.exports = {isblocked};