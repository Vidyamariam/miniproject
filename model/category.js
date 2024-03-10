const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({

   categoryName:{
    type: String,
   },
   isListed: {
      type: Boolean,
       default: true,
   }

})

const categoryCollection = mongoose.model("categories",categorySchema);

module.exports = categoryCollection;


