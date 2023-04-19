const logger = require("../helpers/logger");
const cloudinary = require("cloudinary").v2;

exports.uploadImages = async (req, res) => {
  try {
    logger.info(`New image upload request received from user ${req.user.id}`);
    const images = req.files;

    const result = await Promise.all(
      images.map((image) =>
        cloudinary.uploader.upload(image.path, {
          folder: "facebook",
          use_filename: true,
          unique_filename: false,
        })
      )
    );

    logger.info(`Images uploaded successfully by user ${req.user.id}`);
    res.json(result);
  } catch (error) {
    logger.error(
      `Error occurred while uploading images for user ${req.user.id}: ${error.message}`
    );
    return res.status(500).json({ message: error.message });
  }
};
