const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const { readdirSync } = require("fs");
const socketServer = require("./socketServer");
const friendInvitationRoutes = require("./routes/friendInvitationRoutes");

const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

//routes
// readdirSync("./routes").map((r) => app.use("/", require("./routes/" + r)));
readdirSync("./routes")
  .filter((file) => file !== "friendInvitationRoutes.js")
  .map((file) => {
    app.use("/", require("./routes/" + file));
  });
app.use("/api/friend-invitation", friendInvitationRoutes);

const server = http.createServer(app);
socketServer.registerSocketServer(server);

//database
mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("database connected successfully");
  })
  .catch((err) => console.log("error connecting to mongodb", err));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}..`);
});
