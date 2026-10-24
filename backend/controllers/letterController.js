const Letter = require('../models/Letter');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Report = require('../models/Report');

// Helper to mask anonymous authors
const sanitizeLetterAuthor = (letter, currentUserId = null) => {
  const plainLetter = letter.toObject ? letter.toObject() : { ...letter };
  const authorId = plainLetter.author?._id || plainLetter.author;
  const isOwner = currentUserId && authorId && authorId.toString() === currentUserId.toString();

  if (plainLetter.isAnonymous && !isOwner) {
    plainLetter.author = {
      _id: null,
      name: 'Anonymous Student',
      department: 'Campus',
      isAnonymous: true
    };
  }
  return plainLetter;
};

// Helper: Compute Trending Decay Score
// Formula: (Reactions * 2 + Comments * 3 + 1) / (Hours + 2)^1.5
const calculateTrendingScore = (reactionsCount, commentsCount, createdAt) => {
  const hoursSince = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60));
  const engagement = (reactionsCount * 2) + (commentsCount * 3) + 1;
  const decay = Math.pow(hoursSince + 2, 1.5);
  return engagement / decay;
};

// @desc    Fetch letters feed with filtering, search & sorting
// @route   GET /api/letters
// @access  Public
const getLetters = async (req, res) => {
  try {
    const { category, search, sort = 'trending' } = req.query;

    const filter = { status: 'active' };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ recipientName: regex }, { content: regex }];
    }

    let letters = await Letter.find(filter)
      .populate('author', 'name email department karmaScore')
      .populate('comments.user', 'name department')
      .populate('reactions.user', 'name')
      .lean();

    const currentUserId = req.user?._id;

    // Apply sorting logic
    if (sort === 'trending') {
      letters.forEach((l) => {
        const reactionsCount = l.reactions?.length || l.likes?.length || 0;
        const commentsCount = l.comments?.length || 0;
        l.computedTrendingScore = calculateTrendingScore(reactionsCount, commentsCount, l.createdAt);
      });
      letters.sort((a, b) => b.computedTrendingScore - a.computedTrendingScore);
    } else if (sort === 'impact') {
      letters.sort((a, b) => {
        const impactA = (a.reactions?.length || 0) + (a.comments?.length || 0);
        const impactB = (b.reactions?.length || 0) + (b.comments?.length || 0);
        return impactB - impactA;
      });
    } else {
      // 'latest' default
      letters.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Mask anonymous posts
    const sanitized = letters.map((l) => sanitizeLetterAuthor(l, currentUserId));

    return res.status(200).json(sanitized);
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
      .populate('author', 'name email department karmaScore')
      .populate('comments.user', 'name department')
      .populate('reactions.user', 'name');

    if (!letter || letter.status === 'removed') {
      return res.status(404).json({ message: 'Letter not found or has been removed' });
    }

    return res.status(200).json(sanitizeLetterAuthor(letter, req.user?._id));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error fetching letter' });
  }
};

// @desc    Create a new shoutout / letter
// @route   POST /api/letters
// @access  Private
const createLetter = async (req, res) => {
  try {
    const { recipientName, content, category, badge, isAnonymous } = req.body;

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
      category: category || 'General',
      badge: badge || 'None',
      isAnonymous: Boolean(isAnonymous),
      likes: [],
      reactions: [],
      comments: [],
      status: 'active'
    });

    const savedLetter = await newLetter.save();
    const populated = await savedLetter.populate('author', 'name email department karmaScore');

    // Reward author karma score (+5 points for giving recognition)
    await User.findByIdAndUpdate(req.user._id, { $inc: { karmaScore: 5 } });

    // Check if recipient matches a registered user on campus to dispatch shoutout notification
    const matchedRecipient = await User.findOne({
      name: { $regex: new RegExp(`^${recipientName.trim()}$`, 'i') }
    });

    if (matchedRecipient && matchedRecipient._id.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: matchedRecipient._id,
        sender: isAnonymous ? null : req.user._id,
        letter: savedLetter._id,
        type: 'shoutout',
        message: isAnonymous
          ? 'An anonymous peer just posted a campus shoutout for you!'
          : `${req.user.name} gave you a shoutout on CampusEcho!`
      });
    }

    return res.status(201).json(sanitizeLetterAuthor(populated, req.user._id));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error creating letter' });
  }
};

// @desc    Toggle multi-reaction (applause, heart, insightful, inspiring)
// @route   PUT /api/letters/:id/reaction
// @access  Private
const toggleReaction = async (req, res) => {
  try {
    const { type = 'heart' } = req.body;
    const validTypes = ['applause', 'heart', 'insightful', 'inspiring'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `Invalid reaction type. Must be one of: ${validTypes.join(', ')}` });
    }

    const letter = await Letter.findById(req.params.id);
    if (!letter || letter.status !== 'active') {
      return res.status(404).json({ message: 'Letter not found or unavailable' });
    }

    const userIdStr = req.user._id.toString();
    const existingIndex = letter.reactions.findIndex(
      (r) => r.user.toString() === userIdStr
    );

    let isAdded = false;

    if (existingIndex !== -1) {
      if (letter.reactions[existingIndex].type === type) {
        // Same reaction clicked -> remove it (toggle off)
        letter.reactions.splice(existingIndex, 1);
        letter.likes = letter.likes.filter((id) => id.toString() !== userIdStr);
      } else {
        // Different reaction clicked -> switch reaction type
        letter.reactions[existingIndex].type = type;
        if (!letter.likes.some((id) => id.toString() === userIdStr)) {
          letter.likes.push(req.user._id);
        }
      }
    } else {
      // Add brand new reaction
      letter.reactions.push({ user: req.user._id, type });
      if (!letter.likes.some((id) => id.toString() === userIdStr)) {
        letter.likes.push(req.user._id);
      }
      isAdded = true;
    }

    await letter.save();

    // Reward letter author with +2 karma points on new reaction & notify
    if (isAdded && letter.author.toString() !== userIdStr) {
      await User.findByIdAndUpdate(letter.author, { $inc: { karmaScore: 2 } });

      await Notification.create({
        recipient: letter.author,
        sender: req.user._id,
        letter: letter._id,
        type: 'reaction',
        message: `${req.user.name} reacted with ${type} to your shoutout.`
      });
    }

    const updated = await Letter.findById(req.params.id)
      .populate('author', 'name email department karmaScore')
      .populate('comments.user', 'name department')
      .populate('reactions.user', 'name');

    return res.status(200).json(sanitizeLetterAuthor(updated, req.user._id));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error updating reaction' });
  }
};

// @desc    Backwards-compatible like toggle
// @route   PUT /api/letters/:id/like
// @access  Private
const likeLetter = async (req, res) => {
  return toggleReaction(req, res);
};

// @desc    Add a comment to a letter
// @route   POST /api/letters/:id/comment
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }

    const letter = await Letter.findById(req.params.id);
    if (!letter || letter.status !== 'active') {
      return res.status(404).json({ message: 'Letter not found or unavailable' });
    }

    letter.comments.push({
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    });

    await letter.save();

    // Reward letter author with +3 karma points for receiving comments
    if (letter.author.toString() !== req.user._id.toString()) {
      await User.findByIdAndUpdate(letter.author, { $inc: { karmaScore: 3 } });

      await Notification.create({
        recipient: letter.author,
        sender: req.user._id,
        letter: letter._id,
        type: 'comment',
        message: `${req.user.name} commented on your shoutout.`
      });
    }

    const updated = await Letter.findById(req.params.id)
      .populate('author', 'name email department karmaScore')
      .populate('comments.user', 'name department')
      .populate('reactions.user', 'name');

    return res.status(201).json(sanitizeLetterAuthor(updated, req.user._id));
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error adding comment' });
  }
};

// @desc    Report / Flag a letter (Trust & Safety pipeline with auto-quarantine)
// @route   POST /api/letters/:id/report
// @access  Private
const reportLetter = async (req, res) => {
  try {
    const { reason, details } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Please provide a valid report reason' });
    }

    const letter = await Letter.findById(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

    // Check for duplicate reports by the same user
    const existingReport = await Report.findOne({
      letter: letter._id,
      reporter: req.user._id
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this shoutout.' });
    }

    await Report.create({
      letter: letter._id,
      reporter: req.user._id,
      reason,
      details: details ? details.trim() : ''
    });

    letter.reportCount = (letter.reportCount || 0) + 1;

    // Automated Moderation Rule: Auto-quarantine when threshold >= 3 reports
    if (letter.reportCount >= 3) {
      letter.status = 'quarantined';
    }

    await letter.save();

    return res.status(200).json({
      message: 'Report submitted. Thank you for helping keep the campus community safe.',
      reportCount: letter.reportCount,
      status: letter.status
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error reporting letter' });
  }
};

// @desc    Toggle bookmark for current user
// @route   PUT /api/letters/:id/bookmark
// @access  Private
const toggleBookmark = async (req, res) => {
  try {
    const letterId = req.params.id;
    const user = await User.findById(req.user._id);

    const isBookmarked = user.savedLetters.some(
      (id) => id.toString() === letterId.toString()
    );

    if (isBookmarked) {
      user.savedLetters = user.savedLetters.filter(
        (id) => id.toString() !== letterId.toString()
      );
    } else {
      user.savedLetters.push(letterId);
    }

    await user.save();

    return res.status(200).json({
      isBookmarked: !isBookmarked,
      savedLetters: user.savedLetters
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error toggling bookmark' });
  }
};

// @desc    Fetch bookmarked letters for current user
// @route   GET /api/letters/saved
// @access  Private
const getSavedLetters = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedLetters',
      match: { status: 'active' },
      populate: [
        { path: 'author', select: 'name email department karmaScore' },
        { path: 'comments.user', select: 'name department' },
        { path: 'reactions.user', select: 'name' }
      ]
    });

    const sanitized = (user.savedLetters || []).map((l) =>
      sanitizeLetterAuthor(l, req.user._id)
    );

    return res.status(200).json(sanitized);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error fetching saved letters' });
  }
};

// @desc    Fetch campus recognition leaderboard & analytics
// @route   GET /api/letters/leaderboard
// @access  Public
const getLeaderboard = async (req, res) => {
  try {
    // 1. Top Recognized & Impactful Users
    const topUsers = await User.find()
      .sort({ karmaScore: -1 })
      .limit(5)
      .select('name department karmaScore');

    // 2. Most celebrated badges
    const badgeStats = await Letter.aggregate([
      { $match: { status: 'active', badge: { $ne: 'None' } } },
      { $group: { _id: '$badge', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 }
    ]);

    // 3. Top category breakdown
    const categoryStats = await Letter.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return res.status(200).json({
      topUsers,
      badgeStats,
      categoryStats
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error fetching leaderboard' });
  }
};

// @desc    Delete a letter (Author only)
// @route   DELETE /api/letters/:id
// @access  Private
const deleteLetter = async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }

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
  toggleReaction,
  likeLetter,
  addComment,
  reportLetter,
  toggleBookmark,
  getSavedLetters,
  getLeaderboard,
  deleteLetter
};
