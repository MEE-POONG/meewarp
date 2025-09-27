import { type FormEvent, useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

type AdminUser = {
  _id: string;
  email: string;
  role: string;
  displayName?: string;
  isActive: boolean;
  createdAt?: string;
};

const AdminUsersPage = () => {
  const { token, admin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', role: 'manager', displayName: '' });

  const isSuperadmin = admin?.role === 'superadmin';

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.adminUsers, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('Failed to load admin users');
      }
      const data = (await response.json()) as AdminUser[];
      setUsers(data);
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

    const response = await fetch(API_ENDPOINTS.adminUsers, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message || 'Failed to create admin user');
      return;
    }

    setForm({ email: '', password: '', role: 'manager', displayName: '' });
    await load();
  };

  const toggleActive = async (user: AdminUser) => {
    if (!token) return;
    await fetch(`${API_ENDPOINTS.adminUsers}/${user._id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Admin Users</h1>
        <p className="mt-1 text-sm text-slate-300">จัดการสิทธิ์ของทีมงานที่ดูแลระบบ meeWarp</p>
      </header>

      {isSuperadmin ? (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.45)] md:grid-cols-4"
        >
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Role</label>
            <select
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            >
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-indigo-200">Display Name</label>
            <input
              value={form.displayName}
              onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_16px_40px_rgba(99,102,241,0.35)] transition hover:bg-indigo-400"
            >
              Add Admin User
            </button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-slate-400">เฉพาะ Superadmin เท่านั้นที่สามารถเพิ่ม/แก้ไขผู้ใช้ได้</p>
      )}

      {loading ? (
        <p className="text-sm text-slate-300">Loading admin users…</p>
      ) : error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_25px_60px_rgba(15,23,42,0.45)]">
          <table className="min-w-full divide-y divide-white/10 text-sm text-slate-100">
            <thead className="bg-white/10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Display Name</th>
                <th className="px-4 py-3 text-left font-semibold">Role</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                {isSuperadmin ? <th className="px-4 py-3" /> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-4 py-3 font-semibold text-white">{user.email}</td>
                  <td className="px-4 py-3 text-slate-200">{user.displayName || '—'}</td>
                  <td className="px-4 py-3 text-slate-200">{user.role}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.3em] ${user.isActive ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {isSuperadmin ? (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => toggleActive(user)}
                        className="rounded-md border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-white/30 hover:text-white"
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
