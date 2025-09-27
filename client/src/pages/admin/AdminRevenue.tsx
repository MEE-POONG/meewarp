import { type FormEvent, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

type Order = {
  _id: string;
  code: string;
  customerName: string;
  customerGender?: string;
  customerAgeRange?: string;
  displaySeconds: number;
  amount: number;
  status: string;
  createdAt: string;
};

type OrdersResponse = {
  data: Order[];
  total: number;
  page: number;
  limit: number;
};

const statusOptions = [
  { label: 'ทั้งหมด', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Displaying', value: 'displaying' },
  { label: 'Displayed', value: 'displayed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const AdminRevenue = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrdersResponse | null>(null);
  const [status, setStatus] = useState('paid');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const response = await fetch(`${API_ENDPOINTS.adminOrders}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to load orders');
      }
      const data = (await response.json()) as OrdersResponse;
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    load();
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!token) return;
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    if (from) params.set('from', from);
    if (to) params.set('to', to);

    const response = await fetch(`${API_ENDPOINTS.adminOrders}?format=${format}&${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message || 'Failed to export');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = format === 'csv' ? 'warp-revenue.csv' : 'warp-revenue.pdf';
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Revenue</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Revenue History</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-white/40 hover:text-white"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)] transition hover:bg-indigo-400"
          >
            Export PDF
          </button>
        </div>
      </header>

      <form
        onSubmit={handleFilter}
        className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] sm:grid-cols-2 lg:grid-cols-6"
      >
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Search</label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ชื่อหรือนามสกุล"
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">From</label>
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">To</label>
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)] transition hover:bg-indigo-400"
          >
            Filter
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-slate-300">Loading revenue history…</p>
      ) : error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : orders ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_25px_60px_rgba(15,23,42,0.45)]">
          <table className="min-w-full divide-y divide-white/10 text-sm text-slate-100">
            <thead className="bg-white/10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Order</th>
                <th className="px-4 py-3 text-left font-semibold">Customer</th>
                <th className="px-4 py-3 text-left font-semibold">Seconds</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.data.map((order) => (
                <tr key={order._id}>
                  <td className="px-4 py-3 font-medium text-white">{order._id.slice(-6)}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{order.customerName}</div>
                    <div className="text-xs text-slate-300">
                      {order.customerGender || 'ไม่ระบุ'} • {order.customerAgeRange || 'ไม่ระบุ'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{order.displaySeconds}s</td>
                  <td className="px-4 py-3 text-slate-200">{order.amount.toLocaleString('th-TH')} ฿</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-indigo-200">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
            <span>
              Showing {orders.data.length} of {orders.total} orders
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="rounded-md border border-white/10 px-3 py-1 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={orders.data.length < orders.limit}
                className="rounded-md border border-white/10 px-3 py-1 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminRevenue;
