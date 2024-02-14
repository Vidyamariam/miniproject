const express = require('express');
const path = require("path");
const app = express();
const session = require('express-session');
const nocache = require('nocache');
const morgan = require('morgan');
const {name}=require("ejs")

require('dotenv').config();




app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('views', path.join(__dirname,"views"));
app.set("view engine", "ejs");
app.use('/uploads',express.static(__dirname+"/uploads"))


//creating session
const oneday = 1000*60*60*24;
app.use(nocache());   //to destroy cache
app.use(
    session({
        secret: "your-secret-key",
        resave: false,
        cookie: {maxAge: oneday},
        saveUninitialized: true,
        rolling : true  //

    })
)

//requiring routes
const userRouter = require("./routers/user");
const adminRouter = require('./routers/admin');

//
app.use('/',userRouter);
app.use('/admin',adminRouter);

const port = process.env.PORT || 2001;
app.listen(port, ()=>{

    console.log("server is running on http://localhost:2001");
});


