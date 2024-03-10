const signupCollection = require("../model/userSignupSchema");

const isblocked = async (req,res,next)=> {

      try{
        const email = req.session.user;
        const userData = await signupCollection.findOne(email);
        console.log("userData",userData);
        if(userData.isBlocked === false){
            next();
        }
        else{
            res.redirect("/logout");
        }
      }
      catch(error){
        console.error(error);       
      }
}

module.exports = {isblocked};