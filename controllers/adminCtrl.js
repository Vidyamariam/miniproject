
const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
const categoryCollection = require("../model/category");
const userCollection = require("../model/userSignupSchema");
const ordersCollection = require("../model/orderSchema");
const productsCollection = require("../model/productSchema");
const mongoose = require("mongoose");
const adminCollection =  require("../model/adminModel");
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');




const login = (req,res)=>{
    if(req.session.admin) 
    res.redirect("/admin/dashboard");
    else
    res.render("admin/login");
   
}

const loginpost = async (req, res) => {
  const adminData = {
      username: req.body.username,
      password: req.body.password,
  }

  try {

      const adminDetails = await adminCollection.findOne({ username: adminData.username, password: adminData.password });

      if(!adminDetails){
        res.render("admin/login", { errorMessage: 'Invalid username' });

      }
      
      if (adminDetails.length === 0) {
          res.render("admin/login", { errorMessage: 'Invalid username or password' });
      } else {
        let data = adminDetails.username;
        console.log("admindataincollection",data);
          req.session.admin = adminDetails._id;
          res.redirect("/admin/dashboard");
      }
  } catch (error) {
      console.error("Error finding admin:", error);
      res.render("admin/login", { errorMessage: 'An error occurred. Please try again later.' });
  }
}


const dashboard = async (req, res) => {
  try {
    // Calculate total orders, total order amount, and total users from the orders collection
    const totalOrders = await ordersCollection.countDocuments({});
    const totalOrderAmount = await ordersCollection.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalPrice" },
        },
      },
    ]);
    const totalUsers = await ordersCollection.aggregate([
     
      {
        $group: {
          _id: "$userId", 
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }, 
        },
      },
    ]);


     // Calculate top 10 best selling products
     const topProducts = await ordersCollection.aggregate([
      { $unwind: "$products" }, // Deconstruct the products array
      {
        $group: {
          _id: "$products.productId", // Group by product ID
          productName: { $first: "$products.productName" }, // Get the product name
          totalQuantity: { $sum: "$products.quantity" }, // Sum the quantities
        },
      },
      { $sort: { totalQuantity: -1 } }, // Sort by total quantity in descending order
      { $limit: 10 }, // Limit to top 10 results
    ]);
    

    // console.log("top products ",topProducts);

     // Calculate best selling category
     const bestSellingCategory = await ordersCollection.aggregate([
      { $unwind: "$products" }, // Deconstruct the products array
      {
        $lookup: {
          from: "products", // Collection to join with
          localField: "products.productId", // Field from the orders collection
          foreignField: "_id", // Field from the products collection
          as: "productDetails", // Alias for the joined documents
        },
      },
      { $unwind: "$productDetails" }, // Deconstruct the productDetails array
      {
        $group: {
          _id: "$productDetails.category", // Group by product category
          totalQuantity: { $sum: "$products.quantity" }, // Sum the quantities
        },
      },
      { $sort: { totalQuantity: -1 } }, // Sort by total quantity in descending order
      { $limit: 1 }, // Limit to the top result
    ]);

    console.log("best catgeory: ", bestSellingCategory);


   // Calculate total orders per day and their statuses including total amount made
const ordersPerDay = await ordersCollection.aggregate([
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Group by order date
      totalOrders: { $sum: 1 }, // Count total orders per day
      totalAmount: { $sum: "$totalPrice" } // Sum of total price per day
    },
  },
  { $sort: { _id: 1 } }, // Sort by order date
]);


     // Calculate the count of orders with different statuses
     const statusCounts = await ordersCollection.aggregate([
      {
        $unwind: "$products" // Deconstruct the products array
      },
      {
        $group: {
          _id: "$products.status", // Group by status
          count: { $sum: 1 } // Count the occurrences of each status
        }
      }
    ]);

    // console.log("status counts: ", statusCounts);
    

    // Render the dashboard template with data
    res.render("admin/dashboard", {
      totalOrders,
      totalOrderAmount: totalOrderAmount.length > 0 ? totalOrderAmount[0].totalAmount : 0,
        totalUsers: totalUsers.length > 0 ? totalUsers[0].count : 0,
        topProducts,
        bestSellingCategory: bestSellingCategory.length > 0 ? bestSellingCategory : [],
        ordersPerDay,
        statusCounts
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const salesFilter = async (req, res) => {
  try {
    const selectedOption = req.body.selectedOption;

    // Define variables to hold total orders data
    let totalOrdersData = [];

    // Calculate total orders based on selected option
    switch (selectedOption) {
      case "daily":
        // Calculate total orders per day
        totalOrdersData = await ordersCollection.aggregate([
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
              totalOrders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);
        break;
      case "weekly":
        // Calculate total orders per week
        totalOrdersData = await ordersCollection.aggregate([
          {
            $group: {
              _id: { $isoWeek: "$orderDate" },
              totalOrders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);
        break;
      case "monthly":
        // Calculate total orders per month
        totalOrdersData = await ordersCollection.aggregate([
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m", date: "$orderDate" } },
              totalOrders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);
        break;
      case "yearly":
        // Calculate total orders per year
        totalOrdersData = await ordersCollection.aggregate([
          {
            $group: {
              _id: { $year: "$orderDate" },
              totalOrders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);
        break;
      default:
        // Handle invalid option
        res.status(400).json({ error: "Invalid option" });
        return;
    }

    // Send total orders data back to the client
    res.json(totalOrdersData);
  } catch (error) {
    console.error("Error fetching total orders data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




const getUserManage = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1; // Get page number from query parameter, default to 1 if not provided
      const limit = 5; // Number of users per page
      const skip = (page - 1) * limit; // Calculate the number of documents to skip

      const totalUsers = await userCollection.countDocuments(); // Get total number of users
      const totalPages = Math.ceil(totalUsers / limit); // Calculate total pages

      const userFind = await userCollection.find().skip(skip).limit(limit); // Get users for the current page

      res.render("admin/userManageNew", { userFind, totalPages, currentPage: page });
  } catch (error) {
      console.log("Error while users find in adminctrl", error);
      res.status(500).send("Internal Server Error");
  }
};






// const postUserManage = async (req,res)=>{

//     try{
//         const userFind = await userCollection.find();
//         console.log("ifhsjdifhisjhfijoia",userFind);
//         res.render("admin/userManagement", {userFind});

//     }catch(error){

//         console.log("error in finding user in adminCtrl", error);
//     }
// };


//Block/unblock user
const blockUser = async (req,res)=> {

    try{
        const userId = req.params.userId;
          console.log("sdfg",userId);

        const user = await userCollection.findById(userId);
        console.log("user data from databse",user)

        if (!user) {
          return res.status(404).send("User not found");
        }
    
        user.isBlocked = !user.isBlocked;
    
        const updatedUser = await user.save();
    
        console.log("User Blocked/Unblocked:", updatedUser);
    
        res.redirect("/admin/usermanage");
      } catch (error) {
        console.error("Error blocking/unblocking user:", error);
        res.status(500).send("Internal Server Error");
      }

}

const getAdminLogout = (req,res) => {
   
  
    delete req.session.admin;
          res.redirect("/admin/login"); 
  
}

const postAdminLogout =  (req,res)=> {

    req.session.user = null;
  req.session.destroy((err)=>{

    if(err){
 
      console.error("Error destroying session:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }else{

      res.redirect("/admin/login");
    }
  })
}



//ORDERS

const getOrders = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 5; // Default limit to 5 if not provided

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Fetch orders from the database with pagination and sort by creation timestamp in descending order
    const orders = await ordersCollection
      .find()
      .populate({
        path: 'userId',
        model: 'newusers'
      })
      .populate({
        path: 'products.productId',
        model: 'products'
      })
      .sort({ createdAt: -1 }) // Sort by creation timestamp in descending order
      .skip(skip)
      .limit(limit);

    // Count total number of orders for pagination
    const totalCount = await ordersCollection.countDocuments();

    // Calculate total pages based on total count and limit
    const totalPages = Math.ceil(totalCount / limit);

    res.render("admin/orderlistN", { 
      orders, 
      currentPage: page, 
      totalPages 
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Internal Server Error");
  }
};



const postOrders = async (req, res) => {
  console.log("post order is getting in line 157");
  try {
    const { orderId, productId, status } = req.body; 
    console.log("orderId", orderId);
    console.log("productId", productId);
    console.log("status", status);

    const order = await ordersCollection.findOne({ _id: orderId });
    console.log("order",order);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const product = order.products.find(product => String(product._id) === productId);
    console.log("product",product);
    if (!product) {
      return res.status(404).json({ error: 'Product not found in the order' });
    }

    product.status = status;
    
    await order.save();
     
    console.log("Order status updated successfully");
    res.json(order);
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const filterByCategory = async (req, res) => {
  try {
      const category = req.query.category; // Get the selected category from query parameters
      console.log("category",category);

      let filter = {}; // Initialize an empty filter object
      if (category) {
          filter.category = category; // If a category is selected, add it to the filter
      }

      // Apply the filter to fetch products
      const products = await productsCollection.find(filter);

      // Fetch categories again to pass them to the frontend for rendering the filter dropdown
      const categories = await productsCollection.distinct("category");

      res.render("admin/productManageN", {
          categories,
          products,
          currentPage: 1, // Reset the page to 1 after applying filter
          totalPages: 1, // In case pagination needs to be updated after applying filter
      });
  } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
  }
};

const adminOrderDetails = async (req,res)=> {
  try {
    const  orderId= req.params.orderId;
    const productId = req.params.productId;
    // console.log("orderId",orderId);
    // console.log("productId",productId);

    // Find the order by orderId
    const order = await ordersCollection.findOne({ _id: orderId });

    if (!order) {
        return res.status(404).json({ error: "Order not found" });
    }

    // Find the product within the order by productId
    const product = order.products.find(product => product._id.toString() === productId);

    if (!product) {
        return res.status(404).json({ error: "Product not found in the order" });
    }

    // Render the order details page with the order and product details
    return res.render("admin/adminOrderDetails", { order, product });
   
} catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Internal Server Error" });
}
}



const getSalesReport = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 5; // Default limit to 5 if not provided

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    
    const filterOption = req.query.filterOption;  
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
     
    // console.log("start date in sales report",startDate);
    // console.log("end date in sales report",endDate);


    // Define query object to filter orders based on the filter option
    const dateQuery = {};

    switch (filterOption) {
      case "daily":
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of the current day
        dateQuery.createdAt = { $gte: today, $lte: new Date() }; // Today's date
        break;
      case "weekly":
        const startDateOfWeek = new Date();
        startDateOfWeek.setDate(startDateOfWeek.getDate() - 7); // Go back 7 days
        startDateOfWeek.setHours(0, 0, 0, 0); // Start of the day
        const endDateOfWeek = new Date();
        endDateOfWeek.setHours(23, 59, 59, 999); // End of the day
        dateQuery.createdAt = { $gte: startDateOfWeek, $lte: endDateOfWeek };
        break;
      case "monthly":
        const startDateOfMonth = new Date();
        startDateOfMonth.setMonth(startDateOfMonth.getMonth() - 1); // Go back 1 month
        startDateOfMonth.setHours(0, 0, 0, 0); // Start of the day
        const endDateOfMonth = new Date();
        endDateOfMonth.setHours(23, 59, 59, 999); // End of the day
        dateQuery.createdAt = { $gte: startDateOfMonth, $lte: endDateOfMonth };
        break;
      case "yearly":
        const startOfYear = new Date(new Date().getFullYear(), 0, 1); // Start of the current year
        startOfYear.setHours(0, 0, 0, 0); // Start of the day
        const endOfYear = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999); // End of the current year
        dateQuery.createdAt = { $gte: startOfYear, $lte: endOfYear };
        break;
      default:
        // Apply date range filter if start and end dates are provided
        if (startDate && endDate) {
          dateQuery.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }
       
        break;
    }

    // Fetch orders from the database with pagination and date range filtering
    const orders = await ordersCollection
      .find(dateQuery) // Apply date range filtering
      .populate({
        path: "userId",
        model: "newusers",
      })
      .populate({
        path: "products.productId",
        model: "products",
      })
      .sort({ createdAt: -1 }) // Sort by creation timestamp in descending order
      .skip(skip)
      .limit(limit);

    // Count total number of orders for pagination
    const totalCount = await ordersCollection.countDocuments(dateQuery);

    // Calculate total pages based on total count and limit
    const totalPages = Math.ceil(totalCount / limit);

    // Calculate total order count, order amount, and overall discount
    const totalOrders = await ordersCollection.countDocuments(dateQuery);
    const totalOrderAmount = await ordersCollection.aggregate([
      {
        $match: dateQuery,
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalPrice" },
        },
      },
    ]);
    const totalUsers = await ordersCollection.aggregate([
      {
        $match: dateQuery,
      },
      {
        $group: {
          _id: "$userId", // Group by user ID
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }, // Count the distinct user IDs
        },
      },
    ]);

    // Render the sales report template with data
    res.render("admin/salesReport", {
      orders,
      currentPage: page,
      totalPages,
      startDate, // Pass startDate to template
      endDate,
      totalOrders,
      totalOrderAmount: totalOrderAmount.length > 0 ? totalOrderAmount[0].totalAmount : 0,
      totalUsers: totalUsers.length > 0 ? totalUsers[0].count : 0,
      
    });
  } catch (error) {
    console.error("Error fetching sales report details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};







const downloadPdf = async (req, res) => {
  try {
    // Fetch orders from the database
    const orders = await ordersCollection.find() .populate({
      path: "userId",
      model: "newusers",
    });

    // Create a new PDF document
    const doc = new PDFDocument();

    // Set response headers to indicate a PDF file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.pdf"');

    // Pipe the PDF document directly to the response stream
    doc.pipe(res);

    // Add content to the PDF
    doc.fontSize(12);
    doc.text('Order Details\n\n');

    // Loop through each order and add details to the PDF
    orders.forEach((order, index) => {
      doc.text(`Order ID: ${order.orderId}`);
      doc.text(`User Name: ${order.userId.name}`);
      doc.text('Products:');
      order.products.forEach((product) => {
        doc.text(`- ${product.productName} - ${product.quantity}`);
      });
      doc.text(`Total Quantity: ${order.totalQuantity}`);
      doc.text(`Total Price: $${order.totalPrice.toFixed(2)}`);
      doc.text(`Address: ${order.address.address}, ${order.address.locality}, ${order.address.state}, ${order.address.pincode}`);
      doc.text(`Payment Method: ${order.paymentMethod}`);
      doc.text(`Order Date: ${order.orderDate}`);
      if (index < orders.length - 1) {
        doc.text('\n'); // Add spacing between orders
      }
    });

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




const downloadExcel = async (req, res) => {
  try {
    // Fetch orders from the database
    const orders = await ordersCollection.find() .populate({
      path: "userId",
      model: "newusers",
    });
    const userEmail = req.session.user;
    const userdata = await userCollection.findOne(userEmail);
    console.log("userdata in excel download",userdata);
    const userid = userdata._id;
    console.log("userid in excel function: ",userid);

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    // Define headers for the Excel sheet
    worksheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 15 },
      { header: 'User Name', key: 'userName', width: 20 },
      { header: 'Products', key: 'products', width: 40 },
      { header: 'Total Quantity', key: 'totalQuantity', width: 15 },
      { header: 'Total Price', key: 'totalPrice', width: 15 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Payment Method', key: 'paymentMethod', width: 20 },
      { header: 'Order Date', key: 'orderDate', width: 20 }
    ];

    // Add rows for each order
    orders.forEach(order => {
      
      worksheet.addRow({
        orderId: order.orderId,
        userName: order.userId.name,
        products: order.products.map(product => `${product.productName} - ${product.quantity}`).join('\n'),
        totalQuantity: order.totalQuantity,
        totalPrice: order.totalPrice.toFixed(2),
        address: `${order.address.address}, ${order.address.locality}, ${order.address.state}, ${order.address.pincode}`,
        paymentMethod: order.paymentMethod,
        orderDate: order.orderDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
      });
    });

    // Set response headers to indicate an Excel file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.xlsx"');

    // Write workbook to response stream
    await workbook.xlsx.write(res);

    // End the response
    res.end();
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};










module.exports = {
    dashboard, login,loginpost,getUserManage,blockUser,getAdminLogout,postAdminLogout,getOrders,postOrders,filterByCategory,adminOrderDetails,getSalesReport,downloadPdf,downloadExcel,salesFilter
}



