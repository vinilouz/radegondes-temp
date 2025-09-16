require('dotenv').config({ path: '../.env' }); // Adjust path to .env
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Institution = require('../src/models/Institution');
const seedDatabase = require('../src/config/seedDatabase'); // This also needs to be checked/updated

async function resetAndSeed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await Category.deleteMany({});
    await Institution.deleteMany({});
    console.log('Data cleared');
    
    // Run seed again
    await seedDatabase();
    console.log('Seed executed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAndSeed();