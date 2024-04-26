const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
const categoryCollection = require("../model/category");
const productsCollection = require("../model/productSchema");

//get methods

const getCategoryManage = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1; // Get the requested page number from the query parameters, default to 1 if not provided
      const limit = 5;
      const totalCategories = await categoryCollection.countDocuments(); // Get the total number of categories

      const totalPages = Math.ceil(totalCategories / limit); // Calculate the total number of pages
      const skip = (page - 1) * limit; // Calculate the number of documents to skip

      const categories = await categoryCollection.find().skip(skip).limit(limit); // Fetch categories for the current page

      res.render("admin/categoryManageN", { 
          categories,
          totalPages,
          currentPage: page
      });
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal server error");
  }
};


const getaddcategory = (req,res)=>{

    res.render("admin/addCategoryN");
}


const postAddCategory = async (req, res) => {
  const categoryName = req.body.categoryName;
 

  // Validate if categoryName is provided
  if (!categoryName) {
    return res.status(400).render("admin/addCategoryN", { error: 'Category name is required' });
  }


  try {
    // Check if the category already exists (case-insensitive)
    const existingCategory = await categoryCollection.findOne({ categoryName: { $regex: new RegExp('^' + categoryName + '$', 'i') } });

    if (existingCategory) {
      // If the category already exists, handle the error
      return res.status(400).render("admin/addCategoryN", { error: 'Category with this name already exists' });
    } else {
      // Add the category to your data storage
      const newCategory = await categoryCollection.create({ categoryName});
      console.log("Category added:", newCategory);

     
      return res.redirect("/admin/category");
    }
  } catch (error) {
    console.error('Error adding category to the database:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};




const getEditCategory = async(req,res)=>{
      
    try{    
        const id = req.params.categoryId;

    // Find the category by ID
    const category = await categoryCollection.findById(id);

    console.log();

    res.render("admin/editCategoryN", {
      id,
      name: category.categoryName,
      offer: category.categoryOffer,
    });
    }
    catch(error){
        console.log(error);
        console.log("Error in getEdit Category");
    }
};


const postEditCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    

    console.log("categoryId:", categoryId);
    console.log("req.body in post edit category", req.body);

    // Find the category by id
    const category = await categoryCollection.findById(categoryId);
    console.log("Category found ", category);

    if (!category) {
      console.log("category not found");
      return res.status(404).send("category not found");
    }

    const newCategoryName = req.body.categoryName;
    console.log("New category name:", newCategoryName);


     // Check if the new category name is empty
     if (!newCategoryName.trim()) {
      return res.render("admin/editCategoryN", {
        id: categoryId,
        name: category.categoryName,
        offer: category.categoryOffer,
        categoryNameError: "Category name is required.",
      });
    }

     // Check if the first character of the new category name is a letter (uppercase or lowercase)
     if (!/^[a-zA-Z]/.test(newCategoryName)) {
      return res.render("admin/editCategoryN", {
        id: categoryId,
        name: category.categoryName,
        offer: category.categoryOffer,
        categoryNameError: "Category Name must start with a letter.",
      });
    }

    const existingCategory = await categoryCollection.findOne({
      categoryName: { $regex: new RegExp('^' + newCategoryName + '$', 'i') }
    });
    if (existingCategory && existingCategory._id.toString() !== categoryId) {
      return res.render("admin/editCategoryN", {
        id: categoryId,
        name: category.categoryName,
        offer: category.categoryOffer,
        categoryNameError: "Category Already Exists",
      });
    }
    

// Update the category name
category.categoryName = newCategoryName;

    // Check if the discount is provided and valid
    if (req.body.categoryOffer !== undefined) {
      const newOffer = parseFloat(req.body.categoryOffer);

      if (newOffer > 50 || isNaN(newOffer)) {
        return res.render("admin/editCategoryN", {
          id: categoryId,
          name: category.categoryName,
          offer: category.categoryOffer,
          message: "Category discount cannot be greater than 50.",
        });
      } else if (newOffer < 0) {
        return res.render("admin/editCategoryN", {
          id: categoryId,
          name: category.categoryName,
          offer: category.categoryOffer,
          message: "Category discount cannot be negative",
        });
      }
      category.categoryOffer = newOffer;
     
       // Update products belonging to this category with the new category offer
       const newProducts = await productsCollection.updateMany(
        { category: category.categoryName },
        { $set: { discount: newOffer } },
        
      );
    console.log("product with new category offer",newProducts );

    }

   
    // Save the updated category
    const updatedCategory = await category.save();

    // console.log("Update", updatedCategory);

    res.redirect("/admin/category");
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).send("Internal server error");
  }
};


  
  

// const postDeleteCategory = async (req, res) => {
//     const categoryId = req.params.categoryId;

//     try {
//         const category = await categoryCollection.findById(categoryId);

//         if (!category) {
//             return res.status(404).send("Category not found");
//         }

//         const result = await categoryCollection.findByIdAndDelete(categoryId);

//         console.log("Deleted", result);
//         res.redirect("/admin/category");
//     } catch (error) {
//         console.error("Error deleting category:", error);
//         res.status(500).send("Internal Server Error");
//     }
// };

const categoryVisibility = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await categoryCollection.findById(categoryId);

    if (!category) {
      return res.status(404).send("Category not found");
    }

    // Toggle the visibility of the category
    category.isListed = !category.isListed;

    // Save the updated category
    await category.save();

    // Update the visibility of all products in the category
    await productsCollection.updateMany(
      { category: category.categoryName },
      { $set: { isListed: category.isListed } }
    );

    res.redirect("/admin/category");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};


module.exports = {

    getCategoryManage,getaddcategory,postAddCategory,getEditCategory,postEditCategory,categoryVisibility
    

}