const AppSettings = require('../models/AppSettings');

async function getSettings() {
  const settings = await AppSettings.findOne({}).lean();
  if (settings) {
    return settings;
  }
  return AppSettings.create({}).then((doc) => doc.toObject());
}

async function updateSettings({ payload, adminId }) {
  const update = {
    ...payload,
    updatedBy: adminId || null,
  };

  const settings = await AppSettings.findOneAndUpdate({}, update, {
    new: true,
    upsert: true,
  });

  return settings.toObject();
}

module.exports = {
  getSettings,
  updateSettings,
};
