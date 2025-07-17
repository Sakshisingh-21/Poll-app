const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Poll = sequelize.define('Poll', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  options: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isValidOptions(value) {
        if (!Array.isArray(value) || value.length < 2) {
          throw new Error('Poll must have at least 2 options');
        }
        if (value.length > 10) {
          throw new Error('Poll cannot have more than 10 options');
        }
        value.forEach(option => {
          if (typeof option !== 'string' || option.trim().length === 0) {
            throw new Error('All options must be non-empty strings');
          }
        });
      }
    }
  },
  closing_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isFutureDate(value) {
        if (new Date(value) <= new Date()) {
          throw new Error('Closing date must be in the future');
        }
      }
    }
  },
  is_closed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_anonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  allow_multiple_votes: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'polls',
  indexes: [
    {
      fields: ['created_by']
    },
    {
      fields: ['is_closed']
    },
    {
      fields: ['closing_date']
    }
  ]
});

// Define associations
Poll.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Instance method to check if poll is expired
Poll.prototype.isExpired = function() {
  return new Date() > this.closing_date;
};

// Instance method to close poll
Poll.prototype.close = function() {
  this.is_closed = true;
  return this.save();
};

// Instance method to reopen poll
Poll.prototype.reopen = function() {
  this.is_closed = false;
  return this.save();
};

// Instance method to get poll results
Poll.prototype.getResults = function() {
  return {
    id: this.id,
    title: this.title,
    description: this.description,
    options: this.options,
    closing_date: this.closing_date,
    is_closed: this.is_closed,
    is_anonymous: this.is_anonymous,
    allow_multiple_votes: this.allow_multiple_votes,
    created_by: this.created_by,
    created_at: this.created_at,
    updated_at: this.updated_at
  };
};

module.exports = Poll; 
