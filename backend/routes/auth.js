const express = require('express');
const { Op } = require('sequelize');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  unauthorizedResponse 
} = require('../utils/response');
const { 
  protect, 
  adminOrOwner 
} = require('../middleware/auth');
const { 
  registerValidation, 
  loginValidation, 
  updateProfileValidation 
} = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { name: username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create new user
    const user = await User.create({
      name: username,
      email,
      password
    });

    // Generate token
    const token = generateToken(user.id);

    successResponse(res, 201, 'User registered successfully', {
      user: user.getPublicProfile(),
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    errorResponse(res, 500, 'Registration failed', error.message);
  }
});

/**
 * @route   POST /api/auth/register/admin
 * @desc    Register a new admin user
 * @access  Public
 */
router.post('/register/admin', registerValidation, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { name: username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create new admin user
    const user = await User.create({
      name: username,
      email,
      password,
      role: 'admin'
    });

    // Generate token
    const token = generateToken(user.id);

    successResponse(res, 201, 'Admin registered successfully', {
      user: user.getPublicProfile(),
      token
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    errorResponse(res, 500, 'Admin registration failed', error.message);
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email and include password for comparison
    const user = await User.findOne({ 
      where: { email },
      attributes: { include: ['password'] }
    });

    if (!user) {
      return unauthorizedResponse(res, 'Invalid credentials');
    }

    if (!user.is_active) {
      return unauthorizedResponse(res, 'Account is deactivated');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Invalid credentials');
    }

    // Generate token
    const token = generateToken(user.id);

    successResponse(res, 200, 'Login successful', {
      user: user.getPublicProfile(),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 500, 'Login failed', error.message);
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    successResponse(res, 200, 'Profile retrieved successfully', {
      user: req.user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    errorResponse(res, 500, 'Failed to get profile', error.message);
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', protect, updateProfileValidation, async (req, res) => {
  try {
    const { username, email } = req.body;
    const updateData = {};

    // Check if username is being updated
    if (username && username !== req.user.name) {
      const existingUser = await User.findOne({ where: { name: username } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      updateData.name = username;
    }

    // Check if email is being updated
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
      updateData.email = email;
    }

    // Update user if there are changes
    if (Object.keys(updateData).length > 0) {
      await req.user.update(updateData);
      await req.user.reload();

      successResponse(res, 200, 'Profile updated successfully', {
        user: req.user.getPublicProfile()
      });
    } else {
      successResponse(res, 200, 'No changes to update', {
        user: req.user.getPublicProfile()
      });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    errorResponse(res, 500, 'Failed to update profile', error.message);
  }
});

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/users', protect, async (req, res) => {
  try {
    // Only admins can view all users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    
    successResponse(res, 200, 'Users retrieved successfully', {
      users: users.map(user => user.getPublicProfile()),
      count: users.length
    });
  } catch (error) {
    console.error('Get users error:', error);
    errorResponse(res, 500, 'Failed to get users', error.message);
  }
});

/**
 * @route   GET /api/auth/users/:userId
 * @desc    Get user by ID (admin or self)
 * @access  Private
 */
router.get('/users/:userId', protect, adminOrOwner, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return notFoundResponse(res, 'User');
    }

    successResponse(res, 200, 'User retrieved successfully', {
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get user error:', error);
    errorResponse(res, 500, 'Failed to get user', error.message);
  }
});

module.exports = router; 
