const express = require("express");
const {
  search,
  addToSearchHistory,
  getSearchHistory,
  removeFromSearch,
} = require("../controllers/searchController");
const { authUser } = require("../middlwares/auth");

const router = express.Router();

router.post("/search/:searchTerm", authUser, search);
router.put("/addToSearchHistory", authUser, addToSearchHistory);
router.get("/getSearchHistory", authUser, getSearchHistory);
router.put("/removeFromSearch", authUser, removeFromSearch);

module.exports = router;
