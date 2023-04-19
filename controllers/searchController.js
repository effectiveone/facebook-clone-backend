const User = require("../models/User.model");
const logger = require("../logger");

exports.searchUsers = async (req, res) => {
  try {
    const searchTerm = req.params.searchTerm;
    const users = await User.find({ $text: { $search: searchTerm } }).select(
      "firstName lastName username picture"
    );
    logger.info(`User ${req.user.id} searched for ${searchTerm}`);
    res.json(users);
  } catch (error) {
    logger.error(`Error searching users: ${error}`);
    res.status(500).json({ message: "Error searching users" });
  }
};

exports.addSearchToHistory = async (req, res) => {
  try {
    const { searchedUser } = req.body;
    const search = {
      user: searchedUser,
      createdAt: new Date(),
    };
    const user = await User.findById(req.user.id);
    const existingSearch = user.searches.find(
      (s) => s.user.toString() === searchedUser
    );
    if (existingSearch) {
      await User.updateOne(
        {
          _id: req.user.id,
          "searches._id": existingSearch._id,
        },
        {
          $set: { "searches.$.createdAt": new Date() },
        }
      );
    } else {
      await User.findByIdAndUpdate(req.user.id, {
        $push: {
          searches: search,
        },
      });
    }
    logger.info(`User ${req.user.id} added search for user ${searchedUser}`);
    res.status(200).json({ message: "Search added to history" });
  } catch (error) {
    logger.error(`Error adding search to history: ${error}`);
    res.status(500).json({ message: "Error adding search to history" });
  }
};

exports.getSearchHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "searches.user",
      "firstName lastName username picture"
    );
    const searchHistory = user.searches.map((search) => {
      return {
        user: search.user,
        createdAt: search.createdAt,
      };
    });
    logger.info(`User ${req.user.id} retrieved search history`);
    res.status(200).json(searchHistory);
  } catch (error) {
    logger.error(`Error retrieving search history: ${error}`);
    res.status(500).json({ message: "Error retrieving search history" });
  }
};

exports.removeSearchFromHistory = async (req, res) => {
  try {
    const { searchedUser } = req.body;
    await User.updateOne(
      {
        _id: req.user.id,
      },
      { $pull: { searches: { user: searchedUser } } }
    );
    logger.info(`User ${req.user.id} removed search for user ${searchedUser}`);
    res.status(200).json({ message: "Search removed from history" });
  } catch (error) {
    logger.error(`Error removing search from history: ${error}`);
    res.status(500).json({ message: "Error removing search from history" });
  }
};
