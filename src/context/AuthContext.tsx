import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on page load (Session Persistence)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.get('/users/me');
        setUser(response.data);
      } catch (error) {
        // If 401/403 or network error, user is not logged in
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (credentials: any) => {
    try {
      const response = await api.post('/auth/login', credentials);
      setUser(response.data); // Save user data to context
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};