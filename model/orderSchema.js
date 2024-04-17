const mongoose = require('mongoose');
const moment = require('moment-timezone');


const orderSchema = mongoose.Schema({
    orderId: { type: String},
    userId: { type: String },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId},
        productName: { type: String},
        productDescription: { type: String,},
        productRating: { type: Number,default:0,},
        StockCount: { type: Number,},
        productImage: { type: [String]},
        quantity: { type: Number,min: 1 },
        price: { type: Number,min: 0 },
        status: { type: String,default:"Pending"},
        reason: { type: String,default: "" },
        discountPrice: { type: Number, default: 0 },
        couponCode: { type: String },
        refferalCode: { type: String },
    }],
    totalQuantity: { type: Number,min: 1 },
    totalPrice: { type: Number,min: 0 },
    address: {
        name:{type:String},
        address:{type:String},      
        locality:{type:String},
        pincode: {type:String},
        phone: {type:String},
        state: {type:String},   
    },
    paymentMethod: { type: String},
    orderDate: { type: Date },
    createdAt: { type: Date },
});

// Pre-save hook to format orderDate and createdAt fields using Moment.js
orderSchema.pre('save', function(next) {
    this.orderDate = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    this.createdAt = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");
    next();
});

const ordersCollection = mongoose.model('orders', orderSchema);

module.exports = ordersCollection;
