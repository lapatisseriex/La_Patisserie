import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';

const ChartContainer = ({ title, children, icon: Icon }) => (
  <div className="bg-white border border-gray-300 shadow-sm p-8">
    <div className="flex items-center space-x-4 mb-8 border-b border-gray-200 pb-4">
      <Icon className="text-gray-700" size={18} />
      <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
);

const OrdersTrendChart = ({ data, loading }) => {
  if (loading) {
    return (
      <ChartContainer title="Orders Trend" icon={TrendingUp}>
        <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>
      </ChartContainer>
    );
  }

  const formatData = data.map(item => ({
    ...item,
    date: format(new Date(item.date), 'MMM dd'),
    orders: item.orders,
    revenue: item.revenue
  }));

  return (
    <ChartContainer title="Orders & Revenue Trend" icon={TrendingUp}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formatData}>
          <CartesianGrid strokeDasharray="1 1" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis 
            yAxisId="orders"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis 
            yAxisId="revenue"
            orientation="right"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => [
              name === 'orders' ? value : `₹${value.toLocaleString()}`,
              name === 'orders' ? 'Orders' : 'Revenue'
            ]}
          />
          <Legend />
          <Line
            yAxisId="orders"
            type="monotone"
            dataKey="orders"
            stroke="#1f2937"
            strokeWidth={2}
            dot={{ fill: '#1f2937', strokeWidth: 1, r: 3 }}
            activeDot={{ r: 4, fill: '#1f2937' }}
            name="Orders"
          />
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="#6b7280"
            strokeWidth={2}
            dot={{ fill: '#6b7280', strokeWidth: 1, r: 3 }}
            activeDot={{ r: 4, fill: '#6b7280' }}
            name="Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

const LocationOrdersChart = ({ data, loading }) => {
  if (loading) {
    return (
      <ChartContainer title="Orders by Location" icon={MapPin}>
        <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>
      </ChartContainer>
    );
  }

  const topLocations = data.slice(0, 8).map(item => ({
    ...item,
    displayName: item._id.length > 15 ? item._id.substring(0, 15) + '...' : item._id
  }));

  return (
    <ChartContainer title="Top Hostels by Orders" icon={MapPin}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={topLocations} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
          <CartesianGrid strokeDasharray="1 1" stroke="#e5e7eb" />
          <XAxis 
            dataKey="displayName" 
            tick={{ fontSize: 9, fill: '#6b7280' }}
            tickLine={false}
            angle={-30}
            textAnchor="end"
            height={100}
            axisLine={{ stroke: '#d1d5db' }}
            interval={0}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => [
              name === 'orderCount' ? value : `₹${value.toLocaleString()}`,
              name === 'orderCount' ? 'Orders' : 'Revenue'
            ]}
            labelFormatter={(label) => {
              const fullName = topLocations.find(item => item.displayName === label)?._id || label;
              return `Hostel: ${fullName}`;
            }}
          />
          <Legend />
          <Bar 
            dataKey="orderCount" 
            fill="#1f2937" 
            name="Orders"
          />
          <Bar 
            dataKey="totalRevenue" 
            fill="#6b7280" 
            name="Revenue"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

const CategoryDistributionChart = ({ data, loading }) => {
  if (loading) {
    return (
      <ChartContainer title="Category Distribution" icon={PieIcon}>
        <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>
      </ChartContainer>
    );
  }

  // Handle empty or undefined data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <ChartContainer title="Revenue by Category" icon={PieIcon}>
        <div className="h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <PieIcon size={48} className="mx-auto mb-2 opacity-50" />
            <p>No category data available</p>
          </div>
        </div>
      </ChartContainer>
    );
  }

  const colors = ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6'];
  
  const pieData = data.map((item, index) => ({
    name: item._id?.categoryName || 'Unknown Category',
    value: item.totalRevenue || 0,
    orders: item.totalOrders || 0,
    fill: colors[index % colors.length]
  })).filter(item => item.value > 0); // Filter out zero values

  // Debug logging
  console.log('Category data received:', data);
  console.log('Processed pie data:', pieData);

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show labels for slices less than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartContainer title="Revenue by Category" icon={PieIcon}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => [`₹${value.toLocaleString()}`, 'Revenue']}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

const RevenueAreaChart = ({ data, loading }) => {
  if (loading) {
    return (
      <ChartContainer title="Revenue Growth" icon={Activity}>
        <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>
      </ChartContainer>
    );
  }

  const formatData = data.map(item => ({
    ...item,
    date: format(new Date(item.date), 'MMM dd'),
    revenue: item.revenue
  }));

  return (
    <ChartContainer title="Revenue Growth Over Time" icon={Activity}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formatData}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

const PaymentMethodChart = ({ data, loading }) => {
  if (loading) {
    return (
      <ChartContainer title="Payment Methods" icon={BarChart3}>
        <div className="h-80 bg-gray-100 animate-pulse rounded-lg"></div>
      </ChartContainer>
    );
  }

  // Handle empty or undefined data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <ChartContainer title="Payment Method Distribution" icon={BarChart3}>
        <div className="h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
            <p>No payment data available</p>
          </div>
        </div>
      </ChartContainer>
    );
  }

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  
  const pieData = data.map((item, index) => ({
    name: item._id === 'cod' ? 'Cash on Delivery' : 'Razorpay',
    value: item.totalOrders,
    revenue: item.totalRevenue,
    successRate: item.successRate,
    fill: colors[index % colors.length]
  }));

  return (
    <ChartContainer title="Payment Method Distribution" icon={BarChart3}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name, props) => [
              value,
              'Orders',
              <div key="extra">
                <div>Revenue: ₹{props.payload.revenue.toLocaleString()}</div>
                <div>Success Rate: {props.payload.successRate.toFixed(1)}%</div>
              </div>
            ]}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Hostel Performance Chart
const HostelPerformanceChart = ({ data, loading }) => {
  if (loading) {
    return (
      <ChartContainer title="Hostel Performance" icon={MapPin}>
        <div className="h-80 bg-gray-100 animate-pulse"></div>
      </ChartContainer>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <ChartContainer title="Hostel Performance Analytics" icon={MapPin}>
        <div className="h-80 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <MapPin size={48} className="mx-auto mb-2 opacity-50" />
            <p>No hostel data available</p>
          </div>
        </div>
      </ChartContainer>
    );
  }

  const topHostels = data.slice(0, 10);

  return (
    <ChartContainer title="Top Performing Hostels" icon={MapPin}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={topHostels} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
          <CartesianGrid strokeDasharray="1 1" stroke="#e5e7eb" />
          <XAxis 
            dataKey="_id" 
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={100}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => {
              if (name === 'totalRevenue') return [`₹${value.toLocaleString()}`, 'Revenue'];
              if (name === 'averageOrderValue') return [`₹${value.toFixed(0)}`, 'Avg Order Value'];
              if (name === 'completionRate') return [`${value.toFixed(1)}%`, 'Completion Rate'];
              return [value, name];
            }}
          />
          <Legend />
          <Bar 
            dataKey="totalOrders" 
            fill="#1f2937" 
            name="Total Orders"
          />
          <Bar 
            dataKey="completedOrders" 
            fill="#6b7280" 
            name="Completed Orders"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

const ChartsSection = ({ trendData, locationData, categoryData, paymentData, hostelData, loading }) => {
  return (
    <div className="space-y-8 mb-8">
      {/* Main trend chart - full width */}
      <OrdersTrendChart data={trendData} loading={loading} />
      
      {/* Revenue area chart - full width */}
      <RevenueAreaChart data={trendData} loading={loading} />
      
      {/* Two column charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <LocationOrdersChart data={locationData} loading={loading} />
        <CategoryDistributionChart data={categoryData} loading={loading} />
      </div>
      
      {/* Hostel Performance chart - full width */}
      <HostelPerformanceChart data={hostelData} loading={loading} />
      
      {/* Payment method chart */}
      <PaymentMethodChart data={paymentData} loading={loading} />
    </div>
  );
};

export default ChartsSection;