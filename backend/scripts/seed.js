const bcrypt = require('bcryptjs');
require('dotenv').config();

const { sequelize, testConnection, syncDatabase } = require('../config/database');
const User = require('../models/User');
const Poll = require('../models/Poll');

const seedData = async () => {
  try {
    // Connect to database
    await testConnection();
    await syncDatabase();
    
    // Clear existing data
    await User.destroy({ where: {} });
    await Poll.destroy({ where: {} });
    
    console.log('Cleared existing data');
    
    // Create admin user
    const adminUser = await User.create({
      name: 'admin',
      email: 'admin@example.com',
      password: 'AdminPass123',
      role: 'admin'
    });
    
    // Create regular user
    const regularUser = await User.create({
      name: 'user',
      email: 'user@example.com',
      password: 'UserPass123',
      role: 'user'
    });
    
    console.log('Created users');
    
    // Create sample polls
    const samplePolls = [
      {
        title: 'What is your favorite programming language?',
        description: 'Choose your preferred programming language for development',
        options: ['JavaScript', 'Python', 'Java', 'C++', 'Other'],
        created_by: adminUser.id,
        closing_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      {
        title: 'Which framework do you prefer for web development?',
        description: 'Select your favorite frontend framework',
        options: ['React', 'Vue.js', 'Angular', 'Svelte'],
        created_by: adminUser.id,
        closing_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      },
      {
        title: 'What is your preferred database?',
        description: 'Choose your preferred database system',
        options: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis'],
        created_by: adminUser.id,
        closing_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago (closed)
        is_closed: true
      }
    ];
    
    await Poll.bulkCreate(samplePolls);
    
    console.log('Created sample polls');
    console.log('\nSeed data created successfully!');
    console.log('\nSample users:');
    console.log('Admin - Email: admin@example.com, Password: AdminPass123');
    console.log('User - Email: user@example.com, Password: UserPass123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData(); 
