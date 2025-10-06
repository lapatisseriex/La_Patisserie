import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext/AuthContextRedux';
import OrderTrackingContent from '../components/Orders/OrderTrackingContent';

const OrderDetail = () => {
  const { orderId } = useParams(); // This will be orderNumber
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchOrderDetail();
  }, [orderId, user]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Authentication required');
      }

      // Use orderNumber in the API call (orderId param is actually orderNumber)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center mb-6">
            <Link 
              to="/profile"
              state={{ activeTab: 'orders' }}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to My Orders
            </Link>
          </div>
          <div className="bg-red-50 rounded-lg border border-red-200 p-8 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              {error || 'Order Not Found'}
            </h2>
            <p className="text-red-600 mb-4">
              We couldn't find the order you're looking for.
            </p>
            <Link 
              to="/profile"
              state={{ activeTab: 'orders' }}
              className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link 
            to="/profile"
            className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Order Tracking</h1>
        </div>
        
        {/* Render order details directly */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Order #{order.orderNumber}
            </h2>
            <p className="text-sm text-gray-500">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          
          <OrderTrackingContent order={order} />
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;