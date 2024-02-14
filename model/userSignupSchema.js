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
    
    isBlocked: { 
        type: Boolean, 
        default: false,
    },
    otp: {
        code: {
            type: String,
            default: null
        },
        expiration: {
            type: Date,
            default: null
        }
    }
}, { 
    
    timestamps: true 



})






const signupCollection = mongoose.model("newusers",userSignupSchema);

module.exports = signupCollection;

