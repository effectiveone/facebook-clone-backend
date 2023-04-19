const User = require("../models/User.model");
const Post = require("../models/Post");
const logger = require("../logger");

exports.getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const profile = await User.findOne({ username }).select("-password");
    const user = await User.findById(profile._id).select("-password");

    if (!user) {
      logger.warn("User does not exist");
      return res.status(400).json({ message: "Error: user does not exist" });
    }

    const friendship = {
      friends: false,
      following: false,
      requestSent: false,
      requestReceived: false,
    };
    if (!profile) {
      logger.warn("Profile does not exist");
      return res.json({ ok: false });
    }

    if (
      user.friends.includes(profile._id) &&
      profile.friends.includes(user._id)
    ) {
      friendship.friends = true;
    }
    if (user.following.includes(profile._id)) {
      friendship.following = true;
    }
    if (user.requests.includes(profile._id)) {
      friendship.requestReceived = true;
    }
    if (profile.requests.includes(user._id)) {
      friendship.requestSent = true;
    }

    const posts = await Post.find({ user: profile._id })
      .populate("user")
      .populate(
        "comments.commentBy",
        "first_name last_name picture username commentAt"
      )
      .sort({ createdAt: -1 });
    await profile.populate("friends", "first_name last_name username picture");
    res.json({ ...profile.toObject(), posts, friendship });
    logger.info("Profile retrieved successfully");
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    const { url } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      picture: url,
    });
    res.json(url);
    logger.info("Profile picture updated successfully");
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.updateCover = async (req, res) => {
  try {
    const { coverUrl } = req.body;
    const { userId } = req.user;

    await updateUserCover(userId, coverUrl);
    res.json(coverUrl);
  } catch (error) {
    logger.error(`Error updating user cover: ${error}`);
    res.status(500).json({ message: error.message });
  }
};

exports.updateDetails = async (req, res) => {
  try {
    const { userDetails } = req.body;
    const { userId } = req.user;

    const updatedUser = await updateUserDetails(userId, userDetails);
    res.json(updatedUser.details);
  } catch (error) {
    logger.error(`Error updating user details: ${error}`);
    res.status(500).json({ message: error.message });
  }
};
