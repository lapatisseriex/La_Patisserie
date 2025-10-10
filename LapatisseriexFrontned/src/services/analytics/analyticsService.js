import axios from 'axios';
import { getAuth } from 'firebase/auth';

// Base URL configuration
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper function to get Firebase auth token
const getAuthHeaders = async () => {
  try {
    const auth = getAuth();
    if (auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken(true);
      return { Authorization: `Bearer ${idToken}` };
    }
    return {};
  } catch (error) {
    console.error('Error getting auth token:', error);
    return {};
  }
};

// Analytics API endpoints
export const analyticsService = {
  // Get dashboard overview
  getDashboardOverview: async (period = '30') => {
    const headers = await getAuthHeaders();
    return axios.get(`${BASE_URL}/analytics/overview?period=${period}`, { headers });
  },

  // Get orders trend
  getOrdersTrend: async (period = 'day', days = '30') => {
    const headers = await getAuthHeaders();
    return axios.get(`${BASE_URL}/analytics/orders-trend?period=${period}&days=${days}`, { headers });
  },

  // Get orders by location
  getOrdersByLocation: async (days = '30') => {
    const headers = await getAuthHeaders();
    return axios.get(`${BASE_URL}/analytics/orders-by-location?days=${days}`, { headers });
  },

  // Get top products
  getTopProducts: async (days = '30', limit = 10) => {
    const headers = await getAuthHeaders();
    return axios.get(`${BASE_URL}/analytics/top-products?days=${days}&limit=${limit}`, { headers });
  },

  // Get category performance
  getCategoryPerformance: async (days = '30') => {
    const headers = await getAuthHeaders();
    return axios.get(`${BASE_URL}/analytics/category-performance?days=${days}`, { headers });
  },

  // Get payment method breakdown
  getPaymentMethodBreakdown: async (days = '30') => {
    const headers = await getAuthHeaders();
    return axios.get(`${BASE_URL}/analytics/payment-methods?days=${days}`, { headers });
  },

  // Get recent orders
  getRecentOrders: async (limit = 10) => {
    const headers = await getAuthHeaders();
    return axios.get(`${BASE_URL}/analytics/recent-orders?limit=${limit}`, { headers });
  },

  // Get hostel performance
  getHostelPerformance: async (days = '30') => {
    const headers = await getAuthHeaders();
    return axios.get(`${BASE_URL}/analytics/hostel-performance?days=${days}`, { headers });
  },

  // Test hostel mapping
  testHostelMapping: async () => {
    const headers = await getAuthHeaders();
    return axios.get(`${BASE_URL}/analytics/test-hostels`, { headers });
  },
};

export default analyticsService;