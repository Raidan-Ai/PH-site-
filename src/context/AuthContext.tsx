import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: any | null;
  userData: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateUserContext: (token: string, user: User) => void;
  googleLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profileResponse = await api.get('/api/auth/profile');
          const apiUser = profileResponse.data;
          setUserData(apiUser);
          setUser({
            uid: apiUser.uid,
            email: apiUser.email,
            displayName: apiUser.displayName || apiUser.email.split('@')[0],
          });
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error fetching API profile:', error);
          localStorage.removeItem('token');
        }
      }
      
      setUser(null);
      setUserData(null);
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const updateUserContext = (token: string, user: User) => {
    localStorage.setItem('token', token);
    setUserData(user);
    setUser({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
    });
  };

  const googleLogin = async () => {
    try {
      const { data } = await api.get('/api/auth/google/url');
      window.open(data.url, 'google_auth', 'width=600,height=700');
    } catch (err) {
      console.error('Google OAuth initialization failed:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signOut, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
