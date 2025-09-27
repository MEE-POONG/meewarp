import { Navigate, Route, Routes } from 'react-router-dom';
import WarpRedirect from './pages/WarpRedirect';
import LandingPage from './pages/LandingPage';
import SelfWarpPage from './pages/SelfWarpPage';
import LineCallback from './pages/LineCallback';
import { AuthProvider } from './contexts/AuthContext';
import { LineAuthProvider } from './contexts/LineAuthContext';
import AdminActivity from './pages/AdminActivity';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminLayout from './components/admin/AdminLayout';
import AdminGuard from './components/admin/AdminGuard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStatistics from './pages/admin/AdminStatistics';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminPackagesPage from './pages/admin/AdminPackagesPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCreateWarpPage from './pages/admin/AdminCreateWarpPage';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route element={<AdminGuard />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="statistics" element={<AdminStatistics />} />
        <Route path="revenue" element={<AdminRevenue />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="packages" element={<AdminPackagesPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="create-warp" element={<AdminCreateWarpPage />} />
        <Route path="activity" element={<AdminActivity />} />
      </Route>
    </Route>
    <Route path="/self-warp" element={<SelfWarpPage />} />
    <Route path="/warp/:code" element={<WarpRedirect />} />
    <Route path="/line/callback" element={<LineCallback />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => {
  return (
    <AuthProvider>
      <LineAuthProvider>
        <AppRoutes />
      </LineAuthProvider>
    </AuthProvider>
  );
};

export default App;
