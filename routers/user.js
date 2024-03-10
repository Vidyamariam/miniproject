const express = require('express');
const router = express.Router();


const userController = require('../controllers/userCtrl');
const productDetailsCtrl = require('../controllers/productDetailsCtrl');
const otpController = require('../controllers/otpController');
const cartController = require('../controllers/cartController');
const profileController = require('../controllers/profileCtrl');
const isBlock = require('../middleware/authMiddleware');

//GET METHODS
router.get("/", userController.landing);
router.get("/userlogin",userController.login);
router.get("/signup",userController.signupGet);
router.get("/home", userController.getHome);
router.get("/verifyemail", userController.getVerifyEmail);
router.get("/athletic-shoes",userController.getAthletics);
router.get("/boots",userController.boots);
router.get("/casual-shoes",userController.casualShoes);
router.get("/logout",userController.getLogout);
router.get("/resend", userController.resendOTP);
router.get("/productDetails/:id",productDetailsCtrl.getProductDetails);
router.get("/profile",isBlock.isblocked, profileController.getProfile);
router.get("/editprofile",isBlock.isblocked, profileController.getEditProfile);
router.get("/address",isBlock.isblocked, profileController.getAddressManage);
router.get("/cart",isBlock.isblocked,cartController.getCart);
router.get("/remove/:productId",isBlock.isblocked, cartController.removeItem);
router.get("/check-stock/:productId/:quantity", cartController.checkStock);
router.get("/checkout", cartController.getCheckoutPage);

//POST METHODSs
router.post("/userlogin",userController.loginpost);
router.post("/signup",userController.signupPost);
router.post("/logout",userController.postLogout);
router.post("/verifyemail", userController.verifyEmailPost);
router.post('/resendOtp', otpController.resendOTP);
router.post("/editprofile",isBlock.isblocked, profileController.postEditProfile);
router.post("/add-to-cart/:productId",isBlock.isblocked, cartController.addToCart);
router.post("/updateQuantity/:itemId",isBlock.isblocked, cartController.updateQuantity);
router.post("/add-address", cartController.checkoutAddAddress);


module.exports = router;
