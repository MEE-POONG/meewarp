import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API_ENDPOINTS } from '../config';

type User = {
  id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  email?: string;
};

type LineAuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isConfigured: boolean;
  login: (formData?: any) => Promise<void>;
  logout: () => void;
  verifyToken: () => Promise<boolean>;
  getStoredFormData: () => any | null;
  clearStoredFormData: () => void;
};

const LineAuthContext = createContext<LineAuthContextType | undefined>(undefined);

type LineAuthProviderProps = {
  children: ReactNode;
};

export const LineAuthProvider = ({ children }: LineAuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  // Load token from localStorage on mount and check LINE configuration
  useEffect(() => {
    const checkLineConfiguration = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.lineLogin);
        const data = await response.json();
        setIsConfigured(data.configured || false);
      } catch (error) {
        console.error('Failed to check LINE configuration:', error);
        setIsConfigured(false);
      }
    };

    // Check for token in URL parameters first (from LINE callback)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      // Save token to localStorage and verify it
      localStorage.setItem('lineAuthToken', tokenFromUrl);
      setToken(tokenFromUrl);
      verifyToken(tokenFromUrl);
      
      // Clean up URL by removing token parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('token');
      window.history.replaceState({}, '', newUrl.toString());
    } else {
      // Check localStorage for existing token
      const savedToken = localStorage.getItem('lineAuthToken');
      if (savedToken) {
        setToken(savedToken);
        verifyToken(savedToken);
      } else {
        setIsLoading(false);
      }
    }

    checkLineConfiguration();
  }, []);

  const verifyToken = async (tokenToVerify?: string): Promise<boolean> => {
    try {
      const authToken = tokenToVerify || token;
      if (!authToken) return false;

      const response = await fetch(API_ENDPOINTS.authVerify, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsConfigured(true);
        return true;
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('lineAuthToken');
        setToken(null);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('lineAuthToken');
      setToken(null);
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (formData?: any): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Get LINE login URL
      const response = await fetch(API_ENDPOINTS.lineLogin);
      const data = await response.json();

      if (!data.configured) {
        throw new Error('LINE Login is not configured');
      }

      // Store form data before redirecting to LINE login
      if (formData) {
        localStorage.setItem('lineAuthFormData', JSON.stringify(formData));
      }

      // Store current URL as redirect after login
      const redirectUrl = window.location.href;
      localStorage.setItem('lineAuthRedirect', redirectUrl);

      // Redirect to LINE login
      window.location.href = data.loginUrl;
    } catch (error) {
      console.error('LINE login failed:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = (): void => {
    localStorage.removeItem('lineAuthToken');
    localStorage.removeItem('lineAuthRedirect');
    localStorage.removeItem('lineAuthFormData');
    setToken(null);
    setUser(null);
    
    // Call logout API (optional)
    fetch(API_ENDPOINTS.authLogout, { method: 'POST' }).catch(console.error);
  };

  const getStoredFormData = (): any | null => {
    try {
      const storedData = localStorage.getItem('lineAuthFormData');
      return storedData ? JSON.parse(storedData) : null;
    } catch (error) {
      console.error('Failed to parse stored form data:', error);
      return null;
    }
  };

  const clearStoredFormData = (): void => {
    localStorage.removeItem('lineAuthFormData');
  };

  const value: LineAuthContextType = {
    user,
    token,
    isLoading,
    isConfigured,
    login,
    logout,
    verifyToken,
    getStoredFormData,
    clearStoredFormData,
  };

  return <LineAuthContext.Provider value={value}>{children}</LineAuthContext.Provider>;
};

export const useLineAuth = (): LineAuthContextType => {
  const context = useContext(LineAuthContext);
  if (context === undefined) {
    throw new Error('useLineAuth must be used within a LineAuthProvider');
  }
  return context;
};
