const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
const categoryCollection = require("../model/category");
const AddProduct = require("../model/productSchema");
const multer = require("../middleware/upload");
const gm = require("gm").subClass({ imageMagick: true });





// const getProductManage = async (req,res)=>{
   
//     try {
//         const categories = await AddProduct.find();
//         const product = await AddProduct.find();
//         const productId = await AddProduct.findById();
//     res.render("admin/productManage", {categories, product, productId});

//     }catch(error){
//     console.error(error);
//       res.status(500).send("Internal Server Error");
//     }
// }

const PRODUCTS_PER_PAGE = 5; // Adjust the number of products per page

const getProductManage = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const skip = (page - 1) * PRODUCTS_PER_PAGE;

    const totalProducts = await AddProduct.countDocuments();
    const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

    const products = await AddProduct.find()
      .skip(skip)
      .limit(PRODUCTS_PER_PAGE);

    const categories = await AddProduct.find();

    const productId = await AddProduct.findById(); // You may need to adjust this line based on your requirements

    res.render("admin/productManage", {
      categories,
      products,
      productId,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



const getAddProduct = async (req, res) => {
  try {
      const product = await AddProduct.find();
      const categories = await categoryCollection.find();
     
      
      console.log("love", product);
      console.log("ghj", categories);


      res.render("admin/addProduct", { categories, product});
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal server error");
  }
};




const postAddProduct = async (req, res) => {
    try {
       

        const {
            name,
            category,
            description,
            price,
            discount,
            stock,
            isListed,
            sizes,
        } = req.body;

      //    // Validate for negative values
         if (price < 0 || discount < 0 || stock < 0) {
          const categories = await categoryCollection.find();
          return res.render("admin/addProduct", {
              categories,
              msg: 'Price, discount, and stock must not be negative!!.',
          });
         }

        let productImage = [];


        if (req.files && req.files.length > 0) {
          const fileUrls = req.files.map((file) => ` /uploads/${file.filename}`);
          productImage = fileUrls;
        }

      
        const data = {
            
            name: name,
            category: category,
            productImage: productImage,
            description: description,
            price: price,
            discount: discount,
            stock: stock,
            isListed: isListed,
            sizes: Array.isArray(sizes) ? sizes : [sizes], // Ensure sizes is an array
        };

        

        const updatedProduct = await AddProduct.create(data);
        res.redirect("/admin/productmanage");


    } catch (error) {
        console.error('Error adding product:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const getProductEdit = async (req,res)=>{
    
    const id = req.params.id;
    try{
        const category = await categoryCollection.find();
        const items = await AddProduct.findById(id);
        console.log("productsss", items, category);
        res.render("admin/editProduct", {items,category});
    }catch(error){
        console.log("Error occur in getEditProduct",error);
    } 
 
};  

const postEditProduct = async (req,res)=>{
    
    try{
         const productId = req.params.id;
         console.log("EditProductId:", productId);
         console.log("Request Body", req.body);
      let productImage = [];

      if (req.files && req.files.length > 0) {
        const fileUrls = req.files.map((file) => ` /uploads/${file.filename}`);
        productImage = fileUrls;
      }
       
        await AddProduct.findByIdAndUpdate(productId, {
            name: req.body.name,
            category: req.body.category,
            description: req.body.description,
            rating: req.body.rating,
            price: req.body.price,
            discount: req.body.discount,
            stock: req.body.stock,
            productImage: productImage,
        }).then((pass)=>{
             
            console.log("updatedProduct", pass);
            res.redirect("/admin/productManage");
        });    
        
    }catch(error){       
        console.log("error occured in editProduct", error);
        res.status(500).send("Internal server error");
    }
};

// Product Visibility
const productVisibility = async (req, res) => {
    try {
      const productId = req.params.id;
      const product = await AddProduct.findById(productId);
  
      if (!product) {
        return res.status(404).send("Product not found");
      }
  
      product.isListed = !product.isListed;
  
      await product.save();
  
      res.redirect("/admin/productmanage");
    } catch (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    }
  };


module.exports = {
    getProductManage,
    getAddProduct,
    postAddProduct,
    getProductEdit,
    postEditProduct,
    productVisibility
};


