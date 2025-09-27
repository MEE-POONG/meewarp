import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type ActivityEntry = {
  _id: string;
  code: string;
  customerName: string;
  amount: number;
  status: string;
  updatedAt: string;
  activityLog: Array<{
    action: string;
    description?: string;
    actor?: string;
    createdAt: string;
    _id?: string;
  }>;
};

const AdminActivity = () => {
  const { token } = useAuth();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('กรุณาล็อกอินก่อนเพื่อดู Activity log');
      return;
    }

    const controller = new AbortController();

    const fetchEntries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/v1/transactions/activity-log', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูล Activity log ได้');
        }

        const body = await response.json();
        setEntries(body.entries || []);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchEntries();

    return () => {
      controller.abort();
    };
  }, [token]);

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">Activity</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Warp Activity Log</h1>
        <p className="mt-2 text-sm text-slate-300">
          ดูรายการธุรกรรม Warp ล่าสุด พร้อมสถานะการชำระเงินและบันทึกจากระบบ
        </p>
      </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.3em] text-indigo-200">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount (THB)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Activities</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-300">
                    กำลังโหลด...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    ยังไม่มี Activity Log
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry._id} className="border-t border-white/5">
                    <td className="px-4 py-3 font-mono text-xs text-indigo-200">{entry.code || '-'}</td>
                    <td className="px-4 py-3 text-sm text-white">{entry.customerName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-100">{entry.amount?.toLocaleString('th-TH')}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {new Date(entry.updatedAt).toLocaleString('th-TH')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-200">
                      <ul className="space-y-2">
                        {entry.activityLog.map((log) => (
                          <li key={log._id || log.createdAt} className="rounded-lg bg-slate-900/70 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-widest text-indigo-200">{log.action}</p>
                            {log.description ? (
                              <p className="mt-1 text-slate-200">{log.description}</p>
                            ) : null}
                            <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                              <span>{log.actor || 'system'}</span>
                              <span>{new Date(log.createdAt).toLocaleTimeString('th-TH')}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
    </div>
  );
};

export default AdminActivity;
