import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminGuard = () => {
  const { token, isTokenValid } = useAuth();

  if (!token || !isTokenValid) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default AdminGuard;
