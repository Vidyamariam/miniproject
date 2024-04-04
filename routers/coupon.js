const express = require('express');
const router = express.Router();
const AdminAuthentcation = require("../middleware/adminAuth");

const couponController = require('../controllers/couponController');


router.get('/manage-coupon',couponController.getCouponManage);
router.get('/addcoupon',couponController.getAddCoupon);
router.get('/editcoupon/:id',couponController.getEditCoupon);
router.get('/coupons',couponController.getUserCouponManage);


router.post('/addcoupon',couponController.postAddCoupon);
router.post('/editcoupon/:id',couponController.postEditCoupon);
router.post('/deletecoupon/:id',couponController.deleteCoupon);
router.post('/apply-coupon',couponController.applyCoupon);
router.post('/remove-coupon',couponController.removeCoupon);



module.exports = router;