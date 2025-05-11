const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

/**
 * Upload a file to Cloudinary
 * @param {string} path - Path to local file
 * @param {string} folder - Folder in Cloudinary to store the file
 * @returns {Promise<object>} - Cloudinary upload result
 */
exports.uploadToCloudinary = async (path, folder = "facebook") => {
  try {
    const result = await cloudinary.uploader.upload(path, {
      folder: folder,
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Cloudinary public ID of the file to delete
 * @returns {Promise<object>} - Cloudinary deletion result
 */
exports.deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return null;
  }
};
