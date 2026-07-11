import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const stored = localStorage.getItem('admin_token');
      if (!stored) { setLoading(false); return; }
      try {
        const res = await axios.get(`${API_BASE}/auth/verify`, {
          headers: { Authorization: `Bearer ${stored}` },
        });
        if (res.data.success) {
          setAdmin(res.data.admin);
          setToken(stored);
        } else {
          localStorage.removeItem('admin_token');
        }
      } catch {
        localStorage.removeItem('admin_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  const login = async (username, password) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
    if (res.data.success) {
      localStorage.setItem('admin_token', res.data.token);
      setToken(res.data.token);
      setAdmin(res.data.admin);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setAdmin(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await axios.put(
      `${API_BASE}/auth/change-password`,
      { currentPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ admin, token, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
