require("dotenv").config();

const config = {
  port: process.env.PORT || 8080,
  dbUrl: process.env.DATABASE_URL || "mongodb://localhost:27017/myapp",
};

module.exports = config;
