import { useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../contexts/AuthContext';

export const useAdminApi = () => {
  const { token, clearToken } = useAuth();

  const request = useCallback(
    async (path: string, options: RequestInit = {}) => {
      if (!token) {
        throw new Error('Missing admin token');
      }

      const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        clearToken();
        throw new Error('Session expired');
      }

      return response;
    },
    [token, clearToken]
  );

  return { request };
};

export default useAdminApi;
