const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    
    name: {
        type: String,
    },
    category: {
        type: String,
    },
    productImage: {
        type: [String],
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
    },
    discount: {
        type: Number,
        default: 0,
    },
    stock: {
        type: Number,
    },
    isListed: {
        type: Boolean,
        default: true,
    },
   
});

const productsCollection = mongoose.model('products', productSchema);

module.exports = productsCollection;
