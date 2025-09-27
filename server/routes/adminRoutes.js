const express = require('express');
const adminAuth = require('../middlewares/adminAuth');
const requireRole = require('../middlewares/requireRole');
const { upload, deleteOldImage } = require('../middlewares/upload');
const {
  getDashboardOverview,
  getStatistics,
  getCustomerDirectory,
} = require('../services/statisticsService');
const { listOrders, exportOrders } = require('../services/ordersService');
const { getSettings, updateSettings } = require('../services/settingsService');
const {
  listPackages,
  createPackage,
  updatePackage,
  deletePackage,
} = require('../services/packageService');
const Admin = require('../models/Admin');

const router = express.Router();

router.use(adminAuth);

router.get('/admin/dashboard/overview', async (req, res) => {
  try {
    const overview = await getDashboardOverview();
    return res.status(200).json(overview);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load dashboard overview' });
  }
});

router.get('/admin/statistics', async (req, res) => {
  try {
    const { range, from, to } = req.query;
    const statistics = await getStatistics({ range, from, to });
    return res.status(200).json(statistics);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to load statistics' });
  }
});

router.get('/admin/customers', async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const directory = await getCustomerDirectory({ page, limit, search });
    return res.status(200).json(directory);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load customers' });
  }
});

router.get('/admin/orders', async (req, res) => {
  try {
    const { page, limit, status, search, from, to, format } = req.query;

    if (format) {
      const file = await exportOrders({ format, status, search, from, to });
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${file.filename}`);
      return res.send(file.buffer);
    }

    const orders = await listOrders({ page, limit, status, search, from, to });
    return res.status(200).json(orders);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load orders' });
  }
});

router.get('/admin/settings', requireRole('staff', 'manager', 'superadmin'), async (req, res) => {
  try {
    const settings = await getSettings();
    return res.status(200).json(settings);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load settings' });
  }
});

router.put('/admin/settings', requireRole('manager', 'superadmin'), upload.fields([
  { name: 'backgroundImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const payload = { ...req.body };
    
    // Handle file uploads
    if (req.files) {
      if (req.files.backgroundImage && req.files.backgroundImage[0]) {
        // Delete old background if exists
        if (req.body.oldBackgroundImage) {
          deleteOldImage(req.body.oldBackgroundImage);
        }
        payload.backgroundImage = `/uploads/images/${req.files.backgroundImage[0].filename}`;
      }
    }
    
    const settings = await updateSettings({ payload, adminId: req.admin.id });
    return res.status(200).json(settings);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update settings' });
  }
});

router.get('/admin/packages', requireRole('staff', 'manager', 'superadmin'), async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const packages = await listPackages({ includeInactive });
    return res.status(200).json(packages);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load packages' });
  }
});

router.post('/admin/packages', requireRole('manager', 'superadmin'), async (req, res) => {
  try {
    const { name, seconds, price } = req.body;
    if (!name || !seconds || !price) {
      return res.status(400).json({ message: 'name, seconds, and price are required' });
    }
    const pkg = await createPackage({ name, seconds, price });
    return res.status(201).json(pkg);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Package with the same duration already exists' });
    }
    return res.status(500).json({ message: 'Failed to create package' });
  }
});

router.put('/admin/packages/:id', requireRole('manager', 'superadmin'), async (req, res) => {
  try {
    const pkg = await updatePackage(req.params.id, req.body);
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }
    return res.status(200).json(pkg);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update package' });
  }
});

router.delete('/admin/packages/:id', requireRole('superadmin'), async (req, res) => {
  try {
    const pkg = await deletePackage(req.params.id);
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete package' });
  }
});

router.get('/admin/users', requireRole('superadmin'), async (req, res) => {
  try {
    const admins = await Admin.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json(admins.map(({ password, ...rest }) => rest));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load admin users' });
  }
});

router.post('/admin/users', requireRole('superadmin'), async (req, res) => {
  try {
    const { email, password, role, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const admin = await Admin.create({ email, password, role: role || 'manager', displayName });
    const { password: _, ...sanitized } = admin.toObject();
    return res.status(201).json(sanitized);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    return res.status(500).json({ message: 'Failed to create admin user' });
  }
});

router.patch('/admin/users/:id', requireRole('superadmin'), async (req, res) => {
  try {
    const { role, password, displayName, isActive } = req.body;
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    if (role) admin.role = role;
    if (typeof isActive === 'boolean') admin.isActive = isActive;
    if (displayName !== undefined) admin.displayName = displayName;
    if (password) admin.password = password;

    await admin.save();

    const { password: _, ...sanitized } = admin.toObject();
    return res.status(200).json(sanitized);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update admin user' });
  }
});

module.exports = router;
