import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import OrderTrackingContent from '../components/Orders/OrderTrackingContent';
import webSocketService from '../services/websocketService';
import { getOrderExperienceInfo } from '../utils/orderExperience';

const OrderDetail = () => {
  const { orderId } = useParams(); // This will be orderNumber
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const orderExperience = useMemo(() => getOrderExperienceInfo(user), [user]);

  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`}});

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setOrder(data.order);
      setError(null);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchOrderDetail();
  }, [orderId, user, navigate, fetchOrderDetail]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const userId = user._id || user.uid || null;
    webSocketService.connect(userId);

    const handleOrderStatusUpdate = (update) => {
      if (update?.orderNumber === orderId) {
        fetchOrderDetail();
      }
    };

    webSocketService.onOrderStatusUpdate(handleOrderStatusUpdate);

    return () => {
      webSocketService.offOrderStatusUpdate(handleOrderStatusUpdate);
    };
  }, [user, orderId, fetchOrderDetail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="w-16 h-16 border-2 border-gray-100 rounded-full"></div>
            <div 
              className="w-16 h-16 border-2 border-t-[#733857] rounded-full animate-spin absolute top-0 left-0"
              style={{ animationDuration: '0.8s' }}
            ></div>
          </div>
          <p className="text-sm" style={{ color: '#1a1a1a' }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link 
            to="/orders"
            className="inline-flex items-center mb-8 text-sm font-medium transition-colors duration-200"
            style={{ color: 'rgba(26, 26, 26, 0.6)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#733857'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(26, 26, 26, 0.6)'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>

          {/* Error State */}
          <div 
            className="border-l-2 border-red-500 bg-red-50 p-6"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
          >
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-medium text-red-800 mb-2">
                  {error || 'Order Not Found'}
                </h2>
                <p className="text-sm text-red-600 mb-4">
                  We couldn't find the order you're looking for.
                </p>
                <Link 
                  to="/orders"
                  className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%)' }}
                >
                  View All Orders
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link 
          to="/orders"
          className="inline-flex items-center mb-8 text-sm font-medium transition-colors duration-200"
          style={{ color: 'rgba(26, 26, 26, 0.6)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#733857'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(26, 26, 26, 0.6)'}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Link>

        {/* Page Title */}
        <div className="mb-8">
          <h1 
            className="text-3xl font-light tracking-tight mb-2"
            style={{ color: '#1a1a1a' }}
          >
            Order Tracking
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-sm" style={{ color: 'rgba(26, 26, 26, 0.5)' }}>
              Track your order and view details
            </p>
            <span
              className="text-xs font-semibold tracking-wide"
              style={{ color: orderExperience.color }}
            >
              {orderExperience.label}
            </span>
          </div>
        </div>
        
        {/* Order Tracking Content */}
        <OrderTrackingContent order={order} />
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default OrderDetail;