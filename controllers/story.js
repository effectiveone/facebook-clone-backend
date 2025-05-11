const Story = require('../models/Story');
const User = require('../models/User.model');
const fs = require('fs');
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require('../helpers/cloudinary');

exports.createStory = async (req, res) => {
  try {
    console.log('CREATE STORY - Request received');
    console.log('Request body:', req.body);
    console.log(
      'Request files:',
      req.files ? Object.keys(req.files) : 'No files',
    );

    const { type, text, background } = req.body;
    const userId = req.user.id;

    console.log('Story data:', {
      type,
      userId,
      hasText: !!text,
      hasBackground: !!background,
    });

    const storyData = {
      user: userId,
      type,
    };

    // Handle based on story type
    if (type === 'text' && text) {
      storyData.text = text;
      storyData.background = background || '#1877f2'; // Default Facebook blue
      console.log('Creating text story with background:', storyData.background);
    } else if (type === 'photo' && req.files && req.files.image) {
      const image = req.files.image;
      console.log('Image details:', {
        name: image.name,
        size: image.size,
        mimetype: image.mimetype,
        md5: image.md5,
      });

      // Determine temporary file path
      let tempPath = image.tempFilePath;

      if (tempPath) {
        console.log('Using temp file provided by express-fileupload:', tempPath);
      } else {
        // Fallback: create our own temp copy when tempFilePath not available
        tempPath = `${__dirname}/../tmp/${image.name}`;
        console.log('Creating temporary file path:', tempPath);
        fs.writeFileSync(tempPath, image.data);
        console.log('Image saved to temporary path');
      }

      // Upload to Cloudinary
      console.log('Uploading to Cloudinary...');
      const cloudinaryResult = await uploadToCloudinary(
        tempPath,
        'facebook_stories',
      );
      console.log(
        'Cloudinary result:',
        cloudinaryResult ? 'Success' : 'Failed',
      );

      // Delete temporary file only if we created it (not when provided by express-fileupload)
      if (!image.tempFilePath) {
        fs.unlinkSync(tempPath);
        console.log('Temporary file deleted');
      }

      if (!cloudinaryResult || !cloudinaryResult.secure_url) {
        console.log('Cloudinary upload failed');
        return res.status(400).json({ message: 'Image upload failed' });
      }

      storyData.image = cloudinaryResult.secure_url;
      console.log('Image URL:', storyData.image);
    } else {
      console.log('Invalid story data. Type:', type);
      console.log('Has image:', !!(req.files && req.files.image));
      return res.status(400).json({ message: 'Invalid story data' });
    }

    // Create new story
    console.log('Creating new story in database');
    const newStory = new Story(storyData);
    await newStory.save();
    console.log('Story saved with ID:', newStory._id);

    return res.status(201).json({
      status: 'success',
      data: newStory,
    });
  } catch (error) {
    console.error('Create story error:', error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getStories = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user's friends
    const user = await User.findById(userId).select('friends');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all user IDs for which we want to fetch stories (user + friends)
    const storyUsers = [userId, ...user.friends];

    // Get stories for user and friends, ordered by most recent
    const stories = await Story.find({
      user: { $in: storyUsers },
    })
      .populate('user', 'first_name last_name picture username')
      .sort({ createdAt: -1 });

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const userId = story.user._id.toString();

      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: [],
        };
      }

      acc[userId].stories.push(story);
      return acc;
    }, {});

    // Convert to array for easier frontend consumption
    const result = Object.values(groupedStories);

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Get stories error:', error);
    return res.status(500).json({ message: error.message });
  }
};

exports.viewStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Find story and add user to views if not already viewed
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user already viewed the story
    if (!story.views.includes(userId)) {
      // Add user to views
      story.views.push(userId);
      await story.save();
    }

    return res.status(200).json({
      status: 'success',
      message: 'Story viewed successfully',
    });
  } catch (error) {
    console.error('View story error:', error);
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;

    // Find story
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    // Check if user is the owner of the story
    if (story.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: 'You can only delete your own stories' });
    }

    // If story has an image, delete from cloudinary
    if (story.type === 'photo' && story.image) {
      const publicId = story.image.split('/').pop().split('.')[0];
      await deleteFromCloudinary(publicId);
    }

    // Delete the story
    await Story.findByIdAndDelete(storyId);

    return res.status(200).json({
      status: 'success',
      message: 'Story deleted successfully',
    });
  } catch (error) {
    console.error('Delete story error:', error);
    return res.status(500).json({ message: error.message });
  }
};
