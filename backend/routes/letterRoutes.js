const express = require('express');
const router = express.Router();
const {
  getLetters,
  getLetterById,
  createLetter,
  likeLetter,
  addComment,
  deleteLetter
} = require('../controllers/letterController');
const { protect } = require('../middleware/auth');

// Public route to view letter feed & specific letter
router.get('/', getLetters);
router.get('/:id', getLetterById);

// Protected routes (creation, likes, comments, deletion)
router.post('/', protect, createLetter);
router.put('/:id/like', protect, likeLetter);
router.post('/:id/comment', protect, addComment);
router.delete('/:id', protect, deleteLetter);

module.exports = router;
