const express = require("express");

const bannerUpload = require('../middleware/bannerUpload');
const Banner = require('../model/bannerModel');

exports.getBannerManage = async (req, res) => {
    try {
        // Fetch all banner images from the database
        const banners = await Banner.find({}, 'bannerImage');

        res.render("admin/bannerManage", { banners });
    } catch (error) {
        console.error("Error fetching banner images:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


 

 exports.uploadBannerImage = async (req, res) => {
    try {
        if (req.file) {
            const imageUrl = `/uploads/banners/${req.file.filename}`; // Construct the image URL based on the filename
            
           
            const newBanner = new Banner({
                title: req.body.title, // Assuming the title is sent in the request body
                bannerImage: imageUrl // Save the image URL to the bannerImage field
            });

            
            await newBanner.save();

            console.log("Uploaded banner image URL:", imageUrl);
            res.status(200).json({ success: true, imageUrl: imageUrl });
        } else {
            // Handle case where no file is uploaded
            console.error("No banner image uploaded");
            res.status(400).json({ error: "No banner image uploaded" });
        }
    } catch (error) {
        console.error("Error uploading banner:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
  

exports.removeBannerImage = async (req, res) => {
    try {
        const bannerId = req.params.id;
        console.log("Banner ID:", bannerId);

        // Find the banner image by ID and remove it from the database
        const removedBanner = await Banner.findByIdAndDelete(bannerId);
        console.log("Removed Banner:", removedBanner);

        res.status(200).json({ success: true, message: "Banner image removed successfully" });
    } catch (error) {
        console.error("Error removing banner image:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

  