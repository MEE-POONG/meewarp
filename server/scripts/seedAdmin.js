const mongoose = require('mongoose');
const config = require('../config/env');
const Admin = require('../models/Admin');
const WarpPackage = require('../models/WarpPackage');
const AppSettings = require('../models/AppSettings');

async function run() {
  const { mongodbUri } = config;
  if (!mongodbUri) {
    console.error('Missing MONGODB_URI.');
    process.exit(1);
  }

  await mongoose.connect(mongodbUri);

  try {
    const email = process.env.SEED_ADMIN_EMAIL || config.adminCredentials.email;
    const password = process.env.SEED_ADMIN_PASSWORD || config.adminCredentials.password;
    const role = process.env.SEED_ADMIN_ROLE || 'superadmin';

    if (!email || !password) {
      console.error('Provide SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.');
      process.exit(1);
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      existing.role = role;
      existing.password = password;
      await existing.save();
      console.log(`Updated admin user ${email} with role ${role}.`);
    } else {
      await Admin.create({ email, password, role });
      console.log(`Created admin user ${email} with role ${role}.`);
    }

    const defaultPackages = [
      { name: 'Quick Warp', seconds: 30, price: 199 },
      { name: 'Highlight Warp', seconds: 60, price: 349 },
      { name: 'Spotlight Warp', seconds: 90, price: 499 },
    ];

    for (const pkg of defaultPackages) {
      const exists = await WarpPackage.findOne({ seconds: pkg.seconds });
      if (!exists) {
        await WarpPackage.create(pkg);
        console.log(`Seeded package ${pkg.name}`);
      }
    }

    const settings = await AppSettings.findOne({});
    if (!settings) {
      await AppSettings.create({ brandName: 'meeWarp', tagline: 'Warp the Night' });
      console.log('Seeded default app settings.');
    }
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
