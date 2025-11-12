import React from 'react';
import { 
  ShoppingCart, 
  DollarSign, 
  MapPin, 
  Package, 
  Grid3x3, 
  CreditCard,
  TrendingUp,
  Users
} from 'lucide-react';

const SummaryCard = ({ title, value, icon: Icon, subtitle, trend }) => {
  return (
    <div className="bg-white border border-gray-300 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-3 text-xs text-gray-500">
              <TrendingUp size={12} className="mr-1" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className="bg-gray-100 p-3 border border-gray-200">
          <Icon size={20} className="text-gray-700" />
        </div>
      </div>
    </div>
  );
};

const SummaryCards = ({ overviewData, loading }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0}).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-2xl h-32"></div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Orders',
      value: formatNumber(overviewData.totalOrders),
      icon: ShoppingCart,
      subtitle: `Last ${overviewData.period} days`
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(overviewData.totalRevenue),
      icon: DollarSign,
      subtitle: `Avg: ${formatCurrency(overviewData.averageOrderValue)}`
    },
    {
      title: 'Top Hostel',
      value: overviewData.topHostel._id || 'N/A',
      icon: MapPin,
      subtitle: `${formatNumber(overviewData.topHostel.orderCount)} orders`
    },
    {
      title: 'Best Product',
      value: overviewData.topProduct._id?.productName || 'N/A',
      icon: Package,
      subtitle: `${formatNumber(overviewData.topProduct.totalQuantity)} units sold`
    },
    {
      title: 'Top Category',
      value: overviewData.topCategory._id?.categoryName || 'N/A',
      icon: Grid3x3,
      subtitle: `${formatNumber(overviewData.topCategory.orderCount)} orders`
    },
    {
      title: 'Payment Success Rate',
      value: `${overviewData.paymentSuccessRate}%`,
      icon: CreditCard,
      subtitle: 'Payment success rate'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <SummaryCard key={index} {...card} />
      ))}
    </div>
  );
};

export default SummaryCards;