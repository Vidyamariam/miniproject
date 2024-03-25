const AdminData = require("../model/adminModel");

const isLogin =  async (req, res, next)=> {
 

    const Auth = await AdminData.findOne({_id:req.session.admin});
   console.log("Auth",Auth)
      if (req.session.admin) {

    next();

  } else {

    res.redirect("/admin/login");
    
  }
}

module.exports = isLogin;