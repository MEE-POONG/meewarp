const express = require('express');
const jwt = require('jsonwebtoken');
const lineAuthService = require('../services/lineAuthService');
const User = require('../models/User');
const config = require('../config/env');

const router = express.Router();

// Check if LINE Login is configured
const isLineConfigured = () => lineAuthService.isConfigured();

// Generate JWT token for user session
const generateUserToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      lineUserId: user.lineUserId,
      displayName: user.displayName,
    },
    config.auth.jwtSecret,
    { expiresIn: '7d' }
  );
};

// Get LINE Login URL
router.get('/line/login', (req, res) => {
  try {
    if (!isLineConfigured()) {
      return res.status(503).json({
        message: 'LINE Login is not configured',
        configured: false,
      });
    }

    const state = req.query.redirect || 'default';
    const loginUrl = lineAuthService.getLoginUrl(state);

    res.json({
      loginUrl,
      configured: true,
    });
  } catch (error) {
    console.error('LINE login URL generation error:', error);
    res.status(500).json({
      message: 'Failed to generate LINE login URL',
      configured: false,
    });
  }
});

// LINE Login callback (GET - for LINE API redirect)
router.get('/line/callback', async (req, res) => {
  try {
    if (!isLineConfigured()) {
      return res.status(503).json({
        message: 'LINE Login is not configured',
      });
    }

    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({
        message: 'Authorization code is required',
      });
    }

    // Exchange code for token
    const tokenResponse = await lineAuthService.exchangeCodeForToken(code);
    const { access_token, id_token } = tokenResponse;

    // Verify ID token and get user info
    const idTokenData = await lineAuthService.verifyIdToken(id_token);
    const { sub: lineUserId, name: displayName, picture: pictureUrl, email } = idTokenData;

    // Find or create user
    let user = await User.findOne({ lineUserId });

    if (user) {
      // Update existing user
      user.displayName = displayName;
      user.pictureUrl = pictureUrl;
      user.email = email;
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        lineUserId,
        displayName,
        pictureUrl,
        email,
        lastLoginAt: new Date(),
      });
    }

    // Generate JWT token
    const token = generateUserToken(user);

    // Redirect to self-warp page with token
    const redirectUrl = `${process.env.PUBLIC_BASE_URL || 'https://meewarp.me-prompt-technology.com'}/self-warp?token=${token}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('LINE callback error:', error);
    res.status(500).json({
      message: 'LINE Login failed',
      error: error.message,
    });
  }
});

// LINE Login callback (POST - for client requests)
router.post('/line/callback', async (req, res) => {
  try {
    if (!isLineConfigured()) {
      return res.status(503).json({
        message: 'LINE Login is not configured',
      });
    }

    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({
        message: 'Authorization code is required',
      });
    }

    // Exchange code for token
    const tokenResponse = await lineAuthService.exchangeCodeForToken(code);
    const { access_token, id_token } = tokenResponse;

    // Verify ID token and get user info
    const idTokenData = await lineAuthService.verifyIdToken(id_token);
    const { sub: lineUserId, name: displayName, picture: pictureUrl, email } = idTokenData;

    // Find or create user
    let user = await User.findOne({ lineUserId });

    if (user) {
      // Update existing user
      user.displayName = displayName;
      user.pictureUrl = pictureUrl;
      user.email = email;
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        lineUserId,
        displayName,
        pictureUrl,
        email,
        lastLoginAt: new Date(),
      });
    }

    // Generate JWT token
    const token = generateUserToken(user);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        lineUserId: user.lineUserId,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('LINE callback error:', error);
    res.status(500).json({
      message: 'LINE Login failed',
      error: error.message,
    });
  }
});

// Verify user token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authorization token required',
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.auth.jwtSecret);

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        message: 'Invalid or inactive user',
      });
    }

    res.json({
      valid: true,
      user: {
        id: user._id,
        lineUserId: user.lineUserId,
        displayName: user.displayName,
        pictureUrl: user.pictureUrl,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(401).json({
      message: 'Invalid token',
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // Since we're using JWT, logout is handled on the client side
  // by removing the token from storage
  res.json({
    message: 'Logged out successfully',
  });
});

module.exports = router;
