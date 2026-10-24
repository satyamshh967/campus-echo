const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: [true, 'Comment text cannot be empty'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

const reactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['applause', 'heart', 'insightful', 'inspiring'],
      default: 'heart'
    }
  },
  {
    timestamps: true
  }
);

const letterSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author reference is required']
    },
    recipientName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
      maxlength: [100, 'Recipient name cannot exceed 100 characters']
    },
    content: {
      type: String,
      required: [true, 'Letter content is required'],
      trim: true,
      maxlength: [3000, 'Content cannot exceed 3000 characters']
    },
    category: {
      type: String,
      enum: [
        'Academics',
        'Hackathons & Tech',
        'Club & Cultural',
        'Peer Mentorship',
        'Campus Life',
        'General'
      ],
      default: 'General'
    },
    badge: {
      type: String,
      enum: [
        'Problem Solver',
        'Lifesaver',
        'Team Player',
        'Inspirational',
        'Community Builder',
        'None'
      ],
      default: 'None'
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    // Backwards-compatible legacy likes
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    // Rich multi-reaction system
    reactions: [reactionSchema],
    comments: [commentSchema],
    // Trust, safety & auto-quarantine moderation status
    status: {
      type: String,
      enum: ['active', 'quarantined', 'removed'],
      default: 'active'
    },
    reportCount: {
      type: Number,
      default: 0
    },
    trendingScore: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Index for fast search and feed querying
letterSchema.index({ recipientName: 'text', content: 'text' });
letterSchema.index({ status: 1, category: 1, createdAt: -1 });

module.exports = mongoose.model('Letter', letterSchema);
