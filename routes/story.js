const express = require("express");
const { authUser } = require("../middlwares/auth");
const { createStory, getStories, viewStory, deleteStory } = require("../controllers/story");
const { storyUpload } = require("../middlwares/fileUpload");

const router = express.Router();

// Story routes
router.post("/create", authUser, storyUpload, createStory);
router.get("/", authUser, getStories);
router.put("/:storyId/view", authUser, viewStory);
router.delete("/:storyId", authUser, deleteStory);

module.exports = router;
