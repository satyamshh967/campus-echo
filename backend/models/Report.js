const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    letter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Letter',
      required: true,
      index: true
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      enum: [
        'Harassment',
        'Hate Speech',
        'Spam',
        'Inappropriate Content',
        'Misinformation',
        'Other'
      ],
      required: [true, 'Report reason is required']
    },
    details: {
      type: String,
      trim: true,
      maxlength: 500
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate reports from the same user for the same post
reportSchema.index({ letter: 1, reporter: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
