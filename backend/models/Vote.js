const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Poll = require('./Poll');

const Vote = sequelize.define('Vote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  poll_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'polls',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  selected_option: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'votes',
  indexes: [
    {
      fields: ['poll_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['poll_id', 'user_id'],
      unique: true
    }
  ]
});

// Define associations
Vote.belongsTo(User, { foreignKey: 'user_id', as: 'voter' });
Vote.belongsTo(Poll, { foreignKey: 'poll_id', as: 'poll' });

// Instance method to get vote details
Vote.prototype.getVoteDetails = function() {
  return {
    id: this.id,
    poll_id: this.poll_id,
    user_id: this.user_id,
    selected_option: this.selected_option,
    created_at: this.created_at,
    updated_at: this.updated_at
  };
};

module.exports = Vote; 
