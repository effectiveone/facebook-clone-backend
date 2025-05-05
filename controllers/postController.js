const logger = require('../logger');
const Post = require('../models/Post');
const User = require('../models/User.model');

exports.createPost = async (req, res) => {
  try {
    const { user } = req.body;
    const post = await new Post({ ...req.body, user: req.user.id }).save();
    await post.populate('user', 'first_name last_name cover picture username');
    res.json(post);
    logger.info('New post created');
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { following } = await User.findById(userId).select('following');
    const promises = following.map((id) => {
      return Post.find({ user: id })
        .populate('user', 'first_name last_name picture username cover')
        .populate('comments.commentBy', 'first_name last_name picture username')
        .sort({ createdAt: -1 })
        .limit(10);
    });
    const followingPosts = await Promise.all(promises);
    const userPosts = await Post.find({ user: userId })
      .populate('user', 'first_name last_name picture username cover')
      .populate('comments.commentBy', 'first_name last_name picture username')
      .sort({ createdAt: -1 })
      .limit(10);
    const posts = followingPosts.flat().concat(userPosts);
    posts.sort((a, b) => b.createdAt - a.createdAt);
    res.json(posts);
    logger.info('Retrieved all posts');
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
      options,
    ).populate('comments.commentBy', 'picture first_name last_name username');
    res.json(newComments.comments);
    logger.info('New comment added');
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
      (post) => post.post.toString() === postId,
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
    res.json({ status: 'ok' });
    logger.info('Post saved');
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      logger.warn(`Post with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'Post not found' });
    }

    // Sprawdź, czy użytkownik jest właścicielem posta
    if (post.user.toString() !== req.user.id) {
      logger.warn(
        `User ${req.user.id} attempted to delete post ${req.params.id} without authorization`,
      );
      return res
        .status(403)
        .json({ message: 'Brak uprawnień do usunięcia tego posta' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ status: 'ok' });
    logger.info(`Post with ID ${req.params.id} deleted`);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { text, background, images } = req.body;
    const postId = req.params.id;

    const post = await Post.findById(postId);

    if (!post) {
      logger.warn(`Post with ID ${postId} not found`);
      return res.status(404).json({ message: 'Post nie został znaleziony' });
    }

    // Sprawdź, czy użytkownik jest właścicielem posta
    if (post.user.toString() !== req.user.id) {
      logger.warn(
        `User ${req.user.id} attempted to update post ${postId} without authorization`,
      );
      return res
        .status(403)
        .json({ message: 'Brak uprawnień do edycji tego posta' });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        text,
        background,
        ...(images && { images }),
      },
      { new: true },
    )
      .populate('user', 'first_name last_name cover picture username')
      .populate('comments.commentBy', 'first_name last_name picture username');

    res.json(updatedPost);
    logger.info(`Post with ID ${postId} updated`);
  } catch (error) {
    logger.error(`Error updating post: ${error}`);
    return res.status(500).json({ message: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId)
      .populate('user', 'first_name last_name picture username cover')
      .populate('comments.commentBy', 'first_name last_name picture username');

    if (!post) {
      logger.warn(`Post with ID ${postId} not found`);
      return res.status(404).json({ message: 'Post nie został znaleziony' });
    }

    res.json(post);
    logger.info(`Retrieved post with ID ${postId}`);
  } catch (error) {
    logger.error(`Error retrieving post: ${error}`);
    return res.status(500).json({ message: error.message });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Sprawdzenie, czy użytkownik istnieje
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`User with ID ${userId} not found`);
      return res
        .status(404)
        .json({ message: 'Użytkownik nie został znaleziony' });
    }

    const posts = await Post.find({ user: userId })
      .populate('user', 'first_name last_name picture username cover')
      .populate('comments.commentBy', 'first_name last_name picture username')
      .sort({ createdAt: -1 });

    res.json(posts);
    logger.info(`Retrieved ${posts.length} posts from user ${userId}`);
  } catch (error) {
    logger.error(`Error retrieving user posts: ${error}`);
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      logger.warn(`Post with ID ${postId} not found`);
      return res.status(404).json({ message: 'Post nie został znaleziony' });
    }

    // Znajdź komentarz
    const comment = post.comments.find((c) => c._id.toString() === commentId);
    if (!comment) {
      logger.warn(`Comment with ID ${commentId} not found in post ${postId}`);
      return res
        .status(404)
        .json({ message: 'Komentarz nie został znaleziony' });
    }

    // Sprawdź uprawnienia (autor komentarza lub autor posta może usunąć komentarz)
    if (
      comment.commentBy.toString() !== req.user.id &&
      post.user.toString() !== req.user.id
    ) {
      logger.warn(
        `User ${req.user.id} attempted to delete comment ${commentId} without authorization`,
      );
      return res
        .status(403)
        .json({ message: 'Brak uprawnień do usunięcia tego komentarza' });
    }

    // Usuń komentarz
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $pull: { comments: { _id: commentId } } },
      { new: true },
    ).populate('comments.commentBy', 'first_name last_name picture username');

    res.json(updatedPost.comments);
    logger.info(`Comment with ID ${commentId} deleted from post ${postId}`);
  } catch (error) {
    logger.error(`Error deleting comment: ${error}`);
    return res.status(500).json({ message: error.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { comment: newCommentText } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      logger.warn(`Post with ID ${postId} not found`);
      return res.status(404).json({ message: 'Post nie został znaleziony' });
    }

    // Znajdź komentarz
    const commentIndex = post.comments.findIndex(
      (c) => c._id.toString() === commentId,
    );
    if (commentIndex === -1) {
      logger.warn(`Comment with ID ${commentId} not found in post ${postId}`);
      return res
        .status(404)
        .json({ message: 'Komentarz nie został znaleziony' });
    }

    // Sprawdź uprawnienia (tylko autor komentarza może go edytować)
    if (post.comments[commentIndex].commentBy.toString() !== req.user.id) {
      logger.warn(
        `User ${req.user.id} attempted to update comment ${commentId} without authorization`,
      );
      return res
        .status(403)
        .json({ message: 'Brak uprawnień do edycji tego komentarza' });
    }

    // Aktualizuj komentarz
    post.comments[commentIndex].comment = newCommentText;
    await post.save();

    // Pobierz zaktualizowany post z uzupełnionymi danymi użytkowników
    const updatedPost = await Post.findById(postId).populate(
      'comments.commentBy',
      'first_name last_name picture username',
    );

    res.json(updatedPost.comments);
    logger.info(`Comment with ID ${commentId} updated in post ${postId}`);
  } catch (error) {
    logger.error(`Error updating comment: ${error}`);
    return res.status(500).json({ message: error.message });
  }
};
