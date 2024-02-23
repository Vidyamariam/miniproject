const express = require("express");
const productsCollection = require("../model/productSchema");


const getProductDetails = async (req,res)=>{
  
   try{
    const id = req.params.id;
    console.log("dhgash",id);
    const productdetails = await productsCollection.findOne({_id: id});
    console.log("dsfa", productdetails);

    if(!productdetails){
        res.status(404).send("Product not found");
    }
    else{
        res.render("user/productDetails", { productdetails });
    }
   }catch(error){
    console.log("Error occur in getProductDetails", error);
   }

};

module.exports = {
    getProductDetails
}