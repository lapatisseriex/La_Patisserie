import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { format, parseISO } from 'date-fns';

const ChartContainer = ({ title, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}
  >
    <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
    {children}
  </motion.div>
);

const OrdersTrendChart = ({ data, loading }) => {
  if (loading) {
    return (
      <ChartContainer title="Orders Trend">
        <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>
      </ChartContainer>
    );
  }

  const formattedData = data.map(item => ({
    ...item,
    date: format(parseISO(item.date), 'MMM dd')
  }));

  return (
    <ChartContainer title="Orders Trend Over Time">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
          <YAxis yAxisId="left" stroke="#64748b" fontSize={12} />
          <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="orders" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorOrders)"
            name="Orders"
            strokeWidth={2}
          />
          <Area 
            yAxisId="right"
            type="monotone" 
            dataKey="revenue" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorRevenue)"
            name="Revenue (₹)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

const LocationOrdersChart = ({ data, loading }) => {
  if (loading) {
    return (
      <ChartContainer title="Orders by Location">
        <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>
      </ChartContainer>
    );
  }

  const topLocations = data.slice(0, 10); // Show top 10 locations

  return (
    <ChartContainer title="Top Locations by Orders">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={topLocations} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" stroke="#64748b" fontSize={12} />
          <YAxis 
            type="category" 
            dataKey="_id" 
            stroke="#64748b" 
            fontSize={12}
            width={100}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Bar 
            dataKey="orderCount" 
            fill="#8b5cf6"
            radius={[0, 4, 4, 0]}
            name="Orders"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

const CategoryPerformanceChart = ({ data, loading }) => {
  if (loading) {
    return (
      <ChartContainer title="Category Performance">
        <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>
      </ChartContainer>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const formattedData = data.map(item => ({
    name: item._id.categoryName,
    value: item.totalRevenue,
    orders: item.totalOrders
  }));

  const renderLabel = (entry) => {
    const percent = ((entry.value / data.reduce((sum, item) => sum + item.totalRevenue, 0)) * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <ChartContainer title="Category Performance Distribution">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={[(value) => [`₹${new Intl.NumberFormat('en-IN').format(value)}`, 'Revenue']]}
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

const PaymentMethodChart = ({ data, loading }) => {
  if (loading) {
    return (
      <ChartContainer title="Payment Methods">
        <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>
      </ChartContainer>
    );
  }

  const formattedData = data.map(item => ({
    method: item._id === 'razorpay' ? 'Online' : 'Cash on Delivery',
    orders: item.totalOrders,
    revenue: item.totalRevenue,
    successRate: item.successRate.toFixed(1)
  }));

  return (
    <ChartContainer title="Payment Method Analysis">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="method" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Bar dataKey="orders" fill="#3b82f6" name="Orders" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

const ChartsSection = ({ 
  trendData, 
  locationData, 
  categoryData, 
  paymentData, 
  loading 
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div className="lg:col-span-2">
        <OrdersTrendChart data={trendData} loading={loading} />
      </div>
      <LocationOrdersChart data={locationData} loading={loading} />
      <CategoryPerformanceChart data={categoryData} loading={loading} />
      <div className="lg:col-span-2">
        <PaymentMethodChart data={paymentData} loading={loading} />
      </div>
    </div>
  );
};

export default ChartsSection;