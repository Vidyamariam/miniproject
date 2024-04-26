const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadFolder;
    if (file.fieldname === "bannerImage") {
      uploadFolder = "uploads/banners/";
    } else {
      // Handle other fieldnames or errors if needed
      cb(new Error("Invalid fieldname"));
    }
    // Call the callback function with the upload folder
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    let ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const fileFilter = function (req, file, callback) {
  if (file.mimetype.startsWith("image/")) {
    callback(null, true);
  } else {
    console.log("Only image files supported");
    callback(null, false);
  }
};

const limits = {
  fileSize: 1024 * 1024 * 100, // Limiting file size to 100MB, adjust as needed
};

const bannerUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
}).single("bannerImage");

module.exports = bannerUpload;
