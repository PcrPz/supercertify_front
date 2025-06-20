// services/profileApi.js
import axios from 'axios';
import Cookies from 'js-cookie';
import { reloadUserProfile } from './auth';

// สร้าง instance ของ axios พร้อมกำหนดค่าเริ่มต้น
const createApiInstance = () => {
  const token = Cookies.get('access_token');
  
  const instance = axios.create({
    baseURL: process.env.API_URL, // API Server ที่ต้องการเรียกใช้
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    withCredentials: true,
    timeout: 15000 // กำหนด timeout เป็น 15 วินาที
  });
  
  // เพิ่ม interceptor สำหรับจัดการ refresh token
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      console.error(`❌ API Error: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      
      // เมื่อได้รับ 401 Unauthorized และยังไม่เคยพยายาม refresh
      if (error.response?.status === 401 && !error.config._retry) {
        console.log('🔄 Attempting to refresh token...');
        error.config._retry = true;
        
        try {
          console.log('📤 Calling refresh token API...');
          // ใช้ axios แยก เพื่อไม่ให้เกิด loop
          const refreshResponse = await axios.post('/api/auth/refresh-token', {}, { 
            withCredentials: true 
          });
          
          console.log('📥 Refresh token response:', refreshResponse.data);
          
          if (refreshResponse.data.success) {
            console.log('✅ Token refreshed successfully! Retrying original request...');
            
            // เพิ่มการ emit event เมื่อ refresh token สำเร็จ
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('auth:token-refreshed'));
            }
            
            // อัปเดต token ใหม่
            const newToken = Cookies.get('access_token');
            if (newToken) {
              error.config.headers.Authorization = `Bearer ${newToken}`;
            }
            
            // สร้าง instance ใหม่และส่งคำขอเดิมอีกครั้ง
            return axios(error.config);
          } else {
            console.log('❌ Token refresh failed with success=false');
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }
        } catch (refreshError) {
          console.error('❌ Error during token refresh:', refreshError);
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
  
  return instance;
};

// สร้าง instance ของ axios สำหรับ multipart/form-data
const createFormDataApiInstance = () => {
  const token = Cookies.get('access_token');
  
  return axios.create({
    baseURL: process.env.API_URL,
    headers: {
      'Authorization': `Bearer ${token}`
    },
    withCredentials: true,
    timeout: 30000 // กำหนด timeout นานขึ้นสำหรับการอัปโหลดไฟล์
  });
};

// สร้างฟังก์ชันครอบการเรียก API พร้อมระบบ logging และ error handling
const apiCall = async (method, endpoint, data = null, isFormData = false) => {
  const api = isFormData ? createFormDataApiInstance() : createApiInstance();
  
  try {
    console.log(`🔄 API Call: ${method.toUpperCase()} ${endpoint}`);
    console.time(`API ${method.toUpperCase()} ${endpoint}`);
    
    let response;
    const config = {};
    
    // ตั้งค่า timeout เพิ่มเติมสำหรับ form data
    if (isFormData) {
      config.timeout = 60000; // 60 วินาที
    }
    
    switch (method.toLowerCase()) {
      case 'get':
        response = await api.get(endpoint, config);
        break;
      case 'post':
        response = await api.post(endpoint, data, config);
        break;
      case 'put':
        response = await api.put(endpoint, data, config);
        break;
      case 'patch':
        response = await api.patch(endpoint, data, config);
        break;
      case 'delete':
        response = await api.delete(endpoint, config);
        break;
      default:
        return {
          success: false,
          errorCode: 'INVALID_METHOD',
          message: `ไม่รองรับ HTTP method: ${method}`
        };
    }
    
    console.timeEnd(`API ${method.toUpperCase()} ${endpoint}`);
    console.log(`✅ API Success: ${method.toUpperCase()} ${endpoint}`, response.data);
    
    return response.data;
  } catch (error) {
    console.timeEnd(`API ${method.toUpperCase()} ${endpoint}`);
    
    // จัดการ error แบบละเอียด
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;
      
      console.error(`❌ API Error: ${method.toUpperCase()} ${endpoint}`, {
        status: error.response.status,
        errorData: errorData
      });
      
      // ถ้า error response มีโครงสร้างตามที่เราต้องการแล้ว ให้ส่งกลับไปเลย
      if (errorData && typeof errorData === 'object' && 'success' in errorData) {
        return errorData;
      }
      
      // ถ้าไม่มีโครงสร้างตามที่เราต้องการ ให้แปลงเป็นรูปแบบมาตรฐาน
      return {
        success: false,
        statusCode: error.response.status,
        errorCode: errorData.errorCode || 'API_ERROR',
        message: errorData.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      };
    } else if (error.request) {
      // Network error
      console.error(`❌ Network Error: ${method.toUpperCase()} ${endpoint}`, error.message);
      return {
        success: false,
        statusCode: 0,
        errorCode: 'NETWORK_ERROR',
        message: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อของคุณ'
      };
    } else {
      // Other error
      console.error(`❌ API Error: ${method.toUpperCase()} ${endpoint}`, error.message);
      return {
        success: false,
        statusCode: 500,
        errorCode: 'CLIENT_ERROR',
        message: error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง'
      };
    }
  }
};

/**
 * ดึงข้อมูลโปรไฟล์ของผู้ใช้ปัจจุบัน
 * @returns {Promise<Object>} ข้อมูลโปรไฟล์ของผู้ใช้
 */
export async function getMyProfile() {
  const response = await apiCall('get', '/users/my-profile');
  
  // ตรวจสอบว่า response มี success เป็น true หรือไม่
  if (response && response.success === true && response.data) {
    return response.data;
  }
  
  // กรณีเกิด error แต่ไม่ต้องการ throw error ให้ส่ง null กลับไป
  return null;
}

/**
 * อัปเดตข้อมูลโปรไฟล์ของผู้ใช้
 * @param {Object} profileData ข้อมูลโปรไฟล์ที่ต้องการอัปเดต
 * @returns {Promise<Object>} ผลลัพธ์การอัปเดต
 */
export async function updateProfile(profileData) {
  // ตรวจสอบข้อมูลพื้นฐานก่อนส่ง
  if (profileData.username && !profileData.username.trim()) {
    return {
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'ชื่อผู้ใช้เป็นสิ่งจำเป็น'
    };
  }
  
  if (profileData.currentPassword && !profileData.newPassword) {
    return {
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'ต้องระบุรหัสผ่านใหม่เมื่อต้องการเปลี่ยนรหัสผ่าน'
    };
  }
  
  if (!profileData.currentPassword && profileData.newPassword) {
    return {
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'ต้องระบุรหัสผ่านปัจจุบันเมื่อต้องการเปลี่ยนรหัสผ่าน'
    };
  }
  
  // เรียกใช้ API เพื่ออัปเดตข้อมูล
  const response = await apiCall('patch', '/users/profile', profileData);
  
  // ถ้าอัปเดตสำเร็จ ให้รีโหลดข้อมูลผู้ใช้
  if (response && response.success === true) {
    await reloadUserProfile();
  }
  
  return response;
}

/**
 * อัปโหลดรูปโปรไฟล์ของผู้ใช้
 * @param {File} imageFile ไฟล์รูปภาพ
 * @returns {Promise<Object>} ผลลัพธ์การอัปโหลด
 */
export async function uploadProfilePicture(imageFile) {
  if (!imageFile) {
    return {
      success: false,
      errorCode: 'NO_FILE',
      message: 'ไม่พบไฟล์รูปภาพ'
    };
  }
  
  // ตรวจสอบประเภทไฟล์
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(imageFile.type)) {
    return {
      success: false,
      errorCode: 'INVALID_FILE_TYPE',
      message: 'ประเภทไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPEG, PNG, GIF, WEBP)'
    };
  }
  
  // ตรวจสอบขนาดไฟล์
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (imageFile.size > maxSize) {
    return {
      success: false,
      errorCode: 'FILE_TOO_LARGE',
      message: 'ขนาดไฟล์ใหญ่เกินไป กรุณาอัปโหลดไฟล์ขนาดไม่เกิน 5MB'
    };
  }
  
  const formData = new FormData();
  formData.append('profilePicture', imageFile);
  
  // เรียกใช้ API เพื่ออัปโหลดรูปภาพ
  const response = await apiCall('post', '/users/profile-picture', formData, true);
  
  // ถ้าอัปโหลดสำเร็จ ให้รีโหลดข้อมูลผู้ใช้
  if (response && response.success === true) {
    await reloadUserProfile();
  }
  
  return response;
}

/**
 * ลบรูปโปรไฟล์ของผู้ใช้
 * @returns {Promise<Object>} ผลลัพธ์การลบ
 */
export async function deleteProfilePicture() {
  // เรียกใช้ API เพื่อลบรูปภาพ
  const response = await apiCall('delete', '/users/profile-picture');
  
  // ถ้าลบสำเร็จ ให้รีโหลดข้อมูลผู้ใช้
  if (response && response.success === true) {
    await reloadUserProfile();
  }
  
  return response;
}

/**
 * ดึงข้อมูลโปรไฟล์ผู้ใช้ตาม ID
 * @param {string} userId ID ของผู้ใช้ที่ต้องการดูข้อมูล
 * @returns {Promise<Object>} ข้อมูลโปรไฟล์ของผู้ใช้
 */
export async function getUserProfile(userId) {
  const response = await apiCall('get', `/users/profile/${userId}`);
  
  if (response && response.success === true && response.data) {
    return response.data;
  }
  
  return null;
}
/**
 * ดึงข้อมูลผู้ใช้ทั้งหมด (เฉพาะ admin)
 * @returns {Promise<Array>} รายการผู้ใช้ทั้งหมด
 */
export async function getAllUsers() {
  const response = await apiCall('get', '/users');
  
  if (response && response.success === true && response.data) {
    return response.data;
  }
  
  return [];
}

/**
 * ดึงข้อมูลผู้ใช้ตามบทบาท (เฉพาะ admin)
 * @param {string} role บทบาทที่ต้องการกรอง (user หรือ admin)
 * @returns {Promise<Array>} รายการผู้ใช้ที่มีบทบาทตามที่ระบุ
 */
export async function getUsersByRole(role) {
  const response = await apiCall('get', `/users/by-role/${role}`);
  
  if (response && response.success === true && response.data) {
    return response.data;
  }
  
  return [];
}

/**
 * อัปเดตบทบาทผู้ใช้ (เฉพาะ admin)
 * @param {string} userId ID ของผู้ใช้ที่ต้องการเปลี่ยนบทบาท
 * @param {string} role บทบาทใหม่ (user หรือ admin)
 * @returns {Promise<Object>} ผลลัพธ์การอัปเดตบทบาท
 */
export async function updateUserRole(userId, role) {
  // ตรวจสอบความถูกต้องของบทบาท
  if (!['user', 'admin'].includes(role)) {
    return {
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'บทบาทไม่ถูกต้อง กรุณาระบุ user หรือ admin'
    };
  }
  
  const response = await apiCall('patch', `/users/${userId}/role`, { role });
  return response;
}

/**
 * ลบผู้ใช้ (เฉพาะ admin)
 * @param {string} userId ID ของผู้ใช้ที่ต้องการลบ
 * @returns {Promise<Object>} ผลลัพธ์การลบผู้ใช้
 */
export async function deleteUser(userId) {
  const response = await apiCall('delete', `/users/${userId}`);
  return response;
}
/**
 * อัปเดตข้อมูลผู้ใช้โดย admin
 * @param {string} userId ID ของผู้ใช้ที่ต้องการแก้ไข
 * @param {Object} profileData ข้อมูลโปรไฟล์ที่ต้องการอัปเดต
 * @returns {Promise<Object>} ผลลัพธ์การอัปเดต
 */
export async function updateUserByAdmin(userId, profileData) {
  // ตรวจสอบข้อมูลพื้นฐานก่อนส่ง
  if (profileData.username && !profileData.username.trim()) {
    return {
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'ชื่อผู้ใช้เป็นสิ่งจำเป็น'
    };
  }
  
  // ตรวจสอบความยาวของรหัสผ่านใหม่ (ถ้ามี)
  if (profileData.newPassword && profileData.newPassword.length < 6) {
    return {
      success: false,
      errorCode: 'VALIDATION_ERROR',
      message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร'
    };
  }
  
  // เรียกใช้ API เพื่ออัปเดตข้อมูล
  const response = await apiCall('patch', `/users/admin/user/${userId}`, profileData);
  
  return response;
}

/**
 * ดึงอีเมลของผู้ใช้ทั้งหมดที่มีบทบาทเป็นแอดมิน
 * @returns {Promise<Array<string>>} รายการอีเมลของแอดมินทั้งหมด
 */
export async function getAdminEmails() {
  const response = await apiCall('get', '/users/admin-emails-internal');
  
  if (response && response.success === true && response.data) {
    return response.data;
  }
  
  return [];
}

export default {
  getMyProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getUserProfile,
  getAllUsers,
  getUsersByRole,
  updateUserRole,
  deleteUser,
  updateUserByAdmin,
  getAdminEmails    // เพิ่มฟังก์ชันใหม่
};
