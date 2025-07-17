const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Poll = require('../models/Poll');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

const adminOrOwner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // If user is admin, they can access anything
    if (req.user.role === 'admin') {
      return next();
    }

    // For regular users, check if they own the resource
    const pollId = req.params.id;
    const poll = await Poll.findByPk(pollId);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    if (poll.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own polls.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin or owner middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const adminOwner = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const pollId = req.params.id;
    const poll = await Poll.findByPk(pollId);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if the admin is the creator of the poll
    if (poll.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify polls you created.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin owner middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Optional authentication middleware
 * Sets req.user if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (user && user.is_active) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid, but we don't fail the request
      console.log('Optional auth failed:', error.message);
    }
  }

  next();
};

module.exports = {
  protect,
  admin,
  adminOrOwner,
  adminOwner,
  optionalAuth
}; 
