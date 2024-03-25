const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
const categoryCollection = require("../model/category");
const productsCollection = require("../model/productSchema");
const multer = require("../middleware/upload");
const gm = require("gm").subClass({ imageMagick: true });



const ITEMS_PER_PAGE = 5; // Number of products to display per page

const getProductManage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get the requested page number from the query parameters, default to 1 if not provided

    const totalProducts = await productsCollection.countDocuments();
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const products = await productsCollection.find()
      .skip(skip)
      .limit(ITEMS_PER_PAGE);

    const categories = await productsCollection.distinct("category"); // Assuming "category" is a field in your products collection

    res.render("admin/productManageN", {
      categories,
      products,
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
      const product = await productsCollection.find();
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

        console.log("product details", req.body);

        // Validation for product name
        if (!name) {
          const categories = await categoryCollection.find();
          return res.render("admin/addProduct", {
              categories,
              msgName: 'Please enter a product name.',
          });
      }

      // Validation for category selection
      if (!category) {
          const categories = await categoryCollection.find();
          return res.render("admin/addProduct", {
              categories,
              msgCategory: 'Please select a category.',
          });
      }

        // Validate for empty price
        if (!price) {
          const categories = await categoryCollection.find();
          return res.render("admin/addProduct", {
              categories,
              msgPrice: 'Please enter a price.',
          });
      }

      // Validate for empty stock
      if (!stock) {
          const categories = await categoryCollection.find();
          return res.render("admin/addProduct", {
              categories,
              msgStock: 'Please enter the stock quantity.',
          });
      }


      // Validate for negative values
      if (price < 0 || discount < 0 || stock < 0) {
          const categories = await categoryCollection.find();
          return res.render("admin/addProduct", {
              categories,
              msgNegativeValues: 'Price, discount, and stock must not be negative.',
          });
      }

      
        // Validate for empty product images
        if (!req.files || req.files.length === 0) {
          const categories = await categoryCollection.find();
          return res.render("admin/addProduct", {
              categories,
              msgImage: 'Please upload at least one product image.',
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
       console.log('data',data)

        const updatedProduct = await productsCollection.create(data);
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
        const items = await productsCollection.findById(id);
        console.log("productsss", items, category);
        res.render("admin/editProduct", {items:items,category:category});
    }catch(error){
        console.log("Error occur in getEditProduct",error);
    } 
 
};  

const postEditProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log("EditProductId:", productId);
    console.log("Request Body", req.body);

      // Check if required fields are empty
      if (!req.body.name || !req.body.category || !req.body.price || !req.body.stock) {
        const product = await productsCollection.findById(productId);
        const category = await categoryCollection.find();
        return res.render("admin/editProduct", {
            errorMsg: "Please fill in all required fields.",
            items: product,
            category: category
        });
    }

    // Check if price, discount, and stock are negative
    if (parseFloat(req.body.price) < 0 || parseFloat(req.body.discount) < 0 || parseInt(req.body.stock) < 0) {
        const product = await productsCollection.findById(productId);
        const category = await categoryCollection.find();
        return res.render("admin/editProduct", {
            errorMsg: "Price, discount, and stock must not be negative.",
            items: product,
            category: category
        });
    }

    let productImage = [];

    if (req.files && req.files.length > 0) {
      const fileUrls = req.files.map((file) => ` /uploads/${file.filename}`);
      productImage = fileUrls;
    }

    
    if (productImage.length === 0 || productImage.length === undefined) {
      const product = await productsCollection.findOne({ _id: productId });
      productImage = product.productImage;
    }

    await productsCollection.findByIdAndUpdate(productId, {
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      rating: req.body.rating,
      price: req.body.price,
      discount: req.body.discount,
      stock: req.body.stock,
      productImage: productImage,
    }).then((pass) => {
      res.redirect("/admin/productManage");
    });
  } catch (error) {
    console.log("error occurred in editProduct", error);
    res.status(500).send("Internal server error");
  }
};


// Product Visibility
const productVisibility = async (req, res) => {
    try {
      const productId = req.params.id;
      const product = await productsCollection.findById(productId);
  
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


