const express = require('express');
const { Op } = require('sequelize');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const User = require('../models/User');
const { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  forbiddenResponse 
} = require('../utils/response');
const { protect } = require('../middleware/auth');
const { voteValidation } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   POST /api/votes
 * @desc    Cast a vote on a poll
 * @access  Private
 */
router.post('/', protect, voteValidation, async (req, res) => {
  try {
    const { poll_id, selected_option } = req.body;
    
    console.log('Vote request body:', req.body);
    console.log('Poll ID type:', typeof poll_id, 'value:', poll_id);
    console.log('Selected option:', selected_option);

    // Find the poll
    const poll = await Poll.findByPk(poll_id);
    if (!poll) {
      return notFoundResponse(res, 'Poll');
    }

    // Check if poll is closed
    if (poll.is_closed || new Date() > poll.closing_date) {
      return res.status(400).json({
        success: false,
        message: 'Cannot vote on a closed poll'
      });
    }

    // Check if user has already voted
    console.log('Checking for existing vote - poll_id:', poll_id, 'user_id:', req.user.id);
    const existingVote = await Vote.findOne({
      where: {
        poll_id: poll_id,
        user_id: req.user.id
      }
    });
    console.log('Existing vote found:', existingVote);

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this poll'
      });
    }

    // Validate that the option exists in the poll
    if (!poll.options.includes(selected_option)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option selected'
      });
    }

    // Create the vote
    const vote = await Vote.create({
      poll_id: poll_id,
      user_id: req.user.id,
      selected_option: selected_option
    });

    successResponse(res, 201, 'Vote cast successfully', {
      vote: {
        id: vote.id,
        poll_id: vote.poll_id,
        selected_option: vote.selected_option,
        created_at: vote.created_at
      }
    });
  } catch (error) {
    console.error('Cast vote error:', error);
    
    // Handle duplicate vote error
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this poll'
      });
    }
    
    errorResponse(res, 500, 'Failed to cast vote', error.message);
  }
});

/**
 * @route   GET /api/votes/poll/:pollId
 * @desc    Get user's vote for a specific poll
 * @access  Private
 */
router.get('/poll/:pollId', protect, async (req, res) => {
  try {
    const { pollId } = req.params;

    // Check if poll exists
    const poll = await Poll.findByPk(pollId);
    if (!poll) {
      return notFoundResponse(res, 'Poll');
    }

    // Get user's vote
    const vote = await Vote.findOne({
      where: {
        poll_id: pollId,
        user_id: req.user.id
      }
    });

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'You have not voted on this poll yet'
      });
    }

    successResponse(res, 200, 'Vote retrieved successfully', {
      vote: {
        id: vote.id,
        poll_id: vote.poll_id,
        selected_option: vote.selected_option,
        created_at: vote.created_at
      }
    });
  } catch (error) {
    console.error('Get vote error:', error);
    errorResponse(res, 500, 'Failed to get vote', error.message);
  }
});

/**
 * @route   GET /api/votes/user
 * @desc    Get all votes by current user
 * @access  Private
 */
router.get('/user', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const votes = await Vote.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Poll,
        as: 'poll',
        attributes: ['title', 'closing_date']
      }],
      order: [['created_at', 'DESC']],
      offset: offset,
      limit: parseInt(limit)
    });

    const total = await Vote.count({ where: { user_id: req.user.id } });

    successResponse(res, 200, 'User votes retrieved successfully', {
      votes: votes.map(vote => ({
        id: vote.id,
        poll: {
          id: vote.poll.id,
          title: vote.poll.title,
          closing_date: vote.poll.closing_date
        },
        selected_option: vote.selected_option,
        created_at: vote.created_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user votes error:', error);
    errorResponse(res, 500, 'Failed to get user votes', error.message);
  }
});

/**
 * @route   GET /api/votes/poll/:pollId/stats
 * @desc    Get voting statistics for a poll (admin only)
 * @access  Private/Admin
 */
router.get('/poll/:pollId/stats', protect, async (req, res) => {
  try {
    const { pollId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return forbiddenResponse(res, 'Admin privileges required');
    }

    // Check if poll exists
    const poll = await Poll.findByPk(pollId);
    if (!poll) {
      return notFoundResponse(res, 'Poll');
    }

    // Get vote statistics
    const voteStats = await Vote.getPollStats(pollId);
    const totalVotes = await Vote.countDocuments({ poll: pollId });

    // Get detailed vote information
    const votes = await Vote.getPollVotes(pollId);

    successResponse(res, 200, 'Vote statistics retrieved successfully', {
      poll: {
        id: poll._id,
        question: poll.question,
        status: poll.getStatus(),
        totalVotes
      },
      statistics: voteStats,
      votes: votes.map(vote => ({
        id: vote._id,
        user: vote.user,
        optionId: vote.option,
        votedAt: vote.votedAt
      }))
    });
  } catch (error) {
    console.error('Get vote stats error:', error);
    errorResponse(res, 500, 'Failed to get vote statistics', error.message);
  }
});

/**
 * @route   DELETE /api/votes/:voteId
 * @desc    Delete a vote (admin only or vote owner)
 * @access  Private
 */
router.delete('/:voteId', protect, async (req, res) => {
  try {
    const { voteId } = req.params;

    const vote = await Vote.findByPk(voteId);
    if (!vote) {
      return notFoundResponse(res, 'Vote');
    }

    // Check if user is admin or vote owner
    if (req.user.role !== 'admin' && vote.user_id !== req.user.id) {
      return forbiddenResponse(res, 'You can only delete your own votes');
    }

    // Get the poll to update vote counts
    const poll = await Poll.findByPk(vote.poll_id);
    if (poll) {
      // Decrease vote count for the option
      const option = poll.options.id(vote.option_id);
      if (option) {
        option.votes = Math.max(0, option.votes - 1);
        poll.totalVotes = Math.max(0, poll.totalVotes - 1);
        await poll.save();
      }
    }

    // Delete the vote
    await Vote.destroy({ where: { id: voteId } });

    successResponse(res, 200, 'Vote deleted successfully');
  } catch (error) {
    console.error('Delete vote error:', error);
    errorResponse(res, 500, 'Failed to delete vote', error.message);
  }
});

module.exports = router; 
