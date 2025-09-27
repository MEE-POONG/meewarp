export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const API_ENDPOINTS = {
  createWarpProfile: `${API_BASE_URL}/v1/admin/warp`,
  adminLogin: `${API_BASE_URL}/v1/admin/login`,
  warpProfile: (code: string) => `${API_BASE_URL}/v1/warp/${encodeURIComponent(code)}`,
  topSupporters: `${API_BASE_URL}/v1/leaderboard/top-supporters`,
  leaderboardStream: `${API_BASE_URL}/v1/leaderboard/stream`,
  displayStream: `${API_BASE_URL}/v1/display/stream`,
  displayNext: `${API_BASE_URL}/v1/public/display/next`,
  displayComplete: (id: string) => `${API_BASE_URL}/v1/public/display/${encodeURIComponent(id)}/complete`,
  publicPackages: `${API_BASE_URL}/v1/public/packages`,
  adminDashboard: `${API_BASE_URL}/v1/admin/dashboard/overview`,
  adminStatistics: `${API_BASE_URL}/v1/admin/statistics`,
  adminCustomers: `${API_BASE_URL}/v1/admin/customers`,
  adminOrders: `${API_BASE_URL}/v1/admin/orders`,
  adminSettings: `${API_BASE_URL}/v1/admin/settings`,
  adminPackages: `${API_BASE_URL}/v1/admin/packages`,
  adminUsers: `${API_BASE_URL}/v1/admin/users`,
  adminOrdersExport: (format: 'csv' | 'pdf', params: string) =>
    `${API_BASE_URL}/v1/admin/orders?format=${format}${params ? `&${params}` : ''}`,
  // LINE Auth endpoints
  lineLogin: `${API_BASE_URL}/v1/auth/line/login`,
  lineCallback: `${API_BASE_URL}/v1/auth/line/callback`,
  authVerify: `${API_BASE_URL}/v1/auth/verify`,
  authLogout: `${API_BASE_URL}/v1/auth/logout`,
};
