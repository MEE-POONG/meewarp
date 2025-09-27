const mongoose = require('mongoose');

const WarpPackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    seconds: {
      type: Number,
      required: true,
      min: 5,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
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

WarpPackageSchema.index({ seconds: 1 }, { unique: true });

module.exports = mongoose.model('WarpPackage', WarpPackageSchema);
