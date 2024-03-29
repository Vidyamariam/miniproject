const express = require('express');
const router = express.Router();


const userController = require('../controllers/userCtrl');
const productDetailsCtrl = require('../controllers/productDetailsCtrl');
const otpController = require('../controllers/otpController');
const cartController = require('../controllers/cartController');
const profileController = require('../controllers/profileCtrl');
const wishlistController = require('../controllers/wishlistController');
const isBlock = require('../middleware/userAuth');
const generateOrderId = require('../middleware/generateOrderId');

//GET METHODS
router.get("/", userController.landing);
router.get("/userlogin",userController.login);
router.get("/signup",userController.signupGet);
router.get("/home", userController.getHome);
router.get("/verifyemail", userController.getVerifyEmail);
router.get("/all-products",isBlock.isblocked,userController.allProducts);
router.get("/ethnic",isBlock.isblocked,userController.Ethnics);
router.get("/contemporary",isBlock.isblocked,userController.Contemporary);
router.get("/logout",userController.getLogout);
router.get("/resend", userController.resendOTP);
router.get("/productDetails/:id",productDetailsCtrl.getProductDetails);
router.get("/profile",isBlock.isblocked, profileController.getProfile);
router.get("/editprofile",isBlock.isblocked, profileController.getEditProfile);
router.get("/cart",isBlock.isblocked,cartController.getCart);
router.get("/remove/:productId",isBlock.isblocked, cartController.removeItem);
// router.get("/check-stock/:productId/:quantity", cartController.checkStock);
router.get("/checkout",isBlock.isblocked, cartController.getCheckoutPage);
router.get("/order-success",isBlock.isblocked, cartController.orderSuccessPage);
router.get("/order-history",isBlock.isblocked,cartController.orderHistory);
router.get("/order-details/:orderId/:productId", cartController.orderDetails);
router.get("/search-results", userController.searchItems);
router.get("/sortProduct/:sortBy",userController.sortProduct);
router.get("/wishlist", wishlistController.getWishlist);
router.get("/remove-wishlist/:productId", wishlistController.removeWishlist);


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
router.post("/checkout", generateOrderId, cartController.placeOrder);
router.post("/cancelOrder", cartController.cancelOrder);
router.post("/returnOrder",cartController.returnOrder);
router.post("/add-wishlist/:productId",wishlistController.addToWishlist);


module.exports = router;
