const fs = require('fs');

// Middleware for handling image uploads for stories
exports.storyUpload = async function (req, res, next) {
  try {
    // If no files are uploaded, or type is text, proceed without checking files
    if (req.body.type === 'text') {
      return next();
    }

    // If type is photo but no image provided
    if (req.body.type === 'photo' && (!req.files || !req.files.image)) {
      return res
        .status(400)
        .json({ message: 'No image selected for photo story.' });
    }

    // If files exist, validate them
    if (req.files && req.files.image) {
      const file = req.files.image;

      // Check file type
      if (
        file.mimetype !== 'image/jpeg' &&
        file.mimetype !== 'image/png' &&
        file.mimetype !== 'image/gif' &&
        file.mimetype !== 'image/webp'
      ) {
        return res.status(400).json({ message: 'Unsupported image format.' });
      }

      // Check file size (limit to 10MB for stories)
      if (file.size > 1024 * 1024 * 10) {
        return res
          .status(400)
          .json({ message: 'Image size is too large. Maximum size is 10MB.' });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Middleware for handling profile and cover photo uploads
exports.profilePhotoUpload = async function (req, res, next) {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No file selected.' });
    }

    const file = req.files.file;

    // Check file type
    if (
      file.mimetype !== 'image/jpeg' &&
      file.mimetype !== 'image/png' &&
      file.mimetype !== 'image/gif' &&
      file.mimetype !== 'image/webp'
    ) {
      return res.status(400).json({ message: 'Unsupported image format.' });
    }

    // Check file size (limit to 5MB for profile photos)
    if (file.size > 1024 * 1024 * 5) {
      return res
        .status(400)
        .json({ message: 'Image size is too large. Maximum size is 5MB.' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Middleware for handling video uploads for stories (future extension)
exports.videoStoryUpload = async function (req, res, next) {
  try {
    // If no files are uploaded, reject
    if (!req.files || !req.files.video) {
      return res.status(400).json({ message: 'No video selected.' });
    }

    const file = req.files.video;

    // Check file type
    if (
      file.mimetype !== 'video/mp4' &&
      file.mimetype !== 'video/quicktime' &&
      file.mimetype !== 'video/x-msvideo'
    ) {
      return res.status(400).json({ message: 'Unsupported video format.' });
    }

    // Check file size (limit to 100MB for video stories)
    if (file.size > 1024 * 1024 * 100) {
      return res
        .status(400)
        .json({ message: 'Video size is too large. Maximum size is 100MB.' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
