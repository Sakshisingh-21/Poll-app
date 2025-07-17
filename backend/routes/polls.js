const express = require('express');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const User = require('../models/User');
const { closeExpiredPolls, checkAndClosePoll } = require('../middleware/pollUtils');
const { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  forbiddenResponse 
} = require('../utils/response');
const { 
  protect, 
  admin, 
  adminOwner,
  optionalAuth 
} = require('../middleware/auth');
const { 
  createPollValidation, 
  updatePollValidation 
} = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/polls
 * @desc    Create a new poll (admin only)
 * @access  Private/Admin
 */
router.post('/', protect, admin, createPollValidation, async (req, res) => {
  try {
    const { title, description, options, closing_date } = req.body;

    // Check for duplicate options
    const optionTexts = options.map(opt => opt.toLowerCase());
    const uniqueOptions = new Set(optionTexts);
    
    if (uniqueOptions.size !== options.length) {
      return res.status(400).json({
        success: false,
        message: 'Poll options must be unique'
      });
    }

    const poll = await Poll.create({
      title,
      description,
      options,
      closing_date,
      created_by: req.user.id
    });

    // Load the creator information
    await poll.reload({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });

    successResponse(res, 201, 'Poll created successfully', {
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        options: poll.options,
        closing_date: poll.closing_date,
        is_closed: poll.is_closed,
        created_by: poll.creator,
        created_at: poll.created_at
      }
    });
  } catch (error) {
    console.error('Create poll error:', error);
    errorResponse(res, 500, 'Failed to create poll', error.message);
  }
});

/**
 * @route   GET /api/polls
 * @desc    Get all polls with optional filtering
 * @access  Public (with optional auth for user-specific data)
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    // First, automatically close expired polls
    await closeExpiredPolls();
    
    // Get current date for filtering
    const now = new Date();
    
    // Build query
    const whereClause = {};
    
    // If user is admin, only show their own polls
    if (req.user && req.user.role === 'admin') {
      whereClause.created_by = req.user.id;
    }
    
    if (status === 'open') {
      whereClause[Op.and] = [
        { is_closed: false },
        { closing_date: { [Op.gt]: now } }
      ];
    } else if (status === 'closed') {
      whereClause[Op.or] = [
        { is_closed: true },
        { closing_date: { [Op.lte]: now } }
      ];
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const polls = await Poll.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }],
      order: [['created_at', 'DESC']],
      offset: offset,
      limit: parseInt(limit)
    });

    // Add user-specific data and vote counts if authenticated
    if (req.user) {
      for (let poll of polls) {
        const hasVoted = await Vote.findOne({
          where: {
            poll_id: poll.id,
            user_id: req.user.id
          }
        });
        poll.hasVoted = !!hasVoted;
        poll.userVote = hasVoted ? hasVoted.selected_option : null;
      }
    }

    // Add vote counts for all polls
    for (let poll of polls) {
      const voteCount = await Vote.count({
        where: { poll_id: poll.id }
      });
      poll.totalVotes = voteCount;
    }

    const total = await Poll.count({ where: whereClause });

    successResponse(res, 200, 'Polls retrieved successfully', {
      polls: polls.map(poll => ({
        id: poll.id,
        title: poll.title,
        description: poll.description,
        options: poll.options,
        closing_date: poll.closing_date,
        is_closed: poll.is_closed,
        created_by: poll.creator,
        created_at: poll.created_at,
        total_votes: poll.totalVotes || 0,
        ...(req.user && { hasVoted: poll.hasVoted }),
        ...(req.user && poll.userVote && { userVote: poll.userVote })
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get polls error:', error);
    errorResponse(res, 500, 'Failed to get polls', error.message);
  }
});

/**
 * @route   GET /api/polls/:id
 * @desc    Get poll by ID
 * @access  Public (with optional auth for user-specific data)
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });

    if (!poll) {
      return notFoundResponse(res, 'Poll');
    }

    // Check if poll has expired and automatically close it
    await checkAndClosePoll(poll);

    let pollData = poll.toJSON();
    
    // Add vote count
    const voteCount = await Vote.count({
      where: { poll_id: poll.id }
    });
    pollData.total_votes = voteCount;
    
    // Add user-specific data if authenticated
    if (req.user) {
      const hasVoted = await Vote.findOne({
        where: {
          poll_id: poll.id,
          user_id: req.user.id
        }
      });
      pollData.hasVoted = !!hasVoted;
      
      if (hasVoted) {
        pollData.userVote = hasVoted.selected_option;
      }
    }

    successResponse(res, 200, 'Poll retrieved successfully', {
      poll: {
        id: pollData.id,
        title: pollData.title,
        description: pollData.description,
        options: pollData.options,
        closing_date: pollData.closing_date,
        is_closed: pollData.is_closed,
        created_by: pollData.creator,
        created_at: pollData.created_at,
        total_votes: pollData.total_votes,
        ...(req.user && { hasVoted: pollData.hasVoted }),
        ...(req.user && pollData.userVote && { userVote: pollData.userVote })
      }
    });
  } catch (error) {
    console.error('Get poll error:', error);
    errorResponse(res, 500, 'Failed to get poll', error.message);
  }
});

/**
 * @route   PUT /api/polls/:id
 * @desc    Update poll (admin owner only)
 * @access  Private/Admin Owner
 */
router.put('/:id', protect, adminOwner, updatePollValidation, async (req, res) => {
  try {
    console.log('Update poll request:', { id: req.params.id, body: req.body });
    
    const poll = await Poll.findByPk(req.params.id);

    if (!poll) {
      console.log('Poll not found:', req.params.id);
      return notFoundResponse(res, 'Poll');
    }

    console.log('Found poll:', { id: poll.id, title: poll.title, is_closed: poll.is_closed });

    // Check if poll is already closed
    if (poll.is_closed || poll.isExpired()) {
      console.log('Poll is closed or expired');
      return res.status(400).json({
        success: false,
        message: 'Cannot update a closed poll'
      });
    }

    const { title, description, options, closing_date } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (closing_date) updateData.closing_date = closing_date;
    
    if (options) {
      // Check for duplicate options
      const optionTexts = options.map(opt => opt.toLowerCase());
      const uniqueOptions = new Set(optionTexts);
      
      if (uniqueOptions.size !== options.length) {
        return res.status(400).json({
          success: false,
          message: 'Poll options must be unique'
        });
      }
      updateData.options = options;
    }

    console.log('Update data:', updateData);
    console.log('Closing date details:', {
      original: req.body.closing_date,
      parsed: new Date(req.body.closing_date),
      now: new Date(),
      isFuture: new Date(req.body.closing_date) > new Date()
    });

    await poll.update(updateData);

    // Reload with creator information
    await poll.reload({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });

    console.log('Poll updated successfully:', poll.id);

    successResponse(res, 200, 'Poll updated successfully', {
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        options: poll.options,
        closing_date: poll.closing_date,
        is_closed: poll.is_closed,
        created_by: poll.creator,
        created_at: poll.created_at,
        updated_at: poll.updated_at
      }
    });
  } catch (error) {
    console.error('Update poll error:', error);
    errorResponse(res, 500, 'Failed to update poll', error.message);
  }
});

/**
 * @route   DELETE /api/polls/:id
 * @desc    Delete poll (admin owner only)
 * @access  Private/Admin Owner
 */
router.delete('/:id', protect, adminOwner, async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);

    if (!poll) {
      return notFoundResponse(res, 'Poll');
    }

    // Delete associated votes first
    await Vote.destroy({
      where: { poll_id: poll.id }
    });

    // Delete the poll
    await poll.destroy();

    successResponse(res, 200, 'Poll deleted successfully');
  } catch (error) {
    console.error('Delete poll error:', error);
    errorResponse(res, 500, 'Failed to delete poll', error.message);
  }
});

/**
 * @route   POST /api/polls/:id/close
 * @desc    Close poll manually (admin owner only)
 * @access  Private/Admin Owner
 */
router.post('/:id/close', protect, adminOwner, async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);

    if (!poll) {
      return notFoundResponse(res, 'Poll');
    }

    if (poll.is_closed) {
      return res.status(400).json({
        success: false,
        message: 'Poll is already closed'
      });
    }

    await poll.update({ is_closed: true });

    // Reload with creator information
    await poll.reload({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });

    successResponse(res, 200, 'Poll closed successfully', {
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        options: poll.options,
        closing_date: poll.closing_date,
        is_closed: poll.is_closed,
        created_by: poll.creator,
        created_at: poll.created_at,
        updated_at: poll.updated_at
      }
    });
  } catch (error) {
    console.error('Close poll error:', error);
    errorResponse(res, 500, 'Failed to close poll', error.message);
  }
});

/**
 * @route   POST /api/polls/:id/reopen
 * @desc    Reopen poll manually (admin owner only)
 * @access  Private/Admin Owner
 */
router.post('/:id/reopen', protect, adminOwner, async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);

    if (!poll) {
      return notFoundResponse(res, 'Poll');
    }

    if (!poll.is_closed) {
      return res.status(400).json({
        success: false,
        message: 'Poll is not closed'
      });
    }

    // Check if poll has expired
    if (poll.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reopen an expired poll'
      });
    }

    await poll.update({ is_closed: false });

    // Reload with creator information
    await poll.reload({
      include: [{
        model: User,
        as: 'creator',
        attributes: ['name', 'email']
      }]
    });

    successResponse(res, 200, 'Poll reopened successfully', {
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        options: poll.options,
        closing_date: poll.closing_date,
        is_closed: poll.is_closed,
        created_by: poll.creator,
        created_at: poll.created_at,
        updated_at: poll.updated_at
      }
    });
  } catch (error) {
    console.error('Reopen poll error:', error);
    errorResponse(res, 500, 'Failed to reopen poll', error.message);
  }
});

/**
 * @route   GET /api/polls/:id/results
 * @desc    Get poll results (only if poll is closed and user has voted)
 * @access  Private
 */
router.get('/:id/results', protect, async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);

    if (!poll) {
      return notFoundResponse(res, 'Poll');
    }

    // Check if user has voted
    const hasVoted = await Vote.findOne({
      where: {
        poll_id: poll.id,
        user_id: req.user.id
      }
    });

    if (!hasVoted) {
      return res.status(403).json({
        success: false,
        message: 'You must vote before viewing results'
      });
    }

    // Check if poll is closed
    if (!poll.is_closed && !poll.isExpired()) {
      return res.status(403).json({
        success: false,
        message: 'Results are only available after poll closes'
      });
    }

    // Get vote counts for each option
    const voteCounts = await Vote.findAll({
      where: { poll_id: poll.id },
      attributes: ['selected_option', [sequelize.fn('COUNT', sequelize.col('selected_option')), 'count']],
      group: ['selected_option']
    });

    const totalVotes = voteCounts.reduce((sum, vote) => sum + parseInt(vote.dataValues.count), 0);

    const results = {
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        options: poll.options,
        closing_date: poll.closing_date,
        is_closed: poll.is_closed
      },
      total_votes: totalVotes,
      option_results: poll.options.map(option => {
        const voteCount = voteCounts.find(v => v.selected_option === option);
        const votes = voteCount ? parseInt(voteCount.dataValues.count) : 0;
        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        
        return {
          option,
          votes,
          percentage
        };
      })
    };

    successResponse(res, 200, 'Poll results retrieved successfully', {
      results
    });
  } catch (error) {
    console.error('Get poll results error:', error);
    errorResponse(res, 500, 'Failed to get poll results', error.message);
  }
});

/**
 * @route   GET /api/polls/:id/admin-results
 * @desc    Get poll results for admin (no voting requirement)
 * @access  Private/Admin
 */
router.get('/:id/admin-results', protect, admin, async (req, res) => {
  try {
    const poll = await Poll.findByPk(req.params.id);

    if (!poll) {
      return notFoundResponse(res, 'Poll');
    }

    // Get vote counts for each option
    const voteCounts = await Vote.findAll({
      where: { poll_id: poll.id },
      attributes: ['selected_option', [sequelize.fn('COUNT', sequelize.col('selected_option')), 'count']],
      group: ['selected_option']
    });

    const totalVotes = voteCounts.reduce((sum, vote) => sum + parseInt(vote.dataValues.count), 0);

    // Get individual votes for admin (if poll is not anonymous)
    let individualVotes = [];
    if (!poll.is_anonymous) {
      individualVotes = await Vote.findAll({
        where: { poll_id: poll.id },
        include: [{
          model: User,
          as: 'voter',
          attributes: ['name', 'email']
        }],
        order: [['created_at', 'ASC']]
      });
    }

    const results = {
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        options: poll.options,
        closing_date: poll.closing_date,
        is_closed: poll.is_closed,
        is_anonymous: poll.is_anonymous
      },
      total_votes: totalVotes,
      option_results: poll.options.map(option => {
        const voteCount = voteCounts.find(v => v.selected_option === option);
        const votes = voteCount ? parseInt(voteCount.dataValues.count) : 0;
        const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        
        return {
          option,
          votes,
          percentage
        };
      }),
      individual_votes: individualVotes.map(vote => ({
        voter: vote.voter ? vote.voter.getPublicProfile() : null,
        selected_option: vote.selected_option,
        voted_at: vote.created_at
      }))
    };

    successResponse(res, 200, 'Admin poll results retrieved successfully', {
      results
    });
  } catch (error) {
    console.error('Get admin poll results error:', error);
    errorResponse(res, 500, 'Failed to get admin poll results', error.message);
  }
});

module.exports = router; 
