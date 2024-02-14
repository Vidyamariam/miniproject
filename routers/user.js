const express = require('express');
const router = express.Router();

// const userController = require('../controllers/userCtrl');
const userController = require('../controllers/userCtrl');

//GET METHODS
router.get("/", userController.landing);
router.get("/userlogin",userController.login);
router.get("/signup",userController.signupGet);
router.get("/home", userController.home);
router.get("/verifyemail", userController.getVerifyEmail);
router.get("/athleticshoes",userController.getAthletics);
router.get("/logout",userController.getLogout);




//POST METHODS
router.post("/userlogin",userController.loginpost);
router.post("/signup",userController.signupPost);
router.post("/logout",userController.postLogout);
router.post("/verifyemail", userController.verifyEmailPost);


module.exports = router;
