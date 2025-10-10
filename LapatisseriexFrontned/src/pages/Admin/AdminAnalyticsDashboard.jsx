import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

import FilterControls from '../../components/Admin/FilterControls';
import SummaryCards from '../../components/Admin/SummaryCards';
import ChartsSection from '../../components/Admin/Charts';
import TablesSection from '../../components/Admin/TablesSection';

// Import analytics service
import { analyticsService } from '../../services/analytics/analyticsService';
import { useAuth } from '../../hooks/useAuth';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const AdminAnalyticsDashboard = () => {
  const { user } = useAuth();

  // State for data
  const [overviewData, setOverviewData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [hostelData, setHostelData] = useState([]);

  // State for UI
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedTrendPeriod, setSelectedTrendPeriod] = useState('day');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Auto-refresh interval (5 minutes)
  const REFRESH_INTERVAL = 5 * 60 * 1000;

  // Wait for Firebase auth to be ready
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Fetch all analytics data
  const fetchAnalyticsData = useCallback(async () => {
    // Only proceed if auth is ready and we have user
    if (!authReady || !user) {
      return;
    }

    if (user.role !== 'admin') {
      setError("Unauthorized access");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        overviewResponse,
        trendResponse,
        locationResponse,
        productsResponse,
        categoryResponse,
        paymentResponse,
        ordersResponse,
        hostelResponse
      ] = await Promise.all([
        analyticsService.getDashboardOverview(selectedPeriod),
        analyticsService.getOrdersTrend(selectedTrendPeriod, selectedPeriod),
        analyticsService.getOrdersByLocation(selectedPeriod),
        analyticsService.getTopProducts(selectedPeriod, 10),
        analyticsService.getCategoryPerformance(selectedPeriod),
        analyticsService.getPaymentMethodBreakdown(selectedPeriod),
        analyticsService.getRecentOrders(10),
        analyticsService.getHostelPerformance(selectedPeriod)
      ]);

      // Update state with fetched data
      console.log('Frontend - Overview data:', overviewResponse.data.data);
      console.log('Frontend - Location data:', locationResponse.data.data);
      console.log('Frontend - Hostel data:', hostelResponse.data.data);
      
      setOverviewData(overviewResponse.data.data);
      setTrendData(trendResponse.data.data);
      setLocationData(locationResponse.data.data);
      setTopProducts(productsResponse.data.data);
      setCategoryData(categoryResponse.data.data);
      setPaymentData(paymentResponse.data.data);
      setRecentOrders(ordersResponse.data.data);
      setHostelData(hostelResponse.data.data);

      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Failed to load analytics data. Please try again.');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [authReady, user, selectedPeriod, selectedTrendPeriod]);

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchAnalyticsData]);

  // Manual refresh
  const handleRefresh = () => {
    fetchAnalyticsData();
    toast.success('Analytics data refreshed!');
  };

  // Loading state while auth is initializing
  if (!authReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-700 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="bg-white border border-gray-300 p-8 text-center max-w-md">
          <AlertCircle className="text-gray-600 mx-auto mb-4" size={32} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 text-sm mb-6">Please login to access the admin analytics dashboard.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 text-sm font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Check if user is admin
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="bg-white border border-gray-300 p-8 text-center max-w-md">
          <AlertCircle className="text-gray-600 mx-auto mb-4" size={32} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unauthorized Access</h2>
          <p className="text-gray-600 text-sm mb-6">You need admin privileges to access this dashboard.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 text-sm font-medium"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-300 shadow-sm p-8 text-center max-w-md">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-lg font-medium text-gray-900 mb-2 uppercase tracking-wide">Error Loading Data</h2>
          <p className="text-gray-600 mb-6 text-sm">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 border border-gray-900 text-xs uppercase tracking-wide focus:outline-none"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 py-8">
        <div className="max-w-full mx-auto px-8">
          <div className="flex items-center space-x-4">
            <BarChart3 size={24} className="text-gray-700" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 uppercase tracking-wide">La Pâtisserie Analytics</h1>
              <p className="text-gray-600 text-sm mt-1">Business Intelligence Dashboard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-8 py-8">
        {/* Filter Controls */}
        <FilterControls
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          selectedTrendPeriod={selectedTrendPeriod}
          setSelectedTrendPeriod={setSelectedTrendPeriod}
          onRefresh={handleRefresh}
          loading={loading}
          lastUpdated={lastUpdated}
        />

        {/* Summary Cards */}
        {overviewData && (
          <SummaryCards 
            overviewData={overviewData} 
            loading={loading} 
          />
        )}

        {/* Charts Section */}
        <ChartsSection
          trendData={trendData}
          locationData={locationData}
          categoryData={categoryData}
          paymentData={paymentData}
          hostelData={hostelData}
          loading={loading}
        />

        {/* Tables Section */}
        <TablesSection
          topProducts={topProducts}
          categoryData={categoryData}
          locationData={locationData}
          recentOrders={recentOrders}
          loading={loading}
        />

        {/* Performance Insights */}
        <div className="mt-12 bg-white border-t-2 border-gray-200 pt-8">
          <div className="flex items-center space-x-3 mb-8">
            <TrendingUp className="text-gray-700" size={20} />
            <h3 className="text-lg font-medium text-gray-900 uppercase tracking-wide">Performance Insights</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white border border-gray-300 p-6">
              <h4 className="font-medium text-gray-900 mb-3 text-sm uppercase tracking-wide">Business Trends</h4>
              <p className="text-sm text-gray-600">
                Monitor your business growth with real-time order tracking and revenue analysis.
              </p>
            </div>
            
            <div className="bg-white border border-gray-300 p-6">
              <h4 className="font-medium text-gray-900 mb-3 text-sm uppercase tracking-wide">Smart Analytics</h4>
              <p className="text-sm text-gray-600">
                Understand customer preferences and optimize your product offerings accordingly.
              </p>
            </div>
            
            <div className="bg-white border border-gray-300 p-6">
              <h4 className="font-medium text-gray-900 mb-3 text-sm uppercase tracking-wide">Real-time Updates</h4>
              <p className="text-sm text-gray-600">
                Dashboard automatically refreshes every 5 minutes to show latest business metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-gray-200 pt-8 text-center text-gray-500 text-xs">
          <p>LA PÂTISSERIE ADMIN ANALYTICS DASHBOARD</p>
          <p className="mt-2">Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;