const express = require('express');
const router = express.Router();


const addressController = require("../controllers/addressCtrl");



router.get('/editAddress/:id', addressController.getEditAddress);

router.post('/addAddress', addressController.addAddress);
router.post('/editAddress/:id', addressController.postEditAddress);
router.post('/deleteAddress/:addressId', addressController.deleteAddress);
module.exports = router;