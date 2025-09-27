import { type FormEvent, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

type WarpPackage = {
  _id: string;
  name: string;
  seconds: number;
  price: number;
  isActive: boolean;
};

const AdminPackagesPage = () => {
  const { token, admin } = useAuth();
  const [packages, setPackages] = useState<WarpPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', seconds: '', price: '' });

  const canEdit = admin?.role === 'manager' || admin?.role === 'superadmin';

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_ENDPOINTS.adminPackages}?includeInactive=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to load packages');
      }
      const data = (await response.json()) as WarpPackage[];
      setPackages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    try {
      const response = await fetch(API_ENDPOINTS.adminPackages, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          seconds: Number(form.seconds),
          price: Number(form.price),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || 'Failed to create package');
      }
      setForm({ name: '', seconds: '', price: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    }
  };

  const togglePackage = async (pkg: WarpPackage) => {
    if (!token) return;
    await fetch(`${API_ENDPOINTS.adminPackages}/${pkg._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !pkg.isActive }),
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Packages</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Warp Packages</h1>
        <p className="mt-1 text-sm text-slate-300">
          จัดการแพ็กเกจเวลาและราคา เพื่อใช้บนหน้า Self Warp และหน้าจอหลัก
        </p>
      </header>

      {canEdit ? (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] md:grid-cols-4"
        >
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Package Name</label>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Seconds</label>
            <input
              type="number"
              min={10}
              value={form.seconds}
              onChange={(event) => setForm((prev) => ({ ...prev, seconds: event.target.value }))}
              required
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Price (THB)</label>
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              required
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)] transition hover:bg-indigo-400"
            >
              Add Package
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-300">Loading packages…</p>
      ) : error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg._id} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{pkg.name}</p>
                  <p className="text-sm text-slate-300">{pkg.seconds} วินาที</p>
                </div>
                <span className="text-lg font-semibold text-indigo-200">{pkg.price.toLocaleString('th-TH')} ฿</span>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>{pkg.isActive ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}</span>
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => togglePackage(pkg)}
                    className="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-white/30 hover:text-white"
                  >
                    {pkg.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPackagesPage;
