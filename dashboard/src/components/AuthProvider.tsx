'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Define User type
interface User {
  uid: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user in localStorage on initial load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simple mock authentication - in a real app, you'd call an API
    // For now, we'll just accept any email/password combination
    const mockUser: User = {
      uid: `user_${Date.now()}`,
      email: email
    };

    // Store user in localStorage
    localStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const signup = async (email: string, password: string) => {
    // Simple mock registration - in a real app, you'd call an API
    const mockUser: User = {
      uid: `user_${Date.now()}`,
      email: email
    };

    // Store user in localStorage
    localStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = async () => {
    // Remove user from localStorage
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
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