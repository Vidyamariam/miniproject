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
});

module.exports = mongoose.model("newusers",userSignupSchema);



