const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    lineUserId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    pictureUrl: {
      type: String,
      trim: true,
    },
    statusMessage: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
UserSchema.index({ lineUserId: 1 });
UserSchema.index({ lastLoginAt: -1 });

module.exports = mongoose.model('User', UserSchema);
