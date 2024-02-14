const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({

   categoryName:{
    type: String,
   }

})

const categoryCollection = mongoose.model("productcategories",categorySchema);

module.exports = categoryCollection;


