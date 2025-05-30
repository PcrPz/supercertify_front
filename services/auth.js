// services/auth.js
import api from '@/lib/axios';
import { router } from 'next/navigation';


// ฟังก์ชันสำหรับการลงทะเบียน
export const register = async (registerData) => {
  try {
    const response = await api.post('/auth/register', registerData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

// ฟังก์ชันสำหรับการเข้าสู่ระบบ
export const login = async (loginData) => {
  try {
    const response = await api.post('/auth/login', loginData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

// ฟังก์ชันสำหรับการออกจากระบบ
export const logout = async () => {
  try {
    await api.post('/auth/logout');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Logout failed');
  }
};

// ปรับปรุงฟังก์ชัน checkAuthStatus
export const checkAuthStatus = async (forceRefresh = false) => {
  try {
    const config = {};
    
    // ถ้าต้องการบังคับให้ดึงข้อมูลใหม่ (ไม่ใช้แคช)
    if (forceRefresh) {
      config.headers = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      };
    }
    
    const response = await api.get('/auth/status', config);
    return response.data;
    
  } catch (error) {
    console.error('Auth status error:', error);
    return { 
      authenticated: false, 
      user: null 
    };
  }
};

export const isAdmin = async () => {
  try {
    const { authenticated, user } = await checkAuthStatus();
    return authenticated && user?.role === 'admin';
  } catch (error) {
    console.error('Admin check error:', error);
    return false;
  }
};
// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ปัจจุบัน (ถ้าต้องการใช้แยก)
export const getCurrentUser = async () => {
  try {
    const { authenticated, user } = await checkAuthStatus();
    if (!authenticated) {
      return null;
    }
    return user;
  } catch (error) {
    return null;
  }
};


// ฟังก์ชันสำหรับ redirect ไปยังหน้าต่างๆ หลังจาก authentication
export const handleRedirectAfterAuth = (router, callbackUrl) => {
  if (callbackUrl) {
    router.push(callbackUrl);
  } else {
    router.push('/dashboard');
  }
};

export const reloadUserProfile = async () => {
  try {
    // บังคับให้เรียก API ใหม่โดยไม่ใช้แคช
    const response = await api.get('/auth/status', {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error reloading user profile:', error);
    return { authenticated: false, user: null };
  }
};