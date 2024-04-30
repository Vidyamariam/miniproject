const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://vidyamathew13:H0JBnZVRAIwo6lKX@cluster0.wenh3ae.mongodb.net/miniProject?retryWrites=true&w=majority")
.then(()=> {console.log("Data base is connected")
}).catch(()=> {
    console.error("Mongodb has not connected")   
})


module.exports = mongoose;