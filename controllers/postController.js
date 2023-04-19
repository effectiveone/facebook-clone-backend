const logger = require("../logger");
const Post = require("../models/Post");
const User = require("../models/User.model");

exports.createPost = async (req, res) => {
  try {
    const { user } = req.body;
    const post = await new Post({ ...req.body, user: req.user.id }).save();
    await post.populate("user", "first_name last_name cover picture username");
    res.json(post);
    logger.info("New post created");
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { following } = await User.findById(userId).select("following");
    const promises = following.map((id) => {
      return Post.find({ user: id })
        .populate("user", "first_name last_name picture username cover")
        .populate("comments.commentBy", "first_name last_name picture username")
        .sort({ createdAt: -1 })
        .limit(10);
    });
    const followingPosts = await Promise.all(promises);
    const userPosts = await Post.find({ user: userId })
      .populate("user", "first_name last_name picture username cover")
      .populate("comments.commentBy", "first_name last_name picture username")
      .sort({ createdAt: -1 })
      .limit(10);
    const posts = followingPosts.flat().concat(userPosts);
    posts.sort((a, b) => b.createdAt - a.createdAt);
    res.json(posts);
    logger.info("Retrieved all posts");
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.comment = async (req, res) => {
  try {
    const { comment, image, postId } = req.body;
    const update = {
      $push: {
        comments: {
          comment,
          image,
          commentBy: req.user.id,
          commentAt: new Date(),
        },
      },
    };
    const options = { new: true };
    const newComments = await Post.findByIdAndUpdate(
      postId,
      update,
      options
    ).populate("comments.commentBy", "picture first_name last_name username");
    res.json(newComments.comments);
    logger.info("New comment added");
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.savePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const user = await User.findById(req.user.id);
    const savedPost = user?.savedPosts.find(
      (post) => post.post.toString() === postId
    );
    const update = savedPost
      ? {
          $pull: {
            savedPosts: {
              _id: savedPost._id,
            },
          },
        }
      : {
          $push: {
            savedPosts: {
              post: postId,
              savedAt: new Date(),
            },
          },
        };
    await User.findByIdAndUpdate(req.user.id, update);
    res.json({ status: "ok" });
    logger.info("Post saved");
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndRemove(req.params.id);
    res.json({ status: "ok" });
    logger.info(`Post with ID ${req.params.id} deleted`);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};
