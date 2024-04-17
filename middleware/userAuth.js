const  signupCollection = require('../model/userSignupSchema');

const isblocked = async (req, res, next) => {
  try {
      const emailObj = req.session.user;
     
      const email = emailObj.email; // Extract email from the object
      console.log("email", email); 
      if (email) {
          const userData = await signupCollection.findOne({ email: email });
        
          console.log("session", req.session.user);
          if (userData && userData.isBlocked === false) {
              next();
          } else {
              res.redirect("/userlogin");
          }
      } else {
          res.redirect("/userlogin"); // Redirect if email is not found in session
      }
  } catch (error) {
      console.error(error);
      res.redirect("/userlogin"); // Redirect in case of any errors
  }
}


module.exports = { isblocked };
