import api, { apiGet } from '../services/apiService';

const buildQuery = (params = {}) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) {
      usp.set(k, v);
    }
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
};

export const paymentsService = {
  // Admin: list all payments with filters
  list: async ({
    page = 1,
    limit = 20,
    status,
    method,
    startDate,
    endDate,
    search,
    orderStatus,
    orderPaymentStatus,
    deliveryLocation,
    hostel,
    email,
    phone
  } = {}) => {
    const qs = buildQuery({ page, limit, status, method, startDate, endDate, search, orderStatus, orderPaymentStatus, deliveryLocation, hostel, email, phone });
    return apiGet(`/payments${qs}`, { cache: false, dedupe: true });
  },
  // Admin: get by id
  getById: async (id) => {
    return apiGet(`/payments/${id}`, { cache: false });
  },
  // Admin: update payment status
  updateStatus: async (id, paymentStatus) => {
    const { data } = await api.patch(`/payments/${id}/status`, { paymentStatus });
    return data;
  },
  // Create a payment record (used on booking confirmation if needed)
  create: async (payload) => {
    const { data } = await api.post('/payments', payload);
    return data;
  },
  // Admin: backfill payments from orders
  backfill: async ({ dryRun = false } = {}) => {
    const { data } = await api.post(`/payments/backfill${dryRun ? '?dryRun=true' : ''}`);
    return data;
  }
};

// Utility: export array of payments to CSV string
export const paymentsToCSV = (items = []) => {
  const headers = [
    'Date',
    'OrderID',
    'CustomerName',
    'Email',
    'Phone',
    'Amount',
    'Method',
    'PaymentStatus',
    'OrderStatus',
    'OrderPaymentStatus',
    'DeliveryLocation',
    'Hostel',
    'GatewayPaymentId',
    'GatewayOrderId'
  ];
  const rows = items.map(p => [
    new Date(p.date || p.createdAt).toLocaleString(),
    p.orderId || '',
    p.customerName || '',
    p.email || '',
    p.phone || '',
    typeof p.amount === 'number' ? p.amount.toFixed(2) : p.amount,
    p.paymentMethod || '',
    p.paymentStatus || '',
    p.data?.order?.orderStatus || '',
    p.data?.order?.paymentStatus || '',
    p.deliveryLocationLabel || '',
    p.hostelName || '',
    p.gatewayPaymentId || '',
    p.gatewayOrderId || ''
  ]);
  const csv = [headers, ...rows].map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  return csv;
};

export const downloadCSV = (csv, filename = 'payments.csv') => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default paymentsService;
