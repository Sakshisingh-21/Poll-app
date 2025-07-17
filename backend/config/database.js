const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

if (process.env.DATABASE_URL) {
  // Use PostgreSQL if DATABASE_URL is set
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  });
} else {
  // Use SQLite for local development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../dev.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true
    }
  });
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database Connected successfully.');
  } catch (error) {
    console.error('Unable to connect to database:', error);
    process.exit(1);
  }
};

const syncDatabase = async () => {
  try {
    // Use force: false to prevent dropping existing tables
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
}; 
