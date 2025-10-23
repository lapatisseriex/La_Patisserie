import React, { useEffect, useMemo, useState } from 'react';
import { paymentsService, paymentsToCSV, downloadCSV } from '../../services/paymentsService';
import { toast } from 'react-toastify';

const StatCard = ({ title, value, tone = 'primary' }) => {
  const tones = {
    primary: 'from-rose-500 to-pink-500',
    success: 'from-emerald-500 to-green-500',
    warning: 'from-amber-500 to-yellow-500',
  };
  return (
    <div className="p-4 rounded-xl bg-white shadow hover:shadow-md transition-shadow">
      <div className={`inline-block text-white text-xs font-semibold px-2 py-1 rounded-md bg-gradient-to-r ${tones[tone]} mb-2`}>{title}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
};

const PaymentFilters = ({ filters, onChange, onRefresh, loading, onExport, total, onBackfill, backfilling }) => {
  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <input type="date" value={filters.startDate || ''} onChange={e => onChange({ startDate: e.target.value })} className="px-3 py-2 border rounded-lg" />
        <input type="date" value={filters.endDate || ''} onChange={e => onChange({ endDate: e.target.value })} className="px-3 py-2 border rounded-lg" />
        <select value={filters.status || ''} onChange={e => onChange({ status: e.target.value })} className="px-3 py-2 border rounded-lg">
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
        </select>
        <select value={filters.method || ''} onChange={e => onChange({ method: e.target.value })} className="px-3 py-2 border rounded-lg">
          <option value="">All Methods</option>
          <option value="razorpay">Razorpay</option>
          <option value="card">Card</option>
          <option value="upi">UPI</option>
          <option value="wallet">Wallet</option>
        </select>
        <input placeholder="Search email/order" value={filters.search || ''} onChange={e => onChange({ search: e.target.value })} className="px-3 py-2 border rounded-lg" />
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition">{loading ? 'Loading…' : 'Refresh'}</button>
          <button onClick={onExport} className="px-3 py-2 border rounded-lg hover:bg-gray-50">Export CSV ({total ?? 0})</button>
          <button onClick={onBackfill} disabled={backfilling} className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">{backfilling ? 'Backfilling…' : 'Backfill'}</button>
        </div>
      </div>
    </div>
  );
};

const PaymentsTable = ({ items, onMarkPaid, onView }) => {
  return (
    <div className="overflow-auto rounded-xl border border-gray-100">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Order</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Method</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(p => (
            <tr key={p._id} className="hover:bg-rose-50/40 transition">
              <td className="px-4 py-3 text-sm text-gray-700">{new Date(p.date || p.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3 text-sm font-mono text-gray-800">{p.orderId}</td>
              <td className="px-4 py-3 text-sm text-gray-700">{p.email}</td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{Number(p.amount).toFixed(2)}</td>
              <td className="px-4 py-3 text-sm capitalize">{p.paymentMethod}</td>
              <td className="px-4 py-3 text-sm">
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                  p.data?.order?.orderStatus === 'cancelled' 
                    ? 'bg-red-100 text-red-700' 
                    : p.paymentStatus === 'success' 
                    ? 'bg-green-100 text-green-700'
                    : p.paymentMethod === 'cod' && p.data?.order?.orderStatus && ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(p.data.order.orderStatus)
                    ? 'bg-blue-100 text-blue-700'
                    : p.paymentStatus === 'pending' 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {p.data?.order?.orderStatus === 'cancelled' 
                    ? 'cancelled' 
                    : p.paymentStatus === 'success'
                    ? 'success'
                    : p.paymentMethod === 'cod' && p.data?.order?.orderStatus && ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(p.data.order.orderStatus)
                    ? 'cod-confirmed'
                    : p.paymentStatus}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-right space-x-2">
                <button
                  onClick={() => onView && onView(p)}
                  className="px-3 py-1 rounded-md border hover:bg-gray-50 text-xs"
                >
                  View
                </button>
                {p.paymentStatus === 'pending' && (
                  <button
                    onClick={() => onMarkPaid && onMarkPaid(p)}
                    className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    Mark Paid
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminPayments = () => {
  const [filters, setFilters] = useState({ page: 1, limit: 20, status: '', method: '', startDate: '', endDate: '', search: '' });
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [backfilling, setBackfilling] = useState(false);
  const [viewing, setViewing] = useState(null); // { loading, data }

  const refresh = async () => {
    setLoading(true);
    setError('');
    console.log('[Payments] Fetching with filters:', { ...filters });
    try {
      const { items: data, pagination: p } = await paymentsService.list(filters);
      console.log('[Payments] Response:', { items: data, pagination: p });
      setItems(data || []);
      if (p) setPagination(p);
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
  }, [filters.page, filters.limit, filters.status, filters.method, filters.startDate, filters.endDate, filters.search]);

  // Debug: log items whenever they change
  useEffect(() => {
    console.log('[Payments] Items changed:', items);
  }, [items]);

  const metrics = useMemo(() => {
    const totalPayments = items.length;
    
    // For revenue calculation:
    // - Include successful payments that are not cancelled
    // - Include COD orders that are placed/confirmed/delivered (not cancelled)
    const totalRevenue = items
      .filter(i => {
        const isCancelled = i.data?.order?.orderStatus === 'cancelled';
        if (isCancelled) return false;
        
        // Online payments that succeeded
        if (i.paymentStatus === 'success') return true;
        
        // COD orders that are confirmed (not pending payment status)
        if (i.paymentMethod === 'cod' && i.data?.order?.orderStatus && 
            ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(i.data.order.orderStatus)) {
          return true;
        }
        
        return false;
      })
      .reduce((a, c) => a + Number(c.amount || 0), 0);
    
    const success = items.filter(i => i.paymentStatus === 'success').length;
    const pending = items.filter(i => i.paymentStatus === 'pending' && i.data?.order?.orderStatus !== 'cancelled').length;
    const cancelled = items.filter(i => i.data?.order?.orderStatus === 'cancelled').length;
    
    return { totalPayments, totalRevenue, success, pending, cancelled };
  }, [items]);

  const onChange = (patch) => setFilters(prev => ({ ...prev, ...patch, page: 1 }));

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Payments" value={metrics.totalPayments} />
        <StatCard title="Total Revenue" value={`₹${metrics.totalRevenue.toFixed(2)}`} tone="success" />
        <StatCard title="Success" value={metrics.success} tone="success" />
        <StatCard title="Pending" value={metrics.pending} tone="warning" />
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

      {/* Simple side drawer/modal for viewing payment details */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setViewing(null)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Payment Details</h3>
              <button onClick={() => setViewing(null)} className="px-2 py-1 rounded-md border hover:bg-gray-50">Close</button>
            </div>
            {viewing.loading ? (
              <div>Loading…</div>
            ) : (
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-gray-500">Order ID</div>
                  <div className="font-mono">{viewing?.data?.payment?.orderId}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500">Status</div>
                    <div>{viewing?.data?.payment?.paymentStatus}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Method</div>
                    <div>{viewing?.data?.payment?.paymentMethod}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-gray-500">Amount</div>
                    <div>₹{Number(viewing?.data?.payment?.amount || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Date</div>
                    <div>{new Date(viewing?.data?.payment?.date || viewing?.data?.payment?.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="font-semibold mb-2">User</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-gray-500">Name</div>
                      <div>{viewing?.data?.payment?.userId?.name || '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Email</div>
                      <div>{viewing?.data?.payment?.userId?.email || viewing?.data?.payment?.email || '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Phone</div>
                      <div>{viewing?.data?.payment?.userId?.phone || '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">City</div>
                      <div>{
                        viewing?.data?.location?.city ||
                        viewing?.data?.order?.userDetails?.city ||
                        viewing?.data?.payment?.userId?.city ||
                        '-'
                      }</div>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <div className="font-semibold mb-2">Order</div>
                  {viewing?.data?.order ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-gray-500">Order Status</div>
                        <div>{viewing?.data?.order?.orderStatus}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Payment Status</div>
                        <div>{viewing?.data?.order?.paymentStatus}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Amount</div>
                        <div>₹{Number(viewing?.data?.order?.amount || 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Placed</div>
                        <div>{new Date(viewing?.data?.order?.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-500">Delivery Location</div>
                        <div>
                          {viewing?.data?.location?.city ? (
                            <span>{viewing?.data?.location?.area ? `${viewing?.data?.location?.area}, ` : ''}{viewing?.data?.location?.city} {viewing?.data?.location?.pincode ? `- ${viewing?.data?.location?.pincode}` : ''}</span>
                          ) : (
                            <span>{viewing?.data?.order?.deliveryLocation || '-'}</span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-500">City</div>
                        <div>{
                          viewing?.data?.location?.city ||
                          viewing?.data?.order?.userDetails?.city ||
                          '-'
                        }</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-500 mb-1">Items</div>
                        <div className="space-y-2">
                          {(viewing?.data?.order?.cartItems || []).map((it, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg border">
                              <img src={it.productImage || '/vite.svg'} alt="" className="w-10 h-10 object-cover rounded" />
                              <div className="flex-1">
                                <div className="font-medium">{it.productName || 'Product'}</div>
                                <div className="text-xs text-gray-500">Qty: {it.quantity} • ₹{Number(it.price || 0).toFixed(2)}</div>
                              </div>
                              <div className="text-sm font-semibold">₹{Number((it.price || 0) * (it.quantity || 0)).toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">No linked order found.</div>
                  )}
                </div>
              </div>
            )}
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
