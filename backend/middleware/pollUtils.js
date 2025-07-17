const { Op } = require('sequelize');
const Poll = require('../models/Poll');

/**
 * Middleware to automatically close expired polls
 * This should be called before fetching polls to ensure accurate status
 */
const closeExpiredPolls = async () => {
  try {
    const now = new Date();
    const result = await Poll.update(
      { is_closed: true },
      { 
        where: { 
          is_closed: false,
          closing_date: { [Op.lte]: now }
        }
      }
    );
    
    if (result[0] > 0) {
      console.log(`Automatically closed ${result[0]} expired polls`);
    }
    
    return result[0]; // Number of polls closed
  } catch (error) {
    console.error('Error closing expired polls:', error);
    return 0;
  }
};

/**
 * Check if a specific poll has expired and close it if needed
 */
const checkAndClosePoll = async (poll) => {
  if (!poll.is_closed && poll.isExpired()) {
    await poll.update({ is_closed: true });
    console.log(`Automatically closed expired poll: ${poll.id}`);
    return true;
  }
  return false;
};

module.exports = {
  closeExpiredPolls,
  checkAndClosePoll
}; 
