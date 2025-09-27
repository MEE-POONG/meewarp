import { type FormEvent, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

type Order = {
  _id: string;
  code: string;
  customerName: string;
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

const AdminOrdersPage = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrdersResponse | null>(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);

    try {
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
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchOrders();
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Orders</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Warp Orders</h1>
        <p className="mt-1 text-sm text-slate-300">ดูสถานะคำสั่งซื้อทั้งหมดและค้นหาตามชื่อหรือโค้ดได้</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-2 w-48 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          >
            <option value="">ทั้งหมด</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="displaying">Displaying</option>
            <option value="displayed">Displayed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Search</label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ชื่อหรือโค้ด"
            className="mt-2 w-60 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)] transition hover:bg-indigo-400"
        >
          Apply
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-300">Loading orders…</p>
      ) : error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : orders ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_25px_60px_rgba(15,23,42,0.45)]">
          <table className="min-w-full divide-y divide-white/10 text-sm text-slate-100">
            <thead className="bg-white/10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Order</th>
                <th className="px-4 py-3 text-left font-semibold">Profile</th>
                <th className="px-4 py-3 text-left font-semibold">Seconds</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {orders.data.map((order) => (
                <tr key={order._id}>
                  <td className="px-4 py-3 font-semibold text-white">{order._id.slice(-6)}</td>
                  <td className="px-4 py-3 text-slate-200">{order.code}</td>
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
        </div>
      ) : null}
    </div>
  );
};

export default AdminOrdersPage;
