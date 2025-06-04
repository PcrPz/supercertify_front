// lib/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000
});

// ตั้งค่า interceptor request เพื่อล็อก requests
api.interceptors.request.use(
  (config) => {
    console.log(`[REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// ตั้งค่า interceptor response จัดการข้อผิดพลาด
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response Success:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.log('❌ API Response Error:', error.response?.status, error.config.url);
    
    // เมื่อได้รับ 401 Unauthorized
    if (error.response?.status === 401 && !error.config._retry) {
      console.log('🔄 Attempting to refresh token...');
      error.config._retry = true;
      
      try {
        console.log('📤 Calling refresh token API...');
        const refreshResponse = await axios.post('/auth/refresh-token', {}, { withCredentials: true });
        console.log('📥 Refresh token response:', refreshResponse.data);
        
        if (refreshResponse.data.success) {
          console.log('✅ Token refreshed successfully! Retrying original request...');
          
          // เพิ่มการ emit event เมื่อ refresh token สำเร็จ
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:token-refreshed'));
          }
          
          return api(error.config);
        }else {
          console.log('❌ Token refresh failed with success=false');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.log('❌ Error during token refresh:', refreshError.message);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;