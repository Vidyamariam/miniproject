const express = require('express');
const adminController = require("../controllers/adminCtrl");
const productController = require("../controllers/productCtrl");
const categoryController = require("../controllers/categoryCtrl");
const router = express.Router();
const uploads = require("../middleware/upload");






//GET METHODS
router.get("/login",adminController.login);
router.get("/dashboard",adminController.dashboard);
router.get("/category", categoryController.getCategoryManage);
router.get("/addcategory",categoryController.getaddcategory);
router.get("/editcategory/:categoryId",categoryController.getEditCategory);
router.get("/productmanage",productController.getProductManage);
router.get("/addproduct",productController.getAddProduct);
router.get("/editproduct/:id",productController.getProductEdit);
router.get("/usermanage", adminController.getUserManage);
router.get("/adminlogout", adminController.getAdminLogout);


//POST METHODS
router.post("/login",adminController.loginpost);
router.post("/addcategory",categoryController.postAddCategory);
router.post("/editcategory/:id", categoryController.postEditCategory);
router.post("/categoryvisibility/:id",categoryController.categoryVisibility );
router.post("/addproduct/:productid",uploads,productController.postAddProduct);
router.post("/editproduct/:id",uploads,productController.postEditProduct);
router.post("/visibility/:id",productController.productVisibility);
router.post("/blockuser/:userId",adminController.blockUser);
router.post("/adminlogout", adminController.postAdminLogout);


module.exports = router;