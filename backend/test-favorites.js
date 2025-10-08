import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const testFavoritesAPI = async () => {
  try {
    console.log('🧪 Testing Favorites API...\n');
    
    // Test without authentication
    console.log('1. Testing favorites endpoint without auth...');
    try {
      const response = await axios.get(`${API_URL}/users/favorites`);
      console.log('❌ ERROR: Should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ PASS: Correctly requires authentication');
      } else {
        console.log('❓ UNEXPECTED:', error.response?.status, error.message);
      }
    }
    
    // Test with a sample token (you'll need to replace this)
    console.log('\n2. Testing with authentication token...');
    const token = 'YOUR_FIREBASE_TOKEN_HERE'; // Replace with actual token
    
    if (token !== 'YOUR_FIREBASE_TOKEN_HERE') {
      try {
        const response = await axios.get(`${API_URL}/users/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ PASS: Favorites API responded successfully');
        console.log('Response:', JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.log('❌ FAIL:', error.response?.status, error.response?.data || error.message);
      }
    } else {
      console.log('⚠️  SKIP: No token provided (replace YOUR_FIREBASE_TOKEN_HERE with actual token)');
    }
    
    console.log('\n🧪 Test completed');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testFavoritesAPI();