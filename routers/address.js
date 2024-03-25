const express = require('express');
const router = express.Router();


const addressController = require("../controllers/addressCtrl");
const isBlock = require('../middleware/userAuth');

router.get("/address",isBlock.isblocked, addressController.getAddressManage);
router.get('/editAddress/:id', addressController.getEditAddress);

router.post('/addAddress', addressController.addAddress);
router.post('/editAddress/:id', addressController.postEditAddress);
router.post('/deleteAddress/:addressId', addressController.deleteAddress);
module.exports = router;