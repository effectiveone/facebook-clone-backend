const React = require("../models/React");
const User = require("../models/User.model");
const mongoose = require("mongoose");
const { generateReactsArray } = require("../helpers/generateReacts");
const logger = require("../logger");

exports.reactPost = async (req, res) => {
  try {
    const { postId, react } = req.body;
    const check = await React.findOne({
      postRef: postId,
      reactBy: mongoose.Types.ObjectId(req.user.id),
    });
    if (check == null) {
      const newReact = new React({
        react: react,
        postRef: postId,
        reactBy: req.user.id,
      });
      await newReact.save();
      logger.info(`New reaction added for post ${postId}`);
    } else {
      if (check.react == react) {
        await React.findByIdAndRemove(check._id);
        logger.info(`Reaction removed for post ${postId}`);
      } else {
        await React.findByIdAndUpdate(check._id, {
          react: react,
        });
        logger.info(`Reaction updated for post ${postId}`);
      }
    }
    res.sendStatus(200);
  } catch (error) {
    logger.error(`Error in reactPost: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};

exports.getReacts = async (req, res) => {
  try {
    const reactsArray = await React.find({ postRef: req.params.id });
    const reacts = generateReactsArray(reactsArray);
    const check = await React.findOne({
      postRef: req.params.id,
      reactBy: req.user.id,
    });
    const user = await User.findById(req.user.id);
    const checkSaved = user?.savedPosts.find(
      (x) => x.post.toString() === req.params.id
    );
    res.json({
      reacts,
      check: check?.react,
      total: reactsArray.length,
      checkSaved: checkSaved ? true : false,
    });
  } catch (error) {
    logger.error(`Error in getReacts: ${error.message}`);
    return res.status(500).json({ message: error.message });
  }
};
