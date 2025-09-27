import { type ChangeEvent, type FormEvent, useState } from 'react';
import { API_ENDPOINTS } from '../config';

type LoginValues = {
  email: string;
  password: string;
};

type AdminLoginSuccess = {
  token: string;
  role?: string;
  displayName?: string;
};

type AdminLoginProps = {
  onSuccess: (payload: AdminLoginSuccess) => void;
};

const defaultValues: LoginValues = {
  email: '',
  password: '',
};

const AdminLogin = ({ onSuccess }: AdminLoginProps) => {
  const [values, setValues] = useState<LoginValues>(defaultValues);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleChange = (field: keyof LoginValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch(API_ENDPOINTS.adminLogin, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.message || 'Invalid credentials');
      }

      const data = await response.json();
      if (!data?.token) {
        throw new Error('Login response missing token');
      }

      onSuccess({
        token: data.token,
        role: data.role,
        displayName: data.displayName,
      });
      setValues(defaultValues);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to sign in');
      return;
    }

    setStatus('idle');
  };

  const isLoading = status === 'loading';

  return (
    <section className="mx-auto w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Warp Admin Login</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange('email')}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange('password')}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {status === 'error' && message && (
        <p className="mt-4 text-sm text-rose-600">{message}</p>
      )}
    </section>
  );
};

export default AdminLogin;
