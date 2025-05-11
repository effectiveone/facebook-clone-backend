require('dotenv').config();

const config = {
  port: process.env.PORT || 8080,
  dbUrl:
    process.env.DATABASE_URL || 'mongodb://localhost:27017/FacebookApplication',
};

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'daw7honuh',
  api_key: '999944164297519',
  api_secret: 'idTtscKlOqWDVfqS_JqdalZxHSg',
  secure: true,
});

module.exports = { config, cloudinary };
