const express = require('express');
const router = express.Router();
const {
  getLetters,
  getLetterById,
  createLetter,
  toggleReaction,
  likeLetter,
  addComment,
  reportLetter,
  toggleBookmark,
  getSavedLetters,
  getLeaderboard,
  deleteLetter
} = require('../controllers/letterController');
const { protect } = require('../middleware/auth');

// Public Feed, Discovery & Analytics
router.get('/', getLetters);
router.get('/leaderboard', getLeaderboard);

// Protected User Library & Workflows
router.get('/saved', protect, getSavedLetters);
router.get('/:id', getLetterById);

// Protected Post Creation & Interactions
router.post('/', protect, createLetter);
router.put('/:id/like', protect, likeLetter);
router.put('/:id/reaction', protect, toggleReaction);
router.post('/:id/comment', protect, addComment);
router.post('/:id/report', protect, reportLetter);
router.put('/:id/bookmark', protect, toggleBookmark);
router.delete('/:id', protect, deleteLetter);

module.exports = router;
