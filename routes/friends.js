const express = require('express');
const {
  sendFriendRequest,
  cancelFriendRequest,
  followUser,
  unfollowUser,
  acceptFriendRequest,
  unfriend,
  deleteRequest,
  getFriendsPageInfos,
} = require('../controllers/friendsController');
const { authUser } = require('../middlwares/auth');

const router = express.Router();

router.put('/addFriend/:id', authUser, sendFriendRequest);
router.put('/cancelRequest/:id', authUser, cancelFriendRequest);
router.put('/follow/:id', authUser, followUser);
router.put('/unfollow/:id', authUser, unfollowUser);
router.put('/acceptRequest/:id', authUser, acceptFriendRequest);
router.put('/unfriend/:id', authUser, unfriend);
router.put('/deleteRequest/:id', authUser, deleteRequest);
router.get('/getFriendsPageInfos', authUser, getFriendsPageInfos);

module.exports = router;
