const express = require('express');
const router = express.Router();
const isBlock = require('../middleware/userAuth');
const profileController = require('../controllers/profileCtrl');

router.get("/profile", isBlock.isblocked, profileController.getProfile);
router.get("/download-invoice/:orderId/:productId",isBlock.isblocked, profileController.downloadInvoice);
router.get("/change-password",isBlock.isblocked, profileController.getChangePassword);


router.get("/editprofile", isBlock.isblocked, profileController.getEditProfile);
router.post("/editprofile", isBlock.isblocked, profileController.postEditProfile);
router.post("/change-password",isBlock.isblocked, profileController.postChangePassword);

module.exports = router;


