// Test script for WaveX chart publishing
// Run this with: node test-chart-publishing.js

const SERVER_URL = 'https://wavex-7f4p.onrender.com';

async function testServerConnection() {
  console.log('🔍 Testing server connection...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/test`);
    const data = await response.json();
    console.log('✅ Server is running:', data.message);
    return true;
  } catch (error) {
    console.error('❌ Server connection failed:', error.message);
    return false;
  }
}

async function testChartEndpoints() {
  console.log('\n📊 Testing chart endpoints...');
  
  try {
    // Test GET /api/charts
    const getResponse = await fetch(`${SERVER_URL}/api/charts`);
    const charts = await getResponse.json();
    console.log('✅ GET /api/charts works:', charts.length, 'charts found');
    
    // Test POST /api/charts (with sample data)
    const sampleChart = {
      title: 'Test Song',
      artist: 'Test Artist',
      difficulty: 'Easy',
      notes: [
        { time: 1.0, lane: 1 },
        { time: 1.5, lane: 2 },
        { time: 2.0, lane: 3 }
      ],
      mp3: '/songs/test-song.mp3',
      author: 'TestUser'
    };
    
    const postResponse = await fetch(`${SERVER_URL}/api/charts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleChart)
    });
    
    if (postResponse.ok) {
      const result = await postResponse.json();
      console.log('✅ POST /api/charts works:', result.success);
    } else {
      console.log('⚠️ POST /api/charts failed:', postResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Chart endpoints test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 WaveX Server Test Suite\n');
  
  const serverConnected = await testServerConnection();
  
  if (serverConnected) {
    await testChartEndpoints();
  }
  
  console.log('\n✨ Test suite completed!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  runTests();
} else {
  // Browser environment
  console.log('🌐 Run this in Node.js: node test-chart-publishing.js');
}
