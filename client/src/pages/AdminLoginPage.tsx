import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLogin from '../components/AdminLogin';
import { useAuth } from '../contexts/AuthContext';

const AdminLoginPage = () => {
  const { token, setToken, isTokenValid } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && isTokenValid) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [token, isTokenValid, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <AdminLogin
        onSuccess={(payload) => {
          setToken(payload.token);
          navigate('/admin/dashboard', { replace: true });
        }}
      />
    </div>
  );
};

export default AdminLoginPage;
