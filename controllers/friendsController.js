const mongoose = require("mongoose");
const User = require("../models/User.model");
const FriendInvitation = require("../models/friendInvitation");
const friendsUpdates = require("../socketHandlers/updates/friends");
const logger = require("../logger");

exports.sendFriendRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.userId);
      if (
        !receiver.friendRequests.includes(sender._id) &&
        !receiver.friends.includes(sender._id)
      ) {
        await receiver.updateOne({
          $push: { friendRequests: sender._id },
        });
        await receiver.updateOne({
          $push: { followers: sender._id },
        });
        await sender.updateOne({
          $push: { following: receiver._id },
        });

        logger.info(
          `User ${sender._id} sent friend request to user ${receiver._id}`
        );

        res.json({ message: "Friend request has been sent" });
      } else {
        return res.status(400).json({ message: "Already sent" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't send a friend request to yourself" });
    }
  } catch (error) {
    logger.error(`Error sending friend request: ${error}`);
    res.status(500).json({ message: "Error sending friend request" });
  }
};

exports.cancelFriendRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.userId);
      if (
        receiver.friendRequests.includes(sender._id) &&
        !receiver.friends.includes(sender._id)
      ) {
        await receiver.updateOne({
          $pull: { friendRequests: sender._id },
        });
        await receiver.updateOne({
          $pull: { followers: sender._id },
        });
        await sender.updateOne({
          $pull: { following: sender._id },
        });

        logger.info(
          `User ${sender._id} canceled friend request to user ${receiver._id}`
        );

        res.json({ message: "Friend request canceled successfully" });
      } else {
        return res.status(400).json({ message: "Already Canceled" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't cancel a friend request to yourself" });
    }
  } catch (error) {
    logger.error(`Error canceling friend request: ${error}`);
    res.status(500).json({ message: "Error canceling friend request" });
  }
};

exports.followUser = async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      const follower = await User.findById(req.user.id);
      const followee = await User.findById(req.params.userId);

      if (
        !followee.followers.includes(follower._id) &&
        !follower.following.includes(followee._id)
      ) {
        await followee.updateOne({
          $push: { followers: follower._id },
        });

        await follower.updateOne({
          $push: { following: followee._id },
        });

        logger.info(`User ${follower._id} followed user ${followee._id}`);

        res.json({ message: "Followed user successfully" });
      } else {
        return res.status(400).json({ message: "Already following" });
      }
    } else {
      return res.status(400).json({ message: "You can't follow yourself" });
    }
  } catch (error) {
    logger.error(`Error following user: ${error}`);
    res.status(500).json({ message: "Error following user" });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    if (req.user.id !== req.params.userId) {
      const follower = await User.findById(req.user.id);
      const followee = await User.findById(req.params.userId);

      if (
        followee.followers.includes(follower._id) &&
        follower.following.includes(followee._id)
      ) {
        await followee.updateOne({
          $pull: { followers: follower._id },
        });

        await follower.updateOne({
          $pull: { following: followee._id },
        });

        logger.info(`User ${follower._id} unfollowed user ${followee._id}`);

        res.json({ message: "Unfollowed user successfully" });
      } else {
        return res.status(400).json({ message: "Already not following" });
      }
    } else {
      return res.status(400).json({ message: "You can't unfollow yourself" });
    }
  } catch (error) {
    logger.error(`Error unfollowing user: ${error}`);
    res.status(500).json({ message: "Error unfollowing user" });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const receiver = await User.findById(req.user.id);
    const sender = await User.findById(req.params.id);

    if (!receiver || !sender) {
      logger.warn(`User not found: receiver: ${receiver}, sender: ${sender}`);
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.id === req.params.id) {
      logger.warn(`Cannot accept request from self: ${req.user.id}`);
      return res
        .status(400)
        .json({ message: "You can't accept a request from yourself" });
    }

    if (!receiver.friendRequests.includes(sender._id)) {
      logger.warn(`Friend request not found: ${sender._id}`);
      return res.status(400).json({ message: "Friend request not found" });
    }

    // add friends to both users
    receiver.friends.push(sender._id);
    receiver.following.push(sender._id);
    await receiver.save();

    sender.friends.push(receiver._id);
    sender.followers.push(receiver._id);
    await sender.save();

    // delete friend invitation
    await FriendInvitation.findOneAndDelete({
      sender: sender._id,
      receiver: receiver._id,
    });

    // update lists of friends and pending invitations
    friendsUpdates.updateFriends(sender._id.toString());
    friendsUpdates.updateFriends(receiver._id.toString());
    friendsUpdates.updateFriendRequests(receiver._id.toString());

    logger.info(`Friend request accepted: ${sender._id}`);
    return res.json({ message: "Friend request accepted" });
  } catch (error) {
    logger.error(`Error accepting friend request: ${error.message}`);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.unfriend = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);

      if (
        receiver.friends.includes(sender._id) &&
        sender.friends.includes(receiver._id)
      ) {
        await receiver.update({
          $pull: {
            friends: sender._id,
            following: sender._id,
            followers: sender._id,
          },
        });

        await sender.update({
          $pull: {
            friends: receiver._id,
            following: receiver._id,
            followers: receiver._id,
          },
        });

        logger.info(`Friendship ended: ${sender._id} and ${receiver._id}`);
        res.json({ message: "Unfriend successful" });
      } else {
        logger.warn(`Already not friends: ${sender._id} and ${receiver._id}`);
        return res.status(400).json({ message: "Already not friends" });
      }
    } else {
      logger.warn(`Cannot unfriend self: ${req.user.id}`);
      return res.status(400).json({ message: "You can't unfriend yourself" });
    }
  } catch (error) {
    logger.error(`Error unfriending user: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const receiver = await User.findById(req.user.id);
      const sender = await User.findById(req.params.id);
      if (receiver.requests.includes(sender._id)) {
        await receiver.updateOne({
          $pull: {
            requests: sender._id,
            followers: sender._id,
          },
        });
        await sender.updateOne({
          $pull: {
            following: receiver._id,
          },
        });

        logger.info("Friend request deleted");
        res.json({ message: "Friend request deleted" });
      } else {
        logger.warn("Friend request already deleted");
        return res
          .status(400)
          .json({ message: "Friend request already deleted" });
      }
    } else {
      logger.warn("Cannot delete yourself");
      return res.status(400).json({ message: "Cannot delete yourself" });
    }
  } catch (error) {
    logger.error(`Error deleting friend request: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.getFriendsPageInfos = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("friends")
      .populate("friends", "first_name last_name picture username");

    const sentRequests = await FriendInvitation.find({
      senderId: mongoose.Types.ObjectId(user._id),
    }).populate(
      "receiverId",
      "first_name last_name picture username _id: invitationID"
    );

    const receivedRequests = await FriendInvitation.find({
      receiverId: mongoose.Types.ObjectId(user._id),
    }).populate("senderId", "first_name last_name picture username");

    logger.info("Friends page information retrieved");
    res.json({
      friends: user.friends,
      sentRequests,
      receivedRequests,
    });
  } catch (error) {
    logger.error(`Error retrieving friends page information: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};
