const express = require('express');
const router = express.Router();


const userController = require('../controllers/userCtrl');
const productDetailsCtrl = require('../controllers/productDetailsCtrl');
const otpController = require('../controllers/otpController');
const cartController = require('../controllers/cartController');
const wishlistController = require('../controllers/wishlistController');
const isBlock = require('../middleware/userAuth');
const generateOrderId = require('../middleware/generateOrderId');

//GET METHODS
router.get("/", userController.landing);
router.get("/userlogin",userController.login);
router.get("/signup",userController.signupGet);
router.get("/home",isBlock.isblocked, userController.getHome);
router.get("/verifyemail", userController.getVerifyEmail);
router.get("/product-list/:action",isBlock.isblocked,userController.allProducts);
router.get("/ethnic",isBlock.isblocked,userController.Ethnics);
router.get("/contemporary",isBlock.isblocked,userController.Contemporary);
router.get("/logout",userController.getLogout);
router.get("/resend", userController.resendOTP);
router.get("/contemporary",isBlock.isblocked,userController.Contemporary);
router.get("/productDetails/:id",isBlock.isblocked,productDetailsCtrl.getProductDetails);

router.get("/cart",isBlock.isblocked,cartController.getCart);
router.get("/remove/:productId",isBlock.isblocked, cartController.removeItem);
router.get("/checkout",isBlock.isblocked, cartController.getCheckoutPage);
router.get("/order-success",isBlock.isblocked, cartController.orderSuccessPage);
router.get("/order-history",isBlock.isblocked,cartController.orderHistory);
router.get("/order-details/:orderId/:productId",isBlock.isblocked, cartController.orderDetails);
router.get("/wishlist",isBlock.isblocked, wishlistController.getWishlist);
router.get("/remove-wishlist/:productId",isBlock.isblocked, wishlistController.removeWishlist);
router.get("/userFilterproducts",isBlock.isblocked ,userController.userFilterByCategory);
router.get("/wallet",isBlock.isblocked ,userController.getWallet);
router.get("/verify-email", userController.forgotPassword);
router.get("/verifyOtp", userController.getverifyOtp);
router.get("/update-password",userController.getChangePassword);
router.get("/password-changed", userController.passwordChangeSuccess);
router.get("/resendforgot", userController.resendForgotOtp);
router.get("/about-us",isBlock.isblocked, userController.aboutUs);
 

//POST METHODS
router.post("/userlogin",userController.loginpost);
router.post("/signup",userController.signupPost);
router.post("/logout",userController.postLogout);
router.post("/verifyemail", userController.verifyEmailPost);
router.post('/resendOtp', otpController.resendOTP);
router.post("/add-to-cart/:productId",isBlock.isblocked, cartController.addToCart);
router.post("/updateQuantity/:itemId",isBlock.isblocked, cartController.updateQuantity);
router.post("/add-address",isBlock.isblocked ,cartController.checkoutAddAddress);
router.post("/checkout",isBlock.isblocked, generateOrderId, cartController.placeOrder);
router.post("/order2ForRazorPay", isBlock.isblocked ,generateOrderId, cartController.razorpayOrder);
router.post("/cancelOrder",isBlock.isblocked ,cartController.cancelOrder);
router.post("/returnOrder",isBlock.isblocked ,cartController.returnOrder);
router.post("/add-wishlist/:productId",isBlock.isblocked ,wishlistController.addToWishlist);
router.post("/create/:orderId",isBlock.isblocked ,cartController.razorpay);
router.post('/createReferral',isBlock.isblocked , userController.createReferral);
router.post('/checkReferralCode', userController.checkReferralCode);
router.post('/verify-email', userController.postForgotPassword);
router.post("/verifyOtp", userController.postverifyOtp);
router.post("/update-password",userController.postChangePassword);
router.post("/payment-failure",isBlock.isblocked, cartController.paymentFailure);
router.post("/retry-payment",isBlock.isblocked, cartController.retryPayment);
router.post('/update-order-status',isBlock.isblocked, cartController.updateOrderStatus);

module.exports = router;
