const express = require('express');
const adminController = require("../controllers/adminCtrl");
const productController = require("../controllers/productCtrl");
const categoryController = require("../controllers/categoryCtrl");
const router = express.Router();
const session = require("express-session")
const uploads = require("../middleware/upload");
const AdminAuthentcation = require("../middleware/adminAuth");






//GET METHODS
router.get("/login",adminController.login);
router.get("/dashboard",AdminAuthentcation,adminController.dashboard);
router.get("/category",AdminAuthentcation, categoryController.getCategoryManage);
router.get("/addcategory",AdminAuthentcation, categoryController.getaddcategory);
router.get("/editcategory/:categoryId",AdminAuthentcation ,categoryController.getEditCategory);
router.get("/productmanage",AdminAuthentcation, productController.getProductManage);
router.get("/addproduct",AdminAuthentcation ,productController.getAddProduct);
router.get("/editproduct/:id",AdminAuthentcation ,productController.getProductEdit);
router.get("/usermanage",AdminAuthentcation ,adminController.getUserManage);
router.get("/adminlogout",AdminAuthentcation ,adminController.getAdminLogout);
router.get("/order-list",AdminAuthentcation ,adminController.getOrders);
router.get("/filterproducts",AdminAuthentcation ,adminController.filterByCategory);
router.get("/adminOrderDetails/:orderId/:productId",AdminAuthentcation ,adminController.adminOrderDetails);


//POST METHODS
router.post("/login",adminController.loginpost);
router.post("/addcategory",AdminAuthentcation ,categoryController.postAddCategory);
router.post("/editcategory/:id",AdminAuthentcation ,categoryController.postEditCategory);
router.post("/categoryvisibility/:id",AdminAuthentcation ,categoryController.categoryVisibility );
router.post("/addproduct",AdminAuthentcation ,uploads,productController.postAddProduct);
router.post("/editproduct/:id",AdminAuthentcation ,uploads,productController.postEditProduct);
router.post("/visibility/:id",AdminAuthentcation ,productController.productVisibility);
router.post("/blockuser/:userId",AdminAuthentcation ,adminController.blockUser);
router.post("/adminlogout",AdminAuthentcation ,adminController.postAdminLogout);
router.post("/updateOrderStatus",AdminAuthentcation ,adminController.postOrders);


module.exports = router;