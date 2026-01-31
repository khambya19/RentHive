/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from 'react';

import API_BASE_URL from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const expiry = localStorage.getItem('sessionExpiry');
      
      if (!token) {
        setLoading(false);
        return;
      }

      if (expiry && Date.now() > parseInt(expiry, 10)) {
        logout();
        setLoading(false);
        return;
      }

      // Optimistically set user from storage while fetching fresh data
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Error parsing stored user", e);
        }
      }

      let didLogout = false;
      try {
        // Fetch fresh profile from backend (suppress console errors for 401)
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false, status: 401 }));
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // Update state and storage with fresh data
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } else {
          // If token is invalid (401), log out, but only once
          if (response.status === 401 && !didLogout) {
            didLogout = true;
            logout();
          }
        }
      } catch (err) {
        // Silently fail - user will need to log in
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    // Set 1 week expiry (7 days * 24h * 60m * 60s * 1000ms)
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('sessionExpiry', (Date.now() + oneWeek).toString());
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionExpiry');
    setUser(null);
  };

  const value = React.useMemo(() => ({
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
