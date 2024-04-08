const express = require('express');
const router = express.Router();
const isBlock = require('../middleware/userAuth');
const profileController = require('../controllers/profileCtrl');

router.get("/profile", isBlock.isblocked, profileController.getProfile);
router.get("/download-invoice/:orderId/:productId", profileController.downloadInvoice);
router.get("/change-password", profileController.getChangePassword);


router.get("/editprofile", isBlock.isblocked, profileController.getEditProfile);
router.post("/editprofile", isBlock.isblocked, profileController.postEditProfile);
router.post("/change-password", profileController.postChangePassword);

module.exports = router;
