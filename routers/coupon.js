const express = require('express');
const router = express.Router();
const AdminAuthentcation = require("../middleware/adminAuth");
const isBlock = require('../middleware/userAuth');
const couponController = require('../controllers/couponController');


router.get('/manage-coupon',AdminAuthentcation,couponController.getCouponManage);
router.get('/addcoupon',AdminAuthentcation, couponController.getAddCoupon);
router.get('/editcoupon/:id',AdminAuthentcation, couponController.getEditCoupon);
router.get('/coupons',isBlock.isblocked, couponController.getUserCouponManage);
router.get("/search-coupon",AdminAuthentcation, couponController.searchCoupon);

router.post('/addcoupon',AdminAuthentcation, couponController.postAddCoupon);
router.post('/editcoupon/:id',AdminAuthentcation, couponController.postEditCoupon);
router.post('/deletecoupon/:id',AdminAuthentcation, couponController.deleteCoupon);
router.post('/apply-coupon',isBlock.isblocked, couponController.applyCoupon);
router.post('/remove-coupon',isBlock.isblocked , couponController.removeCoupon);



module.exports = router;