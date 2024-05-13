const express = require('express');
const router = express.Router();


const addressController = require("../controllers/addressCtrl");
const isBlock = require('../middleware/userAuth');

router.get("/address",isBlock.isblocked, addressController.getAddressManage);
router.get('/editAddress/:id',isBlock.isblocked, addressController.getEditAddress);

router.post('/addAddress',isBlock.isblocked, addressController.addAddress);
router.post('/editAddress/:id',isBlock.isblocked, addressController.postEditAddress);
router.post('/deleteAddress/:addressId',isBlock.isblocked, addressController.deleteAddress);
module.exports = router;