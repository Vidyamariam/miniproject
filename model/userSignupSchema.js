const mongoose = require("../database/dbconnect");

let userSignupSchema = new mongoose.Schema({

    name : {
        type: String,
        
    },
    email : {
        type : String,
        
    },
    password : {
        type : String,
       
    },
    confirmPassword: {
       type: String,
    },
    
    isBlocked: { 
        type: Boolean, 
        default: false,
    },
    Wallet:{
        balance: {type:Number, default:0},
        transactions:[{
            amount: {type: Number},
            description:{type:String},
            date: {type: Date, default: Date.now},
        }],
    }
});

module.exports = mongoose.model("newusers",userSignupSchema);



