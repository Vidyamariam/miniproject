const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/miniProject")
.then(()=> {console.log("Data base is connected")
}).catch(()=> {
    console.error("Mongodb has not connected")   
})


module.exports = mongoose;