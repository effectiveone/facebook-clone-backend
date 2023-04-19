const express = require("express");
const {
  getProfile,
  updateProfilePicture,
  updateCover,
  updateDetails,
} = require("../controllers/profileController");
const { authUser } = require("../middlwares/auth");

const router = express.Router();

router.get("/getProfile/:username", getProfile);
router.put("/updateProfilePicture", authUser, updateProfilePicture);
router.put("/updateCover", authUser, updateCover);
router.put("/updateDetails", authUser, updateDetails);

module.exports = router;
