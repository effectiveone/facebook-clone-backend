const fs = require("fs");
const path = require("path");
const { cloudinary } = require("../config");
const logger = require("../logger");

exports.uploadImages = async (req, res) => {
  try {
    const { path } = req.body;
    let files = Object.values(req.files).flat();
    let images = [];
    for (const file of files) {
      const url = await uploadToCloudinary(file, path);
      images.push(url);
      removeTmp(file.tempFilePath);
    }
    logger.info(`Uploaded ${images.length} image(s) to Cloudinary.`);
    res.json(images);
  } catch (error) {
    logger.error(`Error uploading images: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

exports.listImages = async (req, res) => {
  const { path, sort, max } = req.body;

  cloudinary.v2.search
    .expression(`${path}`)
    .sort_by("created_at", `${sort}`)
    .max_results(max)
    .execute()
    .then((result) => {
      logger.info(`Retrieved ${result.total_count} image(s) from Cloudinary.`);
      res.json(result);
    })
    .catch((err) => {
      logger.error(`Error listing images: ${err.error.message}`);
    });
};

const uploadToCloudinary = async (file, path) => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(
      file.tempFilePath,
      {
        folder: path,
      },
      (err, res) => {
        if (err) {
          removeTmp(file.tempFilePath);
          logger.error(`Error uploading image: ${err.message}`);
          reject({ message: "Upload image failed." });
        }
        logger.info(`Uploaded image to Cloudinary: ${res.public_id}`);
        resolve({
          url: res.secure_url,
        });
      }
    );
  });
};

const removeTmp = (path) => {
  fs.unlink(path, (err) => {
    if (err) {
      logger.error(`Error removing temporary file: ${err.message}`);
      throw err;
    }
  });
};
