import React from 'react';
import { Package, Clock, Truck, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrderCard = ({ order }) => {
  const getStatusIcon = (status) => {
    const icons = {
      'placed': <Package className="h-4 w-4 text-blue-500" />,
      'confirmed': <CheckCircle className="h-4 w-4 text-green-500" />,
      'preparing': <Clock className="h-4 w-4 text-yellow-500" />,
      'ready': <Package className="h-4 w-4 text-orange-500" />,
      'out_for_delivery': <Truck className="h-4 w-4 text-purple-500" />,
      'delivered': <CheckCircle className="h-4 w-4 text-green-600" />,
      'cancelled': <XCircle className="h-4 w-4 text-red-500" />
    };
    return icons[status] || <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'placed': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-green-100 text-green-800',
      'preparing': 'bg-yellow-100 text-yellow-800',
      'ready': 'bg-orange-100 text-orange-800',
      'out_for_delivery': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-200 text-green-900',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'placed': 'Order Placed',
      'confirmed': 'Order Confirmed',
      'preparing': 'Preparing',
      'ready': 'Ready for Pickup',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Link 
      to={`/orders/${order.orderNumber}`}
      className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-gray-300"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">
            Order #{order.orderNumber}
          </h4>
          <p className="text-sm text-gray-500">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900">
            ₹{order.orderSummary?.grandTotal || order.amount}
          </p>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
            {getStatusIcon(order.orderStatus)}
            {getStatusText(order.orderStatus)}
          </span>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          {order.cartItems?.length || 0} item{(order.cartItems?.length || 0) !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2 text-blue-500 font-medium">
          <span>View Details</span>
          <ExternalLink className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
};

export default OrderCard;