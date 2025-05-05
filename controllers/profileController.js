const User = require('../models/User.model');
const Post = require('../models/Post');
const logger = require('../logger');

exports.getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const profile = await User.findOne({ username }).select('-password');

    if (!profile) {
      logger.warn(`Profile with username ${username} does not exist`);
      return res.status(404).json({ message: 'Użytkownik nie istnieje' });
    }

    let friendship = {
      friends: false,
      following: false,
      requestSent: false,
      requestReceived: false,
    };

    // Jeśli żądanie pochodzi od zalogowanego użytkownika, sprawdzamy relacje
    if (req.user?.id) {
      const user = await User.findById(req.user.id);

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
    }

    const posts = await Post.find({ user: profile._id })
      .populate('user', 'first_name last_name username picture cover')
      .populate('comments.commentBy', 'first_name last_name picture username')
      .sort({ createdAt: -1 });

    await profile.populate('friends', 'first_name last_name username picture');
    res.json({ ...profile.toObject(), posts, friendship });
    logger.info(`Profile ${username} retrieved successfully`);
  } catch (error) {
    logger.error(`Error retrieving profile: ${error}`);
    res.status(500).json({ message: 'Coś poszło nie tak' });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    const { url } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { picture: url },
      { new: true },
    ).select('-password');

    // Stwórz post z nowym zdjęciem profilowym
    const newPost = new Post({
      type: 'profilePicture',
      user: req.user.id,
      images: [url],
    });
    await newPost.save();

    res.json(updatedUser);
    logger.info(`User ${req.user.id} updated profile picture successfully`);
  } catch (error) {
    logger.error(`Error updating profile picture: ${error}`);
    res.status(500).json({ message: 'Coś poszło nie tak' });
  }
};

exports.updateCover = async (req, res) => {
  try {
    const { url } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { cover: url },
      { new: true },
    ).select('-password');

    // Stwórz post z nowym zdjęciem okładki
    const newPost = new Post({
      type: 'coverPicture',
      user: req.user.id,
      images: [url],
    });
    await newPost.save();

    res.json(updatedUser);
    logger.info(`User ${req.user.id} updated cover successfully`);
  } catch (error) {
    logger.error(`Error updating cover: ${error}`);
    res.status(500).json({ message: 'Coś poszło nie tak' });
  }
};

exports.updateDetails = async (req, res) => {
  try {
    const { details } = req.body;

    if (!details) {
      logger.warn('No details provided for update');
      return res.status(400).json({ message: 'Brak danych do aktualizacji' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { details },
      { new: true },
    ).select('-password');

    res.json(updatedUser);
    logger.info(`User ${req.user.id} updated details successfully`);
  } catch (error) {
    logger.error(`Error updating user details: ${error}`);
    res.status(500).json({ message: 'Coś poszło nie tak' });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('savedPosts');

    if (!user) {
      logger.warn(`User ${req.user.id} not found`);
      return res.status(404).json({ message: 'Użytkownik nie istnieje' });
    }

    const savedPostIds = user.savedPosts.map((savedPost) => savedPost.post);

    const posts = await Post.find({ _id: { $in: savedPostIds } })
      .populate('user', 'first_name last_name username picture cover')
      .populate('comments.commentBy', 'first_name last_name picture username')
      .sort({ createdAt: -1 });

    // Dodaj informację o dacie zapisania do każdego posta
    const postsWithSavedDate = posts.map((post) => {
      const savedPost = user.savedPosts.find(
        (sp) => sp.post.toString() === post._id.toString(),
      );
      return {
        ...post.toObject(),
        savedAt: savedPost.savedAt,
      };
    });

    res.json(postsWithSavedDate);
    logger.info(
      `Retrieved ${posts.length} saved posts for user ${req.user.id}`,
    );
  } catch (error) {
    logger.error(`Error retrieving saved posts: ${error}`);
    res.status(500).json({ message: 'Coś poszło nie tak' });
  }
};
