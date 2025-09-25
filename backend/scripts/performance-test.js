#!/usr/bin/env node

/**
 * Performance monitoring script for La Patisserie API
 * This script tests API response times to identify bottlenecks
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const API_BASE_URL = process.env.API_URL || 'https://your-backend-url.vercel.app/api';

// Test endpoints
const endpoints = [
  { path: '/products?limit=10', name: 'Products List (10 items)' },
  { path: '/products?limit=20', name: 'Products List (20 items)' },
  { path: '/categories', name: 'Categories List' },
  { path: '/products?category=63f8b1234567890123456789', name: 'Products by Category' },
  { path: '/banners', name: 'Banners' },
  { path: '/time-settings/status', name: 'Shop Status' }
];

async function testEndpoint(endpoint) {
  const start = performance.now();
  
  try {
    const response = await axios.get(`${API_BASE_URL}${endpoint.path}`, {
      timeout: 30000
    });
    
    const end = performance.now();
    const duration = end - start;
    
    return {
      name: endpoint.name,
      duration: Math.round(duration),
      status: response.status,
      dataSize: JSON.stringify(response.data).length,
      success: true
    };
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    
    return {
      name: endpoint.name,
      duration: Math.round(duration),
      status: error.response?.status || 'ERROR',
      error: error.message,
      success: false
    };
  }
}

async function runPerformanceTest() {
  console.log('🚀 Starting API Performance Test...');
  console.log(`Testing: ${API_BASE_URL}`);
  console.log('=' * 50);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint.name}...`);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.name}: ${result.duration}ms (${result.status}) - ${(result.dataSize / 1024).toFixed(2)}KB`);
    } else {
      console.log(`❌ ${result.name}: ${result.duration}ms (${result.status}) - ${result.error}`);
    }
  }
  
  console.log('\n📊 Performance Summary:');
  console.log('=' * 50);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    const slowest = successful.reduce((max, r) => r.duration > max.duration ? r : max);
    const fastest = successful.reduce((min, r) => r.duration < min.duration ? r : min);
    
    console.log(`Average Response Time: ${Math.round(avgDuration)}ms`);
    console.log(`Fastest: ${fastest.name} (${fastest.duration}ms)`);
    console.log(`Slowest: ${slowest.name} (${slowest.duration}ms)`);
    console.log(`Success Rate: ${successful.length}/${results.length} (${Math.round(successful.length / results.length * 100)}%)`);
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed Requests: ${failed.length}`);
    failed.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
  }
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  console.log('=' * 50);
  
  const slowRequests = successful.filter(r => r.duration > 3000);
  if (slowRequests.length > 0) {
    console.log('⚠️  Slow requests detected (>3s):');
    slowRequests.forEach(r => console.log(`   - ${r.name}: ${r.duration}ms`));
    console.log('   Consider adding database indexes or caching');
  }
  
  const largResponses = successful.filter(r => r.dataSize > 100 * 1024); // >100KB
  if (largResponses.length > 0) {
    console.log('⚠️  Large responses detected (>100KB):');
    largResponses.forEach(r => console.log(`   - ${r.name}: ${(r.dataSize / 1024).toFixed(2)}KB`));
    console.log('   Consider pagination or response compression');
  }
  
  if (successful.every(r => r.duration < 2000)) {
    console.log('✅ All requests completed in under 2 seconds - Good performance!');
  }
}

// Run the test
runPerformanceTest().catch(console.error);