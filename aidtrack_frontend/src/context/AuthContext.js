import React, { createContext, useState, useContext } from 'react';
import api from '../api'; // Import centralized axios instance
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate();

  // Check for saved user on mount
  React.useEffect(() => {
    const savedUser = sessionStorage.getItem('aidtrack_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage", e);
        sessionStorage.removeItem('aidtrack_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    setError(null);
    try {
      const response = await api.post('/login', {
        identifier,
        password,
      });

      const userData = response.data.user;
      const token = response.data.token; // Extract token

      setUser(userData);
      sessionStorage.setItem('aidtrack_user', JSON.stringify(userData)); // Save to session storage
      sessionStorage.setItem('aidtrack_token', token); // Save token to session storage

      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/volunteer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('aidtrack_user'); // Clear from session storage
    sessionStorage.removeItem('aidtrack_token'); // Clear token
    navigate('/login');
  };

  const value = { user, error, login, logout, loading };

  // Don't render children until we've checked for a session
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}