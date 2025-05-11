const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../config');
const logger = require('../logger');

exports.uploadImages = async (req, res) => {
  try {
    logger.info('Otrzymano żądanie uploadu obrazów');
    let files = Object.values(req.files).flat();
    logger.info('Liczba plików:', files.length);

    const { path } = req.body;
    logger.info('Ścieżka docelowa:', path);

    const urls = [];
    for (const file of files) {
      logger.info('Przetwarzanie pliku:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      const result = await uploadToCloudinary(file, path);
      urls.push(result);
      logger.info(`Uploaded image to Cloudinary: ${result.public_id}`);
      removeTmp(file.tempFilePath);
    }

    logger.info(`Uploaded ${urls.length} image(s) to Cloudinary.`);
    res.json(urls);
  } catch (error) {
    logger.error('Error uploading images:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.listImages = async (req, res) => {
  const { path, sort, max } = req.body;

  cloudinary.search
    .expression(`${path}`)
    .sort_by('created_at', `${sort}`)
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
  try {
    logger.info('Rozpoczynam upload do Cloudinary...');
    logger.info('Konfiguracja Cloudinary:', {
      cloud_name: cloudinary.config().cloud_name,
      api_key: '***',
      api_secret: '***',
    });

    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: path,
      resource_type: 'auto',
    });

    logger.info('Upload do Cloudinary zakończony sukcesem:', {
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      size: result.bytes,
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    logger.error('Błąd podczas uploadu do Cloudinary:', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

const removeTmp = (path) => {
  fs.unlink(path, (err) => {
    if (err) {
      logger.error(`Error removing temporary file: ${err.message}`);
      throw err;
    }
  });
};
