const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { protect, authorize } = require('../middlewares/authMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'pulse_secret', {
    expiresIn: '30d',
  });
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, organizationName } = req.body;

    if (!name || !email || !password || !organizationName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create Tenant first
    const tenant = await Tenant.create({ name: organizationName });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User (first user of tenant is Admin)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'Admin',
      tenantId: tenant._id,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ message: 'Account deactivated. Please contact your administrator.' });
      }

      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/me', protect, async (req, res) => {
  res.status(200).json(req.user);
});

// Admin ONLY: Get all users in the tenant
router.get('/users', protect, authorize('Admin'), async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.user.tenantId }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Admin ONLY: Add a new user to the tenant
router.post('/add-user', protect, authorize('Admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      tenantId: req.user.tenantId,
    });

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Admin ONLY: Toggle user status
router.patch('/users/:id/status', protect, authorize('Admin'), async (req, res) => {
  try {
    const userToUpdate = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Safety: Cannot deactivate self
    if (userToUpdate._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    userToUpdate.isActive = !userToUpdate.isActive;
    await userToUpdate.save();

    res.json({ message: `User ${userToUpdate.isActive ? 'activated' : 'deactivated'}`, isActive: userToUpdate.isActive });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Admin ONLY: Delete a user
router.delete('/users/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const userToDelete = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId });

    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Safety: Cannot delete self
    if (userToDelete._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await userToDelete.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
