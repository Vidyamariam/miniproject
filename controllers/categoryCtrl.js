const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
const categoryCollection = require("../model/category");


//get methods

const getCategoryManage = async(req,res)=>{

    try{
        const categories = await categoryCollection.find();
        res.render("admin/categoryManage", { categories});
    }catch(error){
        console.error(error);
        res.status(500).send("Internal server error");
    }
}


const getaddcategory = (req,res)=>{

    res.render("admin/addCategory");
}


const postAddCategory = async (req, res) => {
    const categoryName = req.body.categoryName;

    // Validate if categoryName is provided
    if (!categoryName) {
        return res.status(400).render("admin/addCategory", { error: 'Category name is required' });
    }

    // Validate if categoryName starts with a capital letter
    const firstLetter = categoryName.charAt(0);
    if (firstLetter !== firstLetter.toUpperCase()) {
        return res.status(400).render("admin/addCategory", { error: 'Category name should start with a capital letter' });
    }

    try {
        // Check if the category already exists
        const existingCategory = await categoryCollection.findOne({ categoryName });

        if (existingCategory) {
            // If the category already exists, handle the error
            res.status(400).render("admin/addCategory", { error: 'Category with this name already exists' });
        } else {
            // Add the category to your data storage
            const newCategory = await categoryCollection.create({ categoryName });
            console.log("Category added:", newCategory);
            res.redirect("/admin/category");
        }
    } catch (error) {
        console.error('Error adding category to the database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const getEditCategory = async(req,res)=>{
       let id = req.params.categoryId;
    try{    
        const data = await categoryCollection.find();
        const name = await categoryCollection.findById(id);
        console.log("Category ID:", data);
        console.log("Category ID:", id);

        res.render("admin/editCategory", { data, id, name: name.categoryName });

    }
    catch(error){
        console.log(error);
        console.log("Error in getEdit Category");
    }
};


const postEditCategory = async (req,res)=> {

    try{
        const categoryId = req.params.id;
        console.log("categoryId:", categoryId);
        console.log("req.body:", req.body);

        //find the category by id
        const category = await categoryCollection.findById(categoryId);
        console.log("Category found ",category);

        if(!category){
            console.log("category not found");
            return res.status(404).send("category not found");
        }

        const newCategory = req.body.categoryName;
        console.log("New category", newCategory);

        const existsCategory = await categoryCollection.findOne({
            categoryName: newCategory,
            _id: { $ne: category._id }, 
          });

          if (existsCategory) {
            return res.render("admin/editCategory", { message: "Category Already Exists" });
          }

           // Update the properties
      category.categoryName = newCategory;

      // Save the updated category
      const updatedCategory = await category.save();

      console.log("Update", updatedCategory);

      res.redirect("/admin/category");
    }catch(error){
        console.error("Error updateing category:", error);
        res.status(500).send("Internal server error");
    }
};

const postDeleteCategory = async (req, res) => {
    const categoryId = req.params.categoryId;

    try {
        const category = await categoryCollection.findById(categoryId);

        if (!category) {
            return res.status(404).send("Category not found");
        }

        const result = await categoryCollection.findByIdAndDelete(categoryId);

        console.log("Deleted", result);
        res.redirect("/admin/category");
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).send("Internal Server Error");
    }
};


module.exports = {

    getCategoryManage,getaddcategory,postAddCategory,getEditCategory,postEditCategory,postDeleteCategory
    

}