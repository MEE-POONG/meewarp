const mongoose = require('mongoose');

const AppSettingsSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      default: 'meeWarp',
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
    },
    primaryColor: {
      type: String,
      default: '#6366F1',
      trim: true,
    },
    logo: {
      type: String,
    },
    backgroundImage: {
      type: String,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    siteDescription: {
      type: String,
      trim: true,
    },
    siteKeywords: {
      type: String,
      trim: true,
    },
    facebookUrl: {
      type: String,
      trim: true,
    },
    instagramUrl: {
      type: String,
      trim: true,
    },
    twitterUrl: {
      type: String,
      trim: true,
    },
    youtubeUrl: {
      type: String,
      trim: true,
    },
    tiktokUrl: {
      type: String,
      trim: true,
    },
    socialLinks: {
      type: Map,
      of: String,
      default: {},
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AppSettings', AppSettingsSchema);
