import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

type Overview = {
  totalRevenue: number;
  totalWarps: number;
  totalWarpSeconds: number;
  queueLength: number;
  today: {
    revenue: number;
    warps: number;
  };
};

const AdminDashboard = () => {
  const { token } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.adminDashboard, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to load dashboard');
        }
        const data = (await response.json()) as Overview;
        if (isMounted) {
          setOverview(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unexpected error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (token) {
      load();
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  const cards = overview
    ? [
        {
          label: 'รายได้รวม',
          value: `${overview.totalRevenue.toLocaleString('th-TH')} ฿`,
          sub: `วันนี้ ${overview.today.revenue.toLocaleString('th-TH')} ฿`,
        },
        {
          label: 'จำนวน Warp ทั้งหมด',
          value: overview.totalWarps.toLocaleString('th-TH'),
          sub: `วันนี้ ${overview.today.warps.toLocaleString('th-TH')} ครั้ง`,
        },
        {
          label: 'วินาทีที่ขายได้',
          value: `${overview.totalWarpSeconds.toLocaleString('th-TH')} s`,
          sub: 'รวมทุกแพ็คเกจ',
        },
        {
          label: 'คิวที่รอแสดง',
          value: overview.queueLength.toString(),
          sub: 'อัปเดตเรียลไทม์',
        },
      ]
    : [];

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100 font-th">
      {/* <div
        className="pointer-events-none absolute inset-x-1/2 -top-40 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-28 top-1/3 h-[28rem] w-[28rem] rounded-full bg-pink-500/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-[30rem] w-[30rem] rounded-full bg-purple-500/25 blur-3xl"
        aria-hidden
      /> */}

      <div className="relative z-10 px-6 py-10 sm:px-8 sm:py-12">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-en text-xs uppercase tracking-[0.5em] text-indigo-300">Dashboard</p>
            <h1
              lang="th"
              className="mt-2 text-4xl font-semibold text-white drop-shadow-[0_0_35px_rgba(99,102,241,0.45)] sm:text-5xl"
            >
              ภาพรวมระบบ
            </h1>
            <p lang="th" className="mt-2 max-w-xl text-sm text-slate-300">
              ตัวเลขอัปเดตเรียลไทม์จากฝั่งลูกค้าและคิว Warp
            </p>
          </div>
          <Link
            to="/admin/packages"
            className="group inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-slate-100 shadow-[0_18px_45px_rgba(8,12,24,0.45)] transition hover:border-white/35 hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Manage Packages
          </Link>
        </header>

        <div className="mt-10 space-y-8">
          {loading ? (
            <p className="text-sm text-slate-300">Loading dashboard…</p>
          ) : error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : overview ? (
            <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((card, index) => {
                const gradients = [
                  'from-indigo-500 to-purple-600',
                  'from-emerald-500 to-teal-600',
                  'from-amber-500 to-orange-600',
                  'from-pink-500 to-rose-600',
                ];
                const icons = [
                  'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
                  'M13 10V3L4 14h7v7l9-11h-7z',
                  'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
                  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                ];

                return (
                  <article
                    key={card.label}
                    className="group rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_65px_rgba(8,12,24,0.55)] backdrop-blur-xl transition hover:scale-[1.03] hover:shadow-[0_30px_80px_rgba(8,12,24,0.7)]"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradients[index]}`}>
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[index]} />
                        </svg>
                      </span>
                      <p lang="th" className="text-xs uppercase tracking-[0.35em] text-indigo-200">
                        {card.label}
                      </p>
                    </div>
                    <p className="text-3xl font-semibold text-white sm:text-[34px]">{card.value}</p>
                    <p lang="th" className="mt-2 text-sm text-slate-300">
                      {card.sub}
                    </p>
                  </article>
                );
              })}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
