const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: false,
    },
    quantity: {
        type: Number,
        default: 1,
    },
    price: {
        type: Number,
    },
   
});

const userCartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'newusers',
        required: true,
    },
    items: [cartItemSchema],

    totalPrice: {
        type: Number
    }
});

const userCart = mongoose.model('usercarts', userCartSchema);

module.exports = userCart;
