import React, { useEffect, useMemo, useState } from 'react';
import { paymentsService, paymentsToCSV, downloadCSV } from '../../services/paymentsService';
import { toast } from 'react-toastify';
import { 
  FiSearch, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiRefreshCw, 
  FiDownload, 
  FiDatabase,
  FiFilter,
  FiCalendar,
  FiCreditCard,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiTruck
} from 'react-icons/fi';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';

const COD_REVENUE_STATUSES = ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
const EMPTY_METRICS = Object.freeze({
  totalPayments: 0,
  totalRevenue: 0,
  success: 0,
  pending: 0,
  cancelled: 0,
  successAmount: 0,
  pendingAmount: 0,
  cancelledAmount: 0,
  codDelivered: 0,
  codDeliveredAmount: 0
});
const normalizeMetrics = (input) => ({ ...EMPTY_METRICS, ...(input || {}) });

const StatCard = ({ title, value, tone = 'primary', subtitle, icon }) => {
  const tones = {
    primary: 'from-rose-500 to-pink-500',
    success: 'from-emerald-500 to-green-500',
    warning: 'from-amber-500 to-yellow-500',
    danger: 'from-red-500 to-rose-500',
  };
  return (
    <div className="p-4 rounded-xl bg-white shadow hover:shadow-md transition-shadow">
      <div className={`inline-flex items-center text-white text-xs font-semibold px-2 py-1 rounded-md bg-gradient-to-r ${tones[tone]} mb-2`}>
        {icon && <span className="mr-1">{icon}</span>}
        {title}
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
};

const PaymentFilters = ({
  filters,
  onChange,
  onRefresh,
  loading,
  onExport,
  total,
  onBackfill,
  backfilling,
  onQuickRange,
  selectedRange,
  hostels = []
}) => {
  const quickRanges = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 days', value: 'week' },
    { label: 'This Month', value: 'month' }
  ];
  const hostelOptions = Array.from(new Set((hostels || []).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quick range</span>
        {quickRanges.map(range => (
          <button
            key={range.value}
            onClick={() => onQuickRange && onQuickRange(range.value)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition ${selectedRange === range.value ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-rose-50'}`}
          >
            {range.label}
          </button>
        ))}
        <button
          onClick={() => onQuickRange && onQuickRange('')}
          className={`px-3 py-1.5 text-sm rounded-lg border transition ${!selectedRange ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          All time
        </button>
      </div>

      <div className="space-y-3">
        {/* Prominent Order/Payment Search Bar */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg border border-rose-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-rose-700 flex items-center">
              <FiSearch className="mr-2" />
              Payment & Order Search
            </div>
            <div className="text-xs text-rose-600">Search by payment ID, order number, or Razorpay payment ID</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by order number, payment ID, or Razorpay ID..."
                value={filters.search || ''}
                onChange={(e) => onChange({ search: e.target.value })}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
              />
            </div>
            <button
              onClick={() => onRefresh && onRefresh()}
              className="flex items-center justify-center px-6 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:ring-2 focus:ring-rose-500 transition-all"
            >
              <FiSearch className="mr-2" />
              Search Payments
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={filters.status || ''}
            onChange={e => onChange({ status: e.target.value })}
            className="px-3 py-2 border rounded-lg w-full"
          >
            <option value="">All Payment Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select
            value={filters.method || ''}
            onChange={e => onChange({ method: e.target.value })}
            className="px-3 py-2 border rounded-lg w-full"
          >
            <option value="">All Methods</option>
            <option value="razorpay">Razorpay</option>
            <option value="cod">Cash on Delivery (COD)</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="wallet">Wallet</option>
            <option value="netbanking">Netbanking</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={filters.orderStatus || ''}
            onChange={e => onChange({ orderStatus: e.target.value })}
            className="px-3 py-2 border rounded-lg w-full"
          >
            <option value="">All Order Status</option>
            <option value="cancelled">Cancelled</option>
            <option value="delivered">Delivered</option>
            <option value="out_for_delivery">Out for delivery</option>
            <option value="ready">Ready</option>
            <option value="preparing">Preparing</option>
            <option value="confirmed">Confirmed</option>
            <option value="placed">Placed</option>
            <option value="pending">Pending</option>
          </select>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={onRefresh} className="flex items-center px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition">
              <FiRefreshCw className="mr-2 h-4 w-4" />
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            <button onClick={onExport} className="flex items-center px-3 py-2 border rounded-lg hover:bg-gray-50">
              <FiDownload className="mr-2 h-4 w-4" />
              Export CSV ({total ?? 0})
            </button>
            <button onClick={onBackfill} disabled={backfilling} className="flex items-center px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
              <FiDatabase className="mr-2 h-4 w-4" />
              {backfilling ? 'Backfilling…' : 'Backfill'}
            </button>
          </div>
        </div>

        <div className="bg-rose-50 p-4 rounded-lg border-2 border-rose-200">
          <div className="text-sm font-semibold text-rose-700 mb-3 flex items-center">
            <FiSearch className="mr-2" />
            Search Filters
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <label className="text-xs text-gray-600 mb-1 flex items-center">
                  <HiOutlineOfficeBuilding className="mr-1" />
                  Hostel Name
                </label>
                <input
                  placeholder="Type hostel name..."
                  value={filters.hostel || ''}
                  onChange={e => onChange({ hostel: e.target.value })}
                  className="px-3 py-2 border rounded-lg w-full bg-white"
                  list="hostel-suggestions"
                />
                {hostelOptions.length > 0 && (
                  <datalist id="hostel-suggestions">
                    {hostelOptions.map(name => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 flex items-center">
                  <FiMail className="mr-1" />
                  Email Address
                </label>
                <input
                  placeholder="Type email..."
                  value={filters.email || ''}
                  onChange={e => onChange({ email: e.target.value })}
                  className="px-3 py-2 border rounded-lg w-full bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 flex items-center">
                  <FiPhone className="mr-1" />
                  Phone Number
                </label>
                <input
                  placeholder="Type phone..."
                  value={filters.phone || ''}
                  onChange={e => onChange({ phone: e.target.value })}
                  className="px-3 py-2 border rounded-lg w-full bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentsTable = ({ items, onMarkPaid, onView }) => {
  const resolveBadge = (payment) => {
    if (payment.data?.order?.orderStatus === 'cancelled') {
      return { label: 'cancelled', tone: 'bg-red-100 text-red-700' };
    }
    if (payment.paymentStatus === 'success') {
      return { label: 'success', tone: 'bg-green-100 text-green-700' };
    }
    if (
      payment.paymentMethod === 'cod' &&
      payment.data?.order?.orderStatus &&
      ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(payment.data.order.orderStatus)
    ) {
      return { label: 'cod-confirmed', tone: 'bg-blue-100 text-blue-700' };
    }
    if (payment.paymentStatus === 'pending') {
      return { label: 'pending', tone: 'bg-yellow-100 text-yellow-700' };
    }
    if (payment.paymentStatus === 'failed') {
      return { label: 'failed', tone: 'bg-red-100 text-red-700' };
    }
    return { label: payment.paymentStatus || 'unknown', tone: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="overflow-auto rounded-xl border border-gray-100">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Order</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Customer</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Method</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Hostel</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Delivery</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(p => {
            const badge = resolveBadge(p);
            return (
              <tr key={p._id} className="hover:bg-rose-50/40 transition">
                <td className="px-4 py-3 text-sm text-gray-700">{new Date(p.date || p.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm font-mono text-gray-800">
                  <div>{p.orderId}</div>
                  {p.gatewayPaymentId && (
                    <div className="text-xs text-gray-500">Gateway: {p.gatewayPaymentId}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="font-semibold text-gray-800">{p.customerName || '—'}</div>
                  <div className="text-xs text-gray-500">{p.email || '—'}</div>
                  {p.phone && <div className="text-xs text-gray-500">{p.phone}</div>}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{Number(p.amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm capitalize">{p.paymentMethod}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${badge.tone}`}>
                      {badge.label}
                    </span>
                    {p.data?.order?.paymentStatus && (
                      <div className="text-xs text-gray-500">Order payment: {p.data.order.paymentStatus}</div>
                    )}
                    {p.data?.order?.orderStatus && (
                      <div className="text-xs text-gray-500">Order: {p.data.order.orderStatus}</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {p.hostelName || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {p.deliveryLocationLabel || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-right space-x-2 whitespace-nowrap">
                  <button
                    onClick={() => onView && onView(p)}
                    className="px-3 py-1 rounded-md border hover:bg-gray-50 text-xs"
                  >
                    View
                  </button>
                  {p.paymentStatus === 'pending' && p.data?.order?.orderStatus !== 'cancelled' && (
                    <button
                      onClick={() => onMarkPaid && onMarkPaid(p)}
                      className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const AdminPayments = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    method: '',
    orderStatus: '',
    orderPaymentStatus: '',
    startDate: '',
    endDate: '',
    deliveryLocation: '',
    hostel: '',
    search: '',
    quickRange: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [backfilling, setBackfilling] = useState(false);
  const [viewing, setViewing] = useState(null); // { loading, data }
  const [availableHostels, setAvailableHostels] = useState([]);
  const [serverMetrics, setServerMetrics] = useState({ filtered: EMPTY_METRICS, last7Days: EMPTY_METRICS });
  const [hasServerMetrics, setHasServerMetrics] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError('');
    const { quickRange, ...queryFilters } = filters;
    console.log('[Payments] Fetching with filters:', { ...queryFilters, quickRange });
    try {
      const { items: data, pagination: p, metadata } = await paymentsService.list(queryFilters);
      console.log('[Payments] Response:', { items: data, pagination: p, metadata });
      setItems(data || []);
      if (p) setPagination(p);
      if (metadata) {
        setServerMetrics({
          filtered: normalizeMetrics(metadata?.metrics?.filtered),
          last7Days: normalizeMetrics(metadata?.metrics?.last7Days)
        });
        const hostelsList = Array.isArray(metadata?.hostelsAll) && metadata.hostelsAll.length
          ? metadata.hostelsAll
          : Array.isArray(metadata?.hostels) ? metadata.hostels : [];
        const sortedHostels = Array.from(new Set(hostelsList.filter(Boolean))).sort((a, b) => a.localeCompare(b));
        setAvailableHostels(sortedHostels);
        setHasServerMetrics(Boolean(metadata?.metrics));
      } else {
        setServerMetrics({ filtered: EMPTY_METRICS, last7Days: EMPTY_METRICS });
        setAvailableHostels([]);
        setHasServerMetrics(false);
      }
      console.log('[Payments] Items count:', (data || []).length);
    } catch (e) {
      console.error('Failed to load payments', e);
      console.log('[Payments] Error details:', {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message
      });
      const status = e?.response?.status;
      if (status === 401) setError('Authentication required. Please login.');
      else if (status === 403) setError('Admin access required to view payments.');
      else if (status === 404) setError('Payments endpoint not found. Make sure backend is running.');
      else setError(e?.message || 'Failed to load payments.');
      setServerMetrics({ filtered: EMPTY_METRICS, last7Days: EMPTY_METRICS });
      setAvailableHostels([]);
      setHasServerMetrics(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // simple polling as real-time: refresh every 20s
    const id = setInterval(refresh, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.page,
    filters.limit,
    filters.status,
    filters.method,
    filters.orderStatus,
    filters.orderPaymentStatus,
    filters.startDate,
    filters.endDate,
    filters.deliveryLocation,
    filters.hostel,
    filters.search,
    filters.email,
    filters.phone
  ]);

  // Debug: log items whenever they change
  useEffect(() => {
    console.log('[Payments] Items changed:', items);
  }, [items]);

  const fallbackMetrics = useMemo(() => {
    const totalPayments = items.length;
    
    // For revenue calculation:
    // - Include successful payments that are not cancelled
    // - Include COD orders that are placed/confirmed/delivered (not cancelled)
    const totalRevenue = items
      .filter(i => {
        const isCancelled = i.data?.order?.orderStatus === 'cancelled';
        if (isCancelled) return false;

        if (i.paymentStatus === 'success') return true;

        if (i.paymentMethod === 'cod' && i.data?.order?.orderStatus &&
            COD_REVENUE_STATUSES.includes(i.data.order.orderStatus)) {
          return true;
        }

        return false;
      })
      .reduce((a, c) => a + Number(c.amount || 0), 0);

    const successItems = items.filter(i => i.paymentStatus === 'success');
    const pendingItems = items.filter(i => i.paymentStatus === 'pending' && i.data?.order?.orderStatus !== 'cancelled');
    const cancelledItems = items.filter(i => i.data?.order?.orderStatus === 'cancelled' || i.paymentStatus === 'failed');
    const codDeliveredItems = items.filter(i => i.paymentMethod === 'cod' && i.data?.order?.orderStatus === 'delivered');

    const success = successItems.length;
    const pending = pendingItems.length;
    const cancelled = cancelledItems.length;
    const codDelivered = codDeliveredItems.length;

    const successAmount = successItems.reduce((a, c) => a + Number(c.amount || 0), 0);
    const pendingAmount = pendingItems.reduce((a, c) => a + Number(c.amount || 0), 0);
    const cancelledAmount = cancelledItems.reduce((a, c) => a + Number(c.amount || 0), 0);
    const codDeliveredAmount = codDeliveredItems.reduce((a, c) => a + Number(c.amount || 0), 0);

    return {
      totalPayments,
      totalRevenue,
      success,
      pending,
      cancelled,
      successAmount,
      pendingAmount,
      cancelledAmount,
      codDelivered,
      codDeliveredAmount
    };
  }, [items]);

  const filteredMetrics = hasServerMetrics ? serverMetrics.filtered : fallbackMetrics;

  const onChange = (patch) => setFilters(prev => ({ ...prev, ...patch, page: 1 }));

  const toInputDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    // Format as YYYY-MM-DD for input[type="date"]
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleQuickRange = (range) => {
    if (!range) {
      setFilters(prev => ({
        ...prev,
        quickRange: '',
        startDate: '',
        endDate: '',
        page: 1
      }));
      return;
    }

    // Use current date in local timezone
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let start, end;

    if (range === 'today') {
      start = new Date(today);
      end = new Date(today);
    } else if (range === 'week') {
      start = new Date(today);
      start.setDate(start.getDate() - 6);
      end = new Date(today);
    } else if (range === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today);
    }

    console.log('Setting date range:', { range, start, end, startFormatted: toInputDate(start), endFormatted: toInputDate(end) });

    setFilters(prev => ({
      ...prev,
      quickRange: range,
      startDate: toInputDate(start),
      endDate: toInputDate(end),
      page: 1
    }));
  };

  const exportCSV = () => {
    const csv = paymentsToCSV(items);
    downloadCSV(csv, 'payments.csv');
  };

  const backfill = async () => {
    try {
      setBackfilling(true);
      const res = await paymentsService.backfill({ dryRun: false });
      console.log('[Payments] Backfill result:', res);
      toast.success(`Backfill done: created ${res.created}, updated ${res.updated}, skipped ${res.skipped}`);
      await refresh();
    } catch (e) {
      console.error('Backfill failed', e);
      console.log('[Payments] Backfill error:', {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message
      });
      toast.error(e?.response?.data?.message || e?.message || 'Backfill failed');
    } finally {
      setBackfilling(false);
    }
  };

  const openView = async (p) => {
    try {
      setViewing({ loading: true, data: null });
      const detail = await paymentsService.getById(p._id);
      setViewing({ loading: false, data: detail });
    } catch (e) {
      console.error('View payment failed', e);
      toast.error('Failed to load payment details');
      setViewing(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Payments</h2>

      {error && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          {error}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard 
          title="Total Payments" 
          value={filteredMetrics.totalPayments} 
          subtitle={`₹${Number(filteredMetrics.totalRevenue || 0).toFixed(2)} total amount`} 
          icon={<FiDollarSign className="h-3 w-3" />}
        />
        <StatCard 
          title="Success" 
          value={filteredMetrics.success} 
          tone="success" 
          subtitle={`₹${Number(filteredMetrics.successAmount || 0).toFixed(2)} confirmed`}
          icon={<FiCheckCircle className="h-3 w-3" />}
        />
        <StatCard 
          title="Pending" 
          value={filteredMetrics.pending} 
          tone="warning" 
          subtitle={`₹${Number(filteredMetrics.pendingAmount || 0).toFixed(2)} awaiting`}
          icon={<FiClock className="h-3 w-3" />}
        />
        <StatCard 
          title="Cancelled/Failed" 
          value={filteredMetrics.cancelled} 
          tone="danger" 
          subtitle={`₹${Number(filteredMetrics.cancelledAmount || 0).toFixed(2)} cancelled`}
          icon={<FiXCircle className="h-3 w-3" />}
        />
        <StatCard 
          title="COD Delivered" 
          value={filteredMetrics.codDelivered || 0} 
          tone="primary" 
          subtitle={`₹${Number(filteredMetrics.codDeliveredAmount || 0).toFixed(2)} delivered`}
          icon={<FiTruck className="h-3 w-3" />}
        />
      </div>

      <PaymentFilters
        filters={filters}
        onChange={onChange}
        onRefresh={refresh}
        loading={loading}
        onExport={exportCSV}
        total={pagination.total}
        onBackfill={backfill}
        backfilling={backfilling}
        onQuickRange={handleQuickRange}
        selectedRange={filters.quickRange}
        hostels={availableHostels}
      />

      {items.length === 0 && !loading ? (
        <div className="p-8 text-center border border-dashed rounded-xl bg-white">
          <p className="text-gray-600 mb-4">No payments to display.</p>
          <p className="text-sm text-gray-500 mb-6">If you already have Orders, run a one-time backfill to copy them into Payments.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={backfill} disabled={backfilling} className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50">
              {backfilling ? 'Backfilling…' : 'Backfill from Orders'}
            </button>
            <button onClick={refresh} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Refresh</button>
          </div>
        </div>
      ) : (
        <PaymentsTable
          items={items}
          onView={openView}
          onMarkPaid={async (p) => {
            try {
              await paymentsService.updateStatus(p._id, 'success');
              toast.success(`Marked order ${p.orderId} as Paid`);
              await refresh();
            } catch (e) {
              console.error('Mark paid failed', e);
              toast.error(e?.response?.data?.message || 'Failed to update payment');
            }
          }}
        />
      )}

      {/* Enhanced Payment Details Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[999] pt-10">
          <div className="bg-white rounded-lg w-full max-w-[95vw] lg:max-w-5xl h-[calc(100vh-5rem)] shadow-2xl flex flex-col mx-4">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <FiCreditCard className="text-xl text-blue-600" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Payment Details - Order #{viewing?.data?.payment?.orderId}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {viewing?.data?.payment?.date ? 
                      new Date(viewing.data.payment.date).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 
                      'Date not available'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiXCircle className="text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                
                {viewing.loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading payment details...</span>
                  </div>
                ) : (
                  <div className="space-y-8">
                    
                    {/* Payment Status Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      
                      {/* Payment Status */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Status</h4>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          viewing?.data?.payment?.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                          viewing?.data?.payment?.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {viewing?.data?.payment?.paymentStatus === 'paid' ? <FiCheckCircle className="mr-1" /> :
                           viewing?.data?.payment?.paymentStatus === 'failed' ? <FiXCircle className="mr-1" /> :
                           <FiClock className="mr-1" />}
                          {viewing?.data?.payment?.paymentStatus?.toUpperCase()}
                        </span>
                      </div>

                      {/* Payment Method */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Method</h4>
                        <span className="flex items-center text-sm font-medium text-gray-900">
                          <FiCreditCard className="mr-2" />
                          {viewing?.data?.payment?.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                        </span>
                      </div>

                      {/* Amount */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Amount</h4>
                        <span className="text-lg font-bold text-gray-900">
                          ₹{Number(viewing?.data?.payment?.amount || 0).toFixed(2)}
                        </span>
                      </div>

                      {/* Order Status */}
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Order Status</h4>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          viewing?.data?.order?.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                          viewing?.data?.order?.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                          viewing?.data?.order?.orderStatus === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          <FiTruck className="mr-1" />
                          {viewing?.data?.order?.orderStatus?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>
                    </div>

                    {/* Customer and Payment Info Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Customer Information */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <FiMail className="mr-2 text-blue-600" />
                          Customer Information
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Name:</span>
                            <span className="text-gray-900">{viewing?.data?.payment?.userId?.name || viewing?.data?.order?.userDetails?.name || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Email:</span>
                            <span className="text-gray-900">{viewing?.data?.payment?.userId?.email || viewing?.data?.payment?.email || viewing?.data?.order?.userDetails?.email || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Phone:</span>
                            <span className="text-gray-900">{viewing?.data?.payment?.userId?.phone || viewing?.data?.order?.userDetails?.phone || 'N/A'}</span>
                          </div>
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex items-start justify-between">
                              <span className="font-medium text-gray-700">Location:</span>
                              <div className="text-right">
                                <p className="text-gray-900">
                                  {viewing?.data?.location?.area ? `${viewing?.data?.location?.area}, ` : ''}
                                  {viewing?.data?.location?.city || viewing?.data?.order?.deliveryLocation || 'N/A'}
                                  {viewing?.data?.location?.pincode ? ` - ${viewing?.data?.location?.pincode}` : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Transaction Info */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <FiDollarSign className="mr-2 text-green-600" />
                          Transaction Details
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Order ID:</span>
                            <span className="text-gray-900 font-mono text-sm">{viewing?.data?.payment?.orderId}</span>
                          </div>
                          {viewing?.data?.order?.razorpayOrderId && (
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Razorpay Order ID:</span>
                              <span className="text-gray-600 font-mono text-xs">{viewing?.data?.order?.razorpayOrderId}</span>
                            </div>
                          )}
                          {viewing?.data?.order?.razorpayPaymentId && (
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Payment ID:</span>
                              <span className="text-gray-600 font-mono text-xs">{viewing?.data?.order?.razorpayPaymentId}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Payment Date:</span>
                            <span className="text-gray-900">
                              {new Date(viewing?.data?.payment?.date || viewing?.data?.payment?.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Total Amount:</span>
                              <span className="text-lg font-bold text-gray-900">₹{Number(viewing?.data?.payment?.amount || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    {viewing?.data?.order?.cartItems && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <FiDatabase className="mr-2 text-purple-600" />
                          Order Items ({viewing?.data?.order?.cartItems?.length || 0})
                        </h4>
                        
                        <div className="space-y-4 max-h-64 overflow-y-auto">
                          {viewing?.data?.order?.cartItems?.map((item, index) => (
                            <div key={index} className="bg-white rounded-lg p-4 border shadow-sm">
                              <div className="flex items-center gap-4">
                                
                                {/* Product Image */}
                                <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                                  <img
                                    src={item.productImage || '/vite.svg'}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 truncate">{item.productName || 'Product'}</div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                    <span>Qty: {item.quantity}</span>
                                    <span>₹{Number(item.price || 0).toFixed(2)} each</span>
                                  </div>
                                  {item.dispatchStatus && (
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                      item.dispatchStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                      item.dispatchStatus === 'dispatched' ? 'bg-purple-100 text-purple-800' :
                                      'bg-orange-100 text-orange-800'
                                    }`}>
                                      {item.dispatchStatus?.toUpperCase()}
                                    </span>
                                  )}
                                </div>

                                {/* Total */}
                                <div className="text-right">
                                  <div className="text-lg font-bold text-gray-900">
                                    ₹{Number((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setViewing(null)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <button disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))} className="px-3 py-2 border rounded-lg disabled:opacity-50">Prev</button>
        <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages || 1}</span>
        <button disabled={pagination.page >= pagination.pages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))} className="px-3 py-2 border rounded-lg disabled:opacity-50">Next</button>
      </div>
    </div>
  );
};

export default AdminPayments;
