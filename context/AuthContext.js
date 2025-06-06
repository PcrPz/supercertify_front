// contexts/AuthContext.js
'use client'
import { createContext, useContext, useEffect, useState } from 'react';
import { checkAuthStatus, reloadUserProfile } from '@/services/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthenticated: false,
    user: null,
  });

  // โหลดข้อมูลสถานะการเข้าสู่ระบบเมื่อคอมโพเนนต์โหลด
  const loadAuthStatus = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      const { authenticated, user } = await checkAuthStatus(true); // บังคับให้ไม่ใช้แคช
      setAuthState({
        isLoading: false,
        isAuthenticated: authenticated,
        user: user,
      });
    } catch (error) {
      console.error('Error loading auth status:', error);
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
    }
  };

  // ฟังก์ชันสำหรับอัปเดตสถานะเข้าสู่ระบบ
  const updateAuthState = async () => {
    try {
      const { authenticated, user } = await reloadUserProfile();
      setAuthState({
        isLoading: false,
        isAuthenticated: authenticated,
        user: user,
      });
    } catch (error) {
      console.error('Error updating auth state:', error);
    }
  };

  // ฟังก์ชันสำหรับตั้งค่าผู้ใช้โดยตรง
  const setUser = (user) => {
    setAuthState({
      isLoading: false,
      isAuthenticated: !!user,
      user,
    });
  };

  // ฟังก์ชันสำหรับล้างสถานะผู้ใช้
  const clearUser = () => {
    setAuthState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
    });
  };

  useEffect(() => {
    loadAuthStatus();
    
    // ตั้งค่า event listener สำหรับ token refresh
    const handleTokenRefresh = () => {
      console.log('🔄 Token refreshed event received, updating auth state...');
      updateAuthState();
    };
    
    window.addEventListener('auth:token-refreshed', handleTokenRefresh);
    
    return () => {
      window.removeEventListener('auth:token-refreshed', handleTokenRefresh);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      setUser, 
      clearUser, 
      updateAuthState, 
      loadAuthStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);