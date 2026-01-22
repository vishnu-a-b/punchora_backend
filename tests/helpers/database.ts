/**
 * Test Database Helper
 * Manages database connections and cleanup for tests
 */

import mongoose from 'mongoose';

// Test database URI - uses separate test database
const TEST_DB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/hrms-test';

/**
 * Connect to test database
 */
export const connectTestDB = async (): Promise<void> => {
  try {
    await mongoose.connect(TEST_DB_URI);
    console.log('✅ Connected to test database');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    throw error;
  }
};

/**
 * Disconnect from test database
 */
export const disconnectTestDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('✅ Disconnected from test database');
  } catch (error) {
    console.error('❌ Test database disconnection failed:', error);
    throw error;
  }
};

/**
 * Clear all collections in test database
 */
export const clearTestDB = async (): Promise<void> => {
  try {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }

    console.log('✅ Test database cleared');
  } catch (error) {
    console.error('❌ Test database clear failed:', error);
    throw error;
  }
};

/**
 * Create a clean test database for each test suite
 */
export const setupTestDB = () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });
};
