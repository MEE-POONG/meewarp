import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type NavItem = {
  label: string;
  to: string;
  roles?: string[];
};

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Statistics', to: '/admin/statistics' },
  { label: 'Revenue', to: '/admin/revenue' },
  { label: 'Customers', to: '/admin/customers' },
  { label: 'Packages', to: '/admin/packages', roles: ['manager', 'superadmin'] },
  { label: 'Orders', to: '/admin/orders' },
  { label: 'Settings', to: '/admin/settings', roles: ['manager', 'superadmin'] },
  { label: 'Admin Users', to: '/admin/users', roles: ['superadmin'] },
  { label: 'Activity Log', to: '/admin/activity' },
];

const AdminLayout = () => {
  const { clearToken, admin } = useAuth();
  const navigate = useNavigate();

  const filteredNav = useMemo(() => {
    return navItems.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      if (!admin?.role) return false;
      return item.roles.includes(admin.role);
    });
  }, [admin?.role]);

  return (
    <div className="relative flex min-h-screen bg-slate-950 text-slate-100 font-th">
      {/* Global admin gradients */}
      <div className="pointer-events-none fixed inset-0 -z-40 opacity-70" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_15%_15%,_rgba(99,102,241,0.4)_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_85%_85%,_rgba(244,114,182,0.35)_0%,_transparent_72%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(160%_160%_at_50%_120%,_rgba(192,132,252,0.3)_0%,_transparent_65%)] mix-blend-screen" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-white/10 bg-slate-950/85 p-6 backdrop-blur-xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.5em] text-indigo-300">meeWarp Admin</p>
          <h1 className="mt-2 text-2xl font-bold text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]">Control Center</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-600/20 text-indigo-200 shadow-[0_8px_25px_rgba(99,102,241,0.3)]'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
            >
              {({ isActive }) => (
                <>
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                      : 'bg-slate-700 group-hover:bg-slate-600'
                  }`}>
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            {admin?.displayName ? (
              <p className="text-slate-200 font-medium">{admin.displayName}</p>
            ) : null}
            {admin?.role ? (
              <p className="text-xs uppercase tracking-[0.4em] text-indigo-300 mt-1">{admin.role}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="group w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-200 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:text-white"
            onClick={() => {
              clearToken();
              navigate('/admin/login', { replace: true });
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log out
            </div>
          </button>
        </div>
      </aside>

      <main className="relative z-10 ml-72 flex-1 overflow-y-auto bg-slate-900/40 p-8">
        <div
          className="pointer-events-none fixed inset-x-1/2 -top-32 h-72 w-72 -translate-x-1/2 -z-10 rounded-full bg-indigo-500/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none fixed -left-28 top-1/3 -z-10 h-[28rem] w-[28rem] rounded-full bg-pink-500/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none fixed -right-32 bottom-0 -z-10 h-[28rem] w-[28rem] rounded-full bg-purple-500/25 blur-3xl"
          aria-hidden
        />

        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
