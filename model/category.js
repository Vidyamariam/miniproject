const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({

   categoryName:{
    type: String,
   },
   isListed: {
      type: Boolean,
       default: true,
   },
   categoryOffer:{
      type: Number,
      default: 0,
   },

})

const categoryCollection = mongoose.model("categories",categorySchema);

module.exports = categoryCollection;


