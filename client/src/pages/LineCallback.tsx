import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import Spinner from '../components/Spinner';

const LineCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`LINE Login error: ${error}`);
        }

        if (!code) {
          throw new Error('Authorization code not found');
        }

        // Exchange code for token
        const response = await fetch(API_ENDPOINTS.lineCallback, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'LINE Login failed');
        }

        // Store token and user data
        localStorage.setItem('lineAuthToken', data.token);
        
        setStatus('success');
        setMessage('เข้าสู่ระบบสำเร็จ!');

        // Redirect to original page or home
        setTimeout(() => {
          const redirectUrl = localStorage.getItem('lineAuthRedirect');
          if (redirectUrl) {
            localStorage.removeItem('lineAuthRedirect');
            window.location.href = redirectUrl;
          } else {
            navigate('/');
          }
        }, 1500);

      } catch (error) {
        console.error('LINE callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4">
                <Spinner />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">กำลังเข้าสู่ระบบ...</h2>
              <p className="text-slate-300">กรุณารอสักครู่</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">เข้าสู่ระบบสำเร็จ!</h2>
              <p className="text-slate-300">กำลังนำคุณไปยังหน้าหลัก...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">เกิดข้อผิดพลาด</h2>
              <p className="text-slate-300 mb-4">{message}</p>
              <p className="text-sm text-slate-400">กำลังนำคุณกลับไปยังหน้าหลัก...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LineCallback;
