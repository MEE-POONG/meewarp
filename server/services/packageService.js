const WarpPackage = require('../models/WarpPackage');

async function listPackages({ includeInactive = false } = {}) {
  const query = {};
  if (!includeInactive) {
    query.isActive = true;
  }
  return WarpPackage.find(query).sort({ seconds: 1 }).lean();
}

async function createPackage({ name, seconds, price }) {
  return WarpPackage.create({ name, seconds, price });
}

async function updatePackage(id, payload) {
  return WarpPackage.findByIdAndUpdate(id, payload, { new: true });
}

async function deletePackage(id) {
  return WarpPackage.findByIdAndDelete(id);
}

async function findPackageBySeconds(seconds) {
  return WarpPackage.findOne({ seconds, isActive: true }).lean();
}

module.exports = {
  listPackages,
  createPackage,
  updatePackage,
  deletePackage,
  findPackageBySeconds,
};
