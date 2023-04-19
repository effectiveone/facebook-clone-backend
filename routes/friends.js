const express = require("express");
const {
  addFriend,
  cancelRequest,
  follow,
  unfollow,
  acceptRequest,
  unfriend,
  deleteRequest,
  getFriendsPageInfos,
} = require("../controllers/friendsController");
const { authUser } = require("../middlwares/auth");

const router = express.Router();

router.put("/addFriend/:id", authUser, addFriend);
router.put("/cancelRequest/:id", authUser, cancelRequest);
router.put("/follow/:id", authUser, follow);
router.put("/unfollow/:id", authUser, unfollow);
router.put("/acceptRequest/:id", authUser, acceptRequest);
router.put("/unfriend/:id", authUser, unfriend);
router.put("/deleteRequest/:id", authUser, deleteRequest);
router.get("/getFriendsPageInfos", authUser, getFriendsPageInfos);

module.exports = router;
