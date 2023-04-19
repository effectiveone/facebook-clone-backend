const express = require("express");
const {
  searchUsers,
  addSearchToHistory,
  getSearchHistory,
  removeSearchFromHistory,
} = require("../controllers/searchController");
const { authUser } = require("../middlwares/auth");

const router = express.Router();

router.post("/search/:searchTerm", authUser, searchUsers);
router.put("/addToSearchHistory", authUser, addSearchToHistory);
router.get("/getSearchHistory", authUser, getSearchHistory);
router.put("/removeFromSearch", authUser, removeSearchFromHistory);

module.exports = router;
