const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const { readdirSync } = require("fs");
const socketServer = require("./socketServer");
const friendInvitationRoutes = require("./routes/friendInvitationRoutes");
const config = require("./config");
const logger = require("./logger");

const app = express();
app.use(express.json());
app.use(cors());
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

// Load routes
readdirSync("./routes")
  .filter((file) => file !== "friendInvitationRoutes.js")
  .forEach((file) => {
    app.use("/", require("./routes/" + file));
  });
app.use("/api/friend-invitation", friendInvitationRoutes);

// Create HTTP server
const server = http.createServer(app);
socketServer.registerSocketServer(server);

// Connect to database
mongoose.set("strictQuery", true);
mongoose
  .connect(config.dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info("Database connected successfully");
  })
  .catch((err) => {
    logger.error("Error connecting to MongoDB", err);
    process.exit(1);
  });

// Start server
server.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port}`);
});
