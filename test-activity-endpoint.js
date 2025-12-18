// Quick test script to verify activity endpoints
const axios = require('axios');

const API_URL = 'http://localhost:3002/v1';

async function testActivityEndpoints() {
  console.log('Testing Activity Endpoints...\n');

  try {
    // Test 1: Check if activity route exists
    console.log('1. Testing GET /v1/activity/business (without auth)');
    try {
      const response = await axios.get(`${API_URL}/activity/business`);
      console.log('✓ Endpoint exists');
      console.log('Response:', response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ Endpoint exists (401 Unauthorized - auth required)');
      } else if (error.response?.status === 404) {
        console.log('✗ Endpoint NOT FOUND (404)');
        console.log('This means the route is not registered properly');
      } else {
        console.log(`Response status: ${error.response?.status}`);
        console.log('Error:', error.message);
      }
    }

    console.log('\n2. Testing GET /v1/activity/my-activities (without auth)');
    try {
      const response = await axios.get(`${API_URL}/activity/my-activities`);
      console.log('✓ Endpoint exists');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ Endpoint exists (401 Unauthorized - auth required)');
      } else if (error.response?.status === 404) {
        console.log('✗ Endpoint NOT FOUND (404)');
      } else {
        console.log(`Response status: ${error.response?.status}`);
      }
    }

    console.log('\n3. Testing GET /v1/activity/business-stats (without auth)');
    try {
      const response = await axios.get(`${API_URL}/activity/business-stats`);
      console.log('✓ Endpoint exists');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ Endpoint exists (401 Unauthorized - auth required)');
      } else if (error.response?.status === 404) {
        console.log('✗ Endpoint NOT FOUND (404)');
      } else {
        console.log(`Response status: ${error.response?.status}`);
      }
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testActivityEndpoints();
