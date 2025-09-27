const express = require('express');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const WarpProfile = require('../models/WarpProfile');
const config = require('../config/env');
const adminAuth = require('../middlewares/adminAuth');
const Admin = require('../models/Admin');
const { getSettings } = require('../services/settingsService');

const router = express.Router();

const loginLimiter = config.loginRateLimit.enabled
  ? rateLimit({
      windowMs: config.loginRateLimit.windowMs,
      max: config.loginRateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
    })
  : (req, res, next) => next();

router.post('/admin/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const adminUser = await Admin.findOne({ email: normalizedEmail, isActive: true });

    if (adminUser) {
      const isValid = await adminUser.comparePassword(password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      adminUser.lastLoginAt = new Date();
      await adminUser.save();

      const token = jwt.sign(
        {
          id: adminUser._id,
          email: adminUser.email,
          role: adminUser.role,
          displayName: adminUser.displayName || adminUser.email,
        },
        config.auth.jwtSecret,
        { expiresIn: config.auth.tokenExpiresIn }
      );

      return res.status(200).json({
        token,
        role: adminUser.role,
        displayName: adminUser.displayName || adminUser.email,
        expiresIn: config.auth.tokenExpiresIn,
      });
    }

    if (
      normalizedEmail === config.adminCredentials.email.toLowerCase() &&
      password === config.adminCredentials.password
    ) {
      const token = jwt.sign(
        {
          email: normalizedEmail,
          role: 'superadmin',
          displayName: 'Root Admin',
        },
        config.auth.jwtSecret,
        { expiresIn: config.auth.tokenExpiresIn }
      );

      return res.status(200).json({
        token,
        role: 'superadmin',
        displayName: 'Root Admin',
        expiresIn: config.auth.tokenExpiresIn,
      });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate token' });
  }
});

router.post('/admin/warp', adminAuth, async (req, res) => {
  try {
    const { code, name, socialLink, isActive } = req.body;

    if (!code || !name || !socialLink) {
      return res.status(400).json({ message: 'code, name, and socialLink are required' });
    }

    const warpProfile = await WarpProfile.create({ code, name, socialLink, isActive });
    return res.status(201).json({
      id: warpProfile._id,
      code: warpProfile.code,
      name: warpProfile.name,
      socialLink: warpProfile.socialLink,
      isActive: warpProfile.isActive,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Warp code already exists' });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Failed to create Warp profile' });
  }
});

router.get('/warp/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const warpProfile = await WarpProfile.findOne({ code });

    if (!warpProfile || !warpProfile.isActive) {
      return res.status(404).json({ message: 'Warp profile not found' });
    }

    return res.status(200).json({ socialLink: warpProfile.socialLink });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve Warp profile' });
  }
});

router.get('/public/settings', async (req, res) => {
  try {
    const settings = await getSettings();
    return res.status(200).json(settings);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load settings' });
  }
});

module.exports = router;
