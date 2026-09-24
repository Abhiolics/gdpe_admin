'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'admin' | 'user';
  isBlocked: boolean;
  isActive: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSandboxMode: boolean;
  setSandboxMode: (mode: boolean) => void;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: (reason?: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const router = useRouter();

  const logout = (reason?: string) => {
    localStorage.removeItem('token');
    setUser(null);
    if (typeof reason === 'string') {
      toast.warning(reason);
    } else {
      toast.success('Logged out successfully');
    }
    router.push('/auth/login');
  };

  const fetchMe = async () => {
    try {
      const res = await authApi.getMe();
      if (res.data && res.data.user) {
        setUser(res.data.user);
      } else if (res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedSandbox = localStorage.getItem('sandboxMode');
    if (savedSandbox === 'true') {
      setIsSandboxMode(true);
    }

    if (token) {
      fetchMe();
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout('Session expired due to 10 minutes of inactivity');
      }, 10 * 60 * 1000); // 10 minutes
    };

    // Events to track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  const sendOtp = async (email: string) => {
    try {
      await authApi.sendOtp(email);
      toast.success('OTP sent successfully to your email!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
      throw err;
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const res = await authApi.verifyOtp(email, otp);
      const token = res.data?.token || res.data?.data?.token;
      if (token) {
        localStorage.setItem('token', token);
        await fetchMe();
        toast.success('Logged in successfully!');
        router.push('/admin');
      } else {
        throw new Error('No token returned from server');
      }
    } catch (err: any) {
      toast.error(err.message || 'OTP verification failed');
      throw err;
    }
  };

  const register = async (data: any) => {
    try {
      await authApi.register(data);
      toast.success('Registration successful! Please login using OTP.');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
      throw err;
    }
  };

  const setSandboxMode = (mode: boolean) => {
    setIsSandboxMode(mode);
    localStorage.setItem('sandboxMode', mode ? 'true' : 'false');
    if (mode) {
      router.push('/sandbox');
    } else {
      router.push('/admin');
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetchMe();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isSandboxMode,
        setSandboxMode,
        sendOtp,
        verifyOtp,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
