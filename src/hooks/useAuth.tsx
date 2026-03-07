import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiService from '../services/api';
import { ResetTokenResponse, User } from '../types';

interface UseAuthResult {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<ResetTokenResponse>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<UseAuthResult | undefined>(undefined);

function useProvideAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    if (storedToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        apiService.setToken(storedToken);
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.auth.login(email, password);
      setUser(response.data);
      setToken(response.token);
      apiService.setToken(response.token);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('authUser', JSON.stringify(response.data));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    apiService.setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.auth.requestReset(email);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset request failed.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string, tokenValue: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.auth.resetPassword(email, tokenValue, newPassword);
      setUser(response.data);
      setToken(response.token);
      apiService.setToken(response.token);
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('authUser', JSON.stringify(response.data));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset password failed.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return useMemo(
    () => ({ user, token, loading, error, login, logout, requestPasswordReset, resetPassword, clearError }),
    [user, token, loading, error, login, logout, requestPasswordReset, resetPassword, clearError]
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth(): UseAuthResult {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}