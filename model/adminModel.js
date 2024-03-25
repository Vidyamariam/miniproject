const mongoose = require('mongoose');

// Define schema for admin credentials
const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

// Create model for admin credentials
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
