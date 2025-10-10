import React, { useState } from 'react';
import { 
  Package, 
  Grid3x3, 
  MapPin, 
  ShoppingCart, 
  Eye, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';

const TableContainer = ({ title, children, icon: Icon }) => (
  <div className="bg-white border border-gray-300 shadow-sm overflow-hidden">
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center space-x-4">
        <Icon className="text-gray-700" size={18} />
        <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">{title}</h3>
      </div>
    </div>
    <div className="p-8">
      {children}
    </div>
  </div>
);

const TopProductsTable = ({ data, loading }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <TableContainer title="Top Selling Products" icon={Package}>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </TableContainer>
    );
  }

  return (
    <TableContainer title="Top Selling Products" icon={Package}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-semibold text-gray-700">Product</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-700">Sold</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-700">Orders</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((product, index) => (
              <tr key={product._id.productId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-2">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Package className="text-blue-600" size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {product._id.productName}
                      </p>
                      <p className="text-xs text-gray-500">Rank #{index + 1}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {product.totalQuantity}
                  </span>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="text-gray-700 font-medium">{product.orderCount}</span>
                </td>
                <td className="py-4 px-2 text-right">
                  <span className="text-gray-900 font-semibold">
                    {formatCurrency(product.totalRevenue)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableContainer>
  );
};

const TopCategoriesTable = ({ data, loading }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <TableContainer title="Category Performance" icon={Grid3x3}>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </TableContainer>
    );
  }

  return (
    <TableContainer title="Category Performance" icon={Grid3x3}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-semibold text-gray-700">Category</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-700">Orders</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-700">Quantity</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((category, index) => (
              <tr key={category._id.categoryId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-2">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Grid3x3 className="text-purple-600" size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {category._id.categoryName}
                      </p>
                      <p className="text-xs text-gray-500">Rank #{index + 1}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {category.totalOrders}
                  </span>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="text-gray-700 font-medium">{category.totalQuantity}</span>
                </td>
                <td className="py-4 px-2 text-right">
                  <span className="text-gray-900 font-semibold">
                    {formatCurrency(category.totalRevenue)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableContainer>
  );
};

const TopLocationsTable = ({ data, loading }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <TableContainer title="Top Locations" icon={MapPin}>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </TableContainer>
    );
  }

  return (
    <TableContainer title="Top Hostels by Orders" icon={MapPin}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-4 px-2 font-medium text-gray-900 text-xs uppercase tracking-wide">Hostel Name</th>
              <th className="text-center py-4 px-2 font-medium text-gray-900 text-xs uppercase tracking-wide">Orders</th>
              <th className="text-center py-4 px-2 font-medium text-gray-900 text-xs uppercase tracking-wide">Avg Order</th>
              <th className="text-right py-4 px-2 font-medium text-gray-900 text-xs uppercase tracking-wide">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((location, index) => (
              <tr key={location._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-2">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-2 rounded-full">
                      <MapPin className="text-orange-600" size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {location._id}
                      </p>
                      <p className="text-xs text-gray-500">Rank #{index + 1}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                    {location.orderCount}
                  </span>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="text-gray-700 font-medium">
                    {formatCurrency(location.averageOrderValue)}
                  </span>
                </td>
                <td className="py-4 px-2 text-right">
                  <span className="text-gray-900 font-semibold">
                    {formatCurrency(location.totalRevenue)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableContainer>
  );
};

const RecentOrdersTable = ({ data, loading }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      placed: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <TableContainer title="Recent Orders" icon={ShoppingCart}>
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </TableContainer>
    );
  }

  return (
    <TableContainer title="Recent Orders" icon={ShoppingCart}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-semibold text-gray-700">Order</th>
              <th className="text-left py-3 px-2 font-semibold text-gray-700">Customer</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-700">Status</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-700">Items</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((order) => (
              <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </td>
                <td className="py-4 px-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {order.userId?.name || 'Guest'}
                    </p>
                    <p className="text-xs text-gray-500">{order.deliveryLocation}</p>
                  </div>
                </td>
                <td className="py-4 px-2 text-center">
                  <div className="space-y-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                    <br />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-2 text-center">
                  <span className="text-gray-700 font-medium">
                    {order.cartItems?.length || 0}
                  </span>
                </td>
                <td className="py-4 px-2 text-right">
                  <span className="text-gray-900 font-semibold">
                    {formatCurrency(order.amount)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableContainer>
  );
};

const TablesSection = ({ 
  topProducts, 
  categoryData, 
  locationData, 
  recentOrders, 
  loading 
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <TopProductsTable data={topProducts} loading={loading} />
      <TopCategoriesTable data={categoryData} loading={loading} />
      <TopLocationsTable data={locationData} loading={loading} />
      <RecentOrdersTable data={recentOrders} loading={loading} />
    </div>
  );
};

export default TablesSection;