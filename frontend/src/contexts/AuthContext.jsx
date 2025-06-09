import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../api/axiosConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loadingAuth, setLoadingAuth] = useState(true); // <-- وضعیت جدید

  useEffect(() => {
    setLoadingAuth(true); // <-- شروع بارگذاری
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.exp * 1000 > Date.now()) {
          setUser({ 
            username: decodedToken.sub, 
            is_admin: decodedToken.is_admin || false, 
            permissions: decodedToken.permissions || [] 
          });
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
          localStorage.removeItem('token'); // توکن منقضی شده را پاک کن
          setToken(null); // توکن را از state هم پاک کن
          setUser(null);
        }
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } else {
      setUser(null); // اگر توکنی نبود
    }
    setLoadingAuth(false); // <-- پایان بارگذاری
  }, [token]);

  const login = async (username, password) => {
    const response = await apiClient.post('/auth/token', new URLSearchParams({
      username,
      password,
    }));
    const new_token = response.data.access_token;
    localStorage.setItem('token', new_token);
    setToken(new_token); // این باعث اجرای مجدد useEffect بالا و به‌روز شدن user می‌شود
    return true;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
  };
  
  const isAdmin = () => {
    return user?.is_admin ?? false;
  };

  const hasPermission = (permissionName) => {
    return user?.permissions.includes(permissionName) ?? false;
  };

  const authContextValue = {
    user,
    login,
    logout,
    isAdmin,
    hasPermission,
    isAuthenticated: !!user,
    loadingAuth, // <-- اضافه کردن به context value
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;