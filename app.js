const express = require('express');
const path = require("path");
const app = express();
const nocache = require('nocache');
// const morgan = require('morgan');
const {name}=require("ejs")
const cookieParser= require('cookie-parser')
const session = require('express-session');
const bodyParser = require("body-parser");


require('dotenv').config();



app.use(bodyParser.json());
// app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('views', path.join(__dirname,"views"));
app.set("view engine", "ejs");
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// app.use(function (req, res, next)
// {
//     res.locals.toasts = req.toastr.render()
//     next()
// });
//creating session
const oneday = 1000*60*60*24;
app.use(nocache());   //to destroy cache
app.use(cookieParser('secret'));
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
const adminRouter = require("./routers/admin")
const addressRouter = require('./routers/address');
const profileRouter = require('./routers/profile');
const couponRouter = require('./routers/coupon');


//
app.use('/',userRouter);
app.use('/admin',adminRouter);
app.use('/', addressRouter);
app.use('/',profileRouter);
app.use('/',couponRouter);

const port = process.env.PORT || 3000;
app.listen(port, ()=>{

    console.log("server is running on http://localhost:3000");
});


