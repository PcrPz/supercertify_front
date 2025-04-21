// services/auth.js
import axios from 'axios';

// ฟังก์ชันสำหรับการลงทะเบียน
export const register = async (registerData) => {
  try {
    const response = await axios.post('/api/auth/register', registerData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

// ฟังก์ชันสำหรับการเข้าสู่ระบบ
export const login = async (loginData) => {
  try {
    const response = await axios.post('/api/auth/login', loginData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

// ฟังก์ชันสำหรับการออกจากระบบ
export const logout = async () => {
  try {
    await axios.post('/api/auth/logout');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Logout failed');
  }
};

// ฟังก์ชันสำหรับตรวจสอบสถานะการเข้าสู่ระบบ
export const checkAuthStatus = async () => {
  try {
    const response = await axios.get('/api/auth/status');
    return response.data;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { authenticated: false, user: null };
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