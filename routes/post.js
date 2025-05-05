const express = require('express');
const {
  createPost,
  getAllPosts,
  comment,
  savePost,
  deletePost,
  updatePost,
  getPostById,
  getUserPosts,
  deleteComment,
  updateComment,
} = require('../controllers/postController');
const { authUser } = require('../middlwares/auth');

const router = express.Router();

// Ścieżki dla postów
router.post('/createPost', authUser, createPost);
router.get('/getAllPosts', authUser, getAllPosts);
router.get('/getPost/:id', authUser, getPostById);
router.get('/getUserPosts/:userId', authUser, getUserPosts);
router.put('/updatePost/:id', authUser, updatePost);
router.delete('/deletePost/:id', authUser, deletePost);

// Ścieżki dla komentarzy
router.put('/comment', authUser, comment);
router.put('/updateComment/:postId/:commentId', authUser, updateComment);
router.delete('/deleteComment/:postId/:commentId', authUser, deleteComment);

// Zapisywanie postów
router.put('/savePost/:id', authUser, savePost);

module.exports = router;
