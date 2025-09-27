import { type ChangeEvent, type FormEvent, useState } from 'react';
import { API_ENDPOINTS } from '../config';

type FormValues = {
  code: string;
  name: string;
  socialLink: string;
};

type AdminFormProps = {
  authToken: string;
  onSuccess?: () => void;
  onLogout?: () => void;
};

const defaultValues: FormValues = {
  code: '',
  name: '',
  socialLink: '',
};

const AdminForm = ({ authToken, onSuccess, onLogout }: AdminFormProps) => {
  const [values, setValues] = useState<FormValues>(defaultValues);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleChange = (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch(API_ENDPOINTS.createWarpProfile, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(values),
      });

      if (response.status === 401) {
        setStatus('error');
        setMessage('Session expired. Please log in again.');
        onLogout?.();
        return;
      }

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || 'Failed to create warp profile');
      }

      setStatus('success');
      setMessage('Warp profile created successfully.');
      setValues(defaultValues);
      onSuccess?.();
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unexpected error occurred');
    }
  };

  const isSubmitting = status === 'submitting';

  const inputClassName =
    'w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 shadow-[0_15px_35px_rgba(15,23,42,0.35)] transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40';

  return (
    <section className="relative mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-10 text-slate-100 shadow-[0_35px_80px_rgba(15,23,42,0.65)] backdrop-blur-xl">
      <div className="pointer-events-none absolute -top-32 -right-16 h-64 w-64 rounded-full bg-indigo-500/40 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 -left-10 h-72 w-72 rounded-full bg-pink-500/30 blur-3xl" aria-hidden />

      <div className="relative z-10 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-300">New Profile</p>
          <h2 className="text-3xl font-semibold text-white drop-shadow-[0_10px_30px_rgba(79,70,229,0.45)]">
            Create Warp Profile
          </h2>
          <p className="text-sm text-slate-300">
            ระบุรหัส ชื่อ และลิงก์โซเชียลเพื่อเปิดให้ลูกค้าเลือกศิลปินจากหน้าจอหลัก
          </p>
        </header>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-300" htmlFor="code">
              Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              value={values.code}
              onChange={handleChange('code')}
              required
              placeholder="e.g. DJ001"
              className={inputClassName}
            />
            <p className="text-xs text-slate-400">ใช้รหัสสั้น ๆ เพื่ออ้างอิงในระบบและแสดงบนหน้า Self Warp</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-300" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange('name')}
              required
              placeholder="Staff member name"
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-slate-300" htmlFor="socialLink">
              Social Link
            </label>
            <input
              id="socialLink"
              name="socialLink"
              type="url"
              value={values.socialLink}
              onChange={handleChange('socialLink')}
              required
              placeholder="https://instagram.com/username"
              className={inputClassName}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white transition focus:outline-none focus:ring-2 focus:ring-pink-400/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="absolute inset-0 -translate-y-full bg-white/20 transition group-hover:translate-y-0" aria-hidden />
            <span className="relative">{isSubmitting ? 'Submitting…' : 'Create Warp Profile'}</span>
          </button>
        </form>

        {status !== 'idle' && message && (
          <p
            className={`text-sm font-medium ${
              status === 'success' ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </section>
  );
};

export default AdminForm;
