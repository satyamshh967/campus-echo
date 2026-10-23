const Letter = require('../models/Letter');

// @desc    Fetch all letters / shoutouts (feed)
// @route   GET /api/letters
// @access  Public
const getLetters = async (req, res) => {
  try {
    const letters = await Letter.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name email')
      .populate('comments.user', 'name email');

    return res.status(200).json(letters);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error fetching letters' });
  }
};

// @desc    Fetch a single letter by ID
// @route   GET /api/letters/:id
// @access  Public
const getLetterById = async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id)
      .populate('author', 'name email')
      .populate('comments.user', 'name email');

    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    return res.status(200).json(letter);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error fetching letter' });
  }
};

// @desc    Create a new shoutout / letter
// @route   POST /api/letters
// @access  Private (auth required)
const createLetter = async (req, res) => {
  try {
    const { recipientName, content } = req.body;

    if (!recipientName || !recipientName.trim()) {
      return res.status(400).json({ message: 'Recipient name is required' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Letter content cannot be empty' });
    }

    const newLetter = new Letter({
      author: req.user._id,
      recipientName: recipientName.trim(),
      content: content.trim(),
      likes: [],
      comments: []
    });

    const savedLetter = await newLetter.save();
    const populatedLetter = await savedLetter.populate('author', 'name email');

    return res.status(201).json(populatedLetter);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error creating letter' });
  }
};

// @desc    Like or Unlike a letter (toggle)
// @route   PUT /api/letters/:id/like
// @access  Private (auth required)
const likeLetter = async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    const userIdStr = req.user._id.toString();
    const isLiked = letter.likes.some((likeId) => likeId.toString() === userIdStr);

    if (isLiked) {
      // User has already liked -> Remove like (Unlike)
      letter.likes = letter.likes.filter((likeId) => likeId.toString() !== userIdStr);
    } else {
      // Add user's like
      letter.likes.push(req.user._id);
    }

    await letter.save();

    const updatedLetter = await Letter.findById(req.params.id)
      .populate('author', 'name email')
      .populate('comments.user', 'name email');

    return res.status(200).json(updatedLetter);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error updating like status' });
  }
};

// @desc    Add a comment to a letter
// @route   POST /api/letters/:id/comment
// @access  Private (auth required)
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const letter = await Letter.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    const newComment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    };

    letter.comments.push(newComment);
    await letter.save();

    const updatedLetter = await Letter.findById(req.params.id)
      .populate('author', 'name email')
      .populate('comments.user', 'name email');

    return res.status(201).json(updatedLetter);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error adding comment' });
  }
};

// @desc    Delete a letter (Author only)
// @route   DELETE /api/letters/:id
// @access  Private (auth required)
const deleteLetter = async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);

    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    // Verify ownership
    if (letter.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this letter' });
    }

    await letter.deleteOne();

    return res.status(200).json({ message: 'Letter deleted successfully', id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error deleting letter' });
  }
};

module.exports = {
  getLetters,
  getLetterById,
  createLetter,
  likeLetter,
  addComment,
  deleteLetter
};
