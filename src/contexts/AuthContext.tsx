// src/contexts/AuthContext.tsx
import React from "react"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService'; // Servisi import ettik

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Başlangıçta true yapalım ki token kontrolü bitmeden sayfa açılmasın

  // Sayfa ilk yüklendiğinde Token kontrolü yap
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          console.error("Token geçersiz veya süresi dolmuş:", error);
          localStorage.removeItem('access_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // 1. Token al
      const data = await authService.login(email, password);
      localStorage.setItem('access_token', data.access_token);
      
      // 2. Hemen ardından kullanıcı detaylarını çek (Çünkü login endpoint'i user dönmüyor)
      const userData = await authService.getMe();
      setUser(userData);
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Kayıt ol
      const data = await authService.signup(username, email, password);
      
      // Eğer backend kayıt sonrası direkt token dönüyorsa otomatik giriş yap:
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        const userData = await authService.getMe();
        setUser(userData);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const deleteAccount = async () => {
    // İleride API çağrısı eklenebilir
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isGuest: !user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        deleteAccount,
      }}
    >
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