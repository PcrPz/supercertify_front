import axios from 'axios';

// สร้าง Axios instance สำหรับเรียกใช้ API Routes ของ Next.js
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // สำคัญมาก เพื่อให้ Axios ส่ง/รับ cookies ไปกับ request
});

// ตั้งค่า interceptor จัดการข้อผิดพลาด
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // หากเป็น 401 Unauthorized, อาจทำการ redirect ไปหน้า login
      if (error.response.status === 401 && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;