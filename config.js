require("dotenv").config();

const config = {
  port: process.env.PORT || 8080,
  dbUrl: process.env.DATABASE_URL || "mongodb://localhost:27017/myapp",
};

const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

module.exports = { config, cloudinary };
