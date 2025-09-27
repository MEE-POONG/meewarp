import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';

type WarpStatus = 'loading' | 'notFound' | 'error';

type WarpResponse = {
  socialLink: string;
};

const WarpRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const [status, setStatus] = useState<WarpStatus>('loading');

  useEffect(() => {
    if (!code) {
      setStatus('notFound');
      return;
    }

    let isMounted = true;

    const fetchWarpProfile = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.warpProfile(code));

        if (response.status === 404) {
          if (isMounted) {
            setStatus('notFound');
          }
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to retrieve warp profile');
        }

        const data = (await response.json()) as WarpResponse;

        if (!data?.socialLink) {
          throw new Error('Warp profile missing social link');
        }

        window.location.replace(data.socialLink);
      } catch (error) {
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    fetchWarpProfile();

    return () => {
      isMounted = false;
    };
  }, [code]);

  if (status === 'loading') {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center bg-slate-100 text-center text-slate-700">
        <div className="flex flex-col items-center rounded-xl bg-white px-10 py-12 shadow-sm">
          <div className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <h1 className="text-xl font-semibold">Warp in progress…</h1>
          <p className="mt-2 text-sm text-slate-500">Hang tight while we redirect you.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-slate-100 text-center text-slate-700">
      <div className="rounded-xl bg-white px-8 py-10 shadow-sm">
        <h1 className="text-xl font-semibold">Warp Code Not Found or Inactive</h1>
        {status === 'error' && (
          <p className="mt-2 text-sm text-slate-500">Something went wrong. Please try again later.</p>
        )}
        {status === 'notFound' && (
          <p className="mt-2 text-sm text-slate-500">Check the code and try again.</p>
        )}
      </div>
    </section>
  );
};

export default WarpRedirect;
