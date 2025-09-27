import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

type Customer = {
  customerName: string;
  customerAvatar?: string;
  socialLink?: string;
  customerGender?: string;
  customerAgeRange?: string;
  totalWarps: number;
  totalSeconds: number;
  totalAmount: number;
  lastWarpAt: string;
};

type CustomerResponse = {
  data: Customer[];
  total: number;
};

const AdminCustomers = () => {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<CustomerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const response = await fetch(`${API_ENDPOINTS.adminCustomers}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to load customers');
      }
      const data = (await response.json()) as CustomerResponse;
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Customers</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Supporter Directory</h1>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหาชื่อลูกค้า"
            className="rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={load}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)] transition hover:bg-indigo-400"
          >
            Search
          </button>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-slate-300">Loading customers…</p>
      ) : error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : customers ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {customers.data.map((customer) => (
            <article
              key={customer.customerName}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.45)]"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    customer.customerAvatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.customerName)}&background=1f2937&color=fff`
                  }
                  alt={customer.customerName}
                  className="h-14 w-14 rounded-full border border-white/20 object-cover"
                />
                <div>
                  <p className="text-lg font-semibold text-white">{customer.customerName}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">
                    {customer.customerGender || 'ไม่ระบุ'} • {customer.customerAgeRange || 'ไม่ระบุ'}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-200">
                <p>
                  ยอดรวม: <strong>{customer.totalAmount.toLocaleString('th-TH')} ฿</strong>
                </p>
                <p>
                  จำนวน Warp: <strong>{customer.totalWarps}</strong> ({customer.totalSeconds}s)
                </p>
                <p className="text-xs text-slate-400">
                  ล่าสุด: {new Date(customer.lastWarpAt).toLocaleString()}
                </p>
                {customer.socialLink ? (
                  <a
                    href={customer.socialLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-indigo-200 hover:text-indigo-100"
                  >
                    เปิดลิงก์ Social
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default AdminCustomers;
