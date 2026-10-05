import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('paryavaran_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('paryavaran_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
          localStorage.setItem('paryavaran_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Session verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const setSession = (tokenData, userData) => {
    setToken(tokenData);
    setUser(userData);
    localStorage.setItem('paryavaran_token', tokenData);
    localStorage.setItem('paryavaran_user', JSON.stringify(userData));
  };

  const login = async (email, password) => {
    return await loginStep1(email, password);
  };

  const loginStep1 = async (email, password) => {
    const res = await authAPI.login({ email, password });
    return res.data;
  };

  const loginStep2 = async (email, otp) => {
    const res = await authAPI.verifyOTP({ email, otp });
    const { access_token, user: userData } = res.data;
    setSession(access_token, userData);
    return userData;
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('paryavaran_user', JSON.stringify(userData));
  };

  const adminLoginStep1 = async (email, password) => {
    const res = await authAPI.adminLoginStep1({ email, password });
    return res.data;
  };

  const adminLoginStep2 = async (email, otp) => {
    const res = await authAPI.adminLoginStep2({ email, otp });
    const { access_token, user: userData } = res.data;
    setSession(access_token, userData);
    return userData;
  };

  const register = async (name, email, password, role = 'CITIZEN') => {
    const res = await authAPI.register({ name, email, password, role });
    return res.data;
  };

  const verifyEmail = async (email, otp) => {
    const res = await authAPI.verifyEmail({ email, otp });
    const { access_token, user: userData } = res.data;
    if (access_token && userData) {
      setSession(access_token, userData);
    }
    return res.data;
  };

  const resendOTP = async (email, purpose = 'REGISTER_VERIFY') => {
    const res = await authAPI.resendOTP({ email, purpose });
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('paryavaran_token');
    localStorage.removeItem('paryavaran_user');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    role: user?.role || null,
    isAdmin: (user?.role || '').toUpperCase() === 'ADMIN',
    isCollector: (user?.role || '').toUpperCase() === 'COLLECTOR',
    isCitizen: (user?.role || '').toUpperCase() === 'CITIZEN',
    login,
    loginStep1,
    loginStep2,
    updateUser,
    setSession,
    adminLoginStep1,
    adminLoginStep2,
    register,
    verifyEmail,
    resendOTP,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
