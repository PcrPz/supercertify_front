// services/paymentSettingsApi.js
import axios from 'axios';
import Cookies from 'js-cookie';

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
  
  const instance = axios.create({
    baseURL: process.env.API_URL,
    headers: {
      'Authorization': `Bearer ${token}`
    },
    withCredentials: true,
    timeout: 30000 // กำหนด timeout นานขึ้นสำหรับการอัปโหลดไฟล์
  });
  
  // เพิ่ม interceptor เหมือนกับที่ทำในส่วน createApiInstance
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
      case 'delete':
        response = await api.delete(endpoint, config);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    
    console.timeEnd(`API ${method.toUpperCase()} ${endpoint}`);
    console.log(`✅ API Success: ${method.toUpperCase()} ${endpoint}`, response.data);
    
    return response.data;
  } catch (error) {
    console.timeEnd(`API ${method.toUpperCase()} ${endpoint}`);
    
    // จัดการ error แบบละเอียด
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || error.response.statusText || 'Server Error';
      console.error(`❌ API Error: ${method.toUpperCase()} ${endpoint}`, {
        status: error.response.status,
        message: errorMessage,
        data: error.response.data
      });
      
      // สร้าง error object ที่มีข้อมูลครบถ้วน
      const apiError = new Error(errorMessage);
      apiError.status = error.response.status;
      apiError.response = error.response;
      throw apiError;
    } else if (error.request) {
      // Network error
      console.error(`❌ Network Error: ${method.toUpperCase()} ${endpoint}`, error.message);
      throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } else {
      // Other error
      console.error(`❌ API Error: ${method.toUpperCase()} ${endpoint}`, error.message);
      throw error;
    }
  }
};

// ============ Payment Settings API Functions ============

/**
 * ดึงข้อมูล Payment Methods (Public - ไม่ต้อง auth)
 * @returns {Promise<Object>} ข้อมูล payment methods
 */
export async function getPaymentMethods() {
  try {
    // ใช้ axios โดยตรงเพราะเป็น public API (ไม่ต้อง token)
    const response = await axios.get(`${process.env.API_URL}/api/settings/payment_methods`, {
      timeout: 15000
    });
    
    console.log('✅ Payment methods retrieved successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error getting payment methods:', error);
    
    // Return default data ถ้าเกิด error
    return {
      qr_payment: {
        enabled: true,
        account_name: 'บริษัท SuperCertify จำกัด',
        account_number: '0-9999-99999-99-9',
        qr_image: null,
        description: 'ชำระเงินผ่าน QR Code พร้อมเพย์'
      },
      bank_transfer: {
        enabled: true,
        bank_name: 'ธนาคารกสิกรไทย',
        account_name: 'บริษัท SuperCertify จำกัด',
        account_number: 'XXX-X-XXXXX-X',
        description: 'โอนเงินผ่านธนาคาร'
      }
    };
  }
}

/**
 * อัปเดต Payment Methods (Admin only)
 * @param {Object} paymentData ข้อมูล payment methods
 * @returns {Promise<Object>} ผลลัพธ์การอัปเดต
 */
export async function updatePaymentMethods(paymentData) {
  try {
    const result = await apiCall('put', '/api/settings/payment_methods', paymentData);
    
    return {
      success: true,
      data: result.data,
      message: result.message || 'อัปเดตการตั้งค่าการชำระเงินสำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการอัปเดตการตั้งค่าการชำระเงิน',
      error
    };
  }
}

/**
 * อัปโหลด QR Code Image (Admin only)
 * @param {File} qrImageFile ไฟล์รูปภาพ QR Code
 * @returns {Promise<Object>} ผลลัพธ์การอัปโหลด
 */
export async function uploadQrCodeImage(qrImageFile) {
  try {
    // Validate file
    if (qrImageFile.size > 5 * 1024 * 1024) { // 5MB
      throw new Error('ขนาดไฟล์ใหญ่เกิน 5MB');
    }

    if (!qrImageFile.type.startsWith('image/')) {
      throw new Error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('qr_image', qrImageFile);

    const result = await apiCall('post', '/api/settings/payment_methods/upload-qr', formData, true);
    
    return {
      success: true,
      qr_image_url: result.qr_image_url,
      data: result.data,
      message: result.message || 'อัปโหลด QR Code สำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการอัปโหลด QR Code',
      error
    };
  }
}

/**
 * Validate Payment Methods Data (Admin only)
 * @param {Object} paymentData ข้อมูลที่ต้องการ validate
 * @returns {Promise<Object>} ผลลัพธ์การ validate
 */
export async function validatePaymentMethods(paymentData) {
  try {
    const result = await apiCall('post', '/api/settings/payment_methods/validate', paymentData);
    
    return {
      success: true,
      valid: result.valid,
      errors: result.errors || [],
      message: result.valid ? 'ข้อมูลถูกต้อง' : 'พบข้อผิดพลาดในข้อมูล'
    };
  } catch (error) {
    return {
      success: false,
      valid: false,
      errors: [error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการ validate'],
      message: 'ไม่สามารถตรวจสอบข้อมูลได้'
    };
  }
}

/**
 * ดึงข้อมูล Settings ทั้งหมด (Admin only)
 * @returns {Promise<Object>} รายการ settings ทั้งหมด
 */
export async function getAllSettings() {
  try {
    const result = await apiCall('get', '/api/settings');
    
    return {
      success: true,
      data: result.data,
      message: 'ดึงข้อมูลการตั้งค่าทั้งหมดสำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า',
      error
    };
  }
}

/**
 * ดึงข้อมูล Setting ตาม Key
 * @param {string} key ชื่อ setting key
 * @returns {Promise<Object>} ข้อมูล setting
 */
export async function getSettingByKey(key) {
  try {
    // สำหรับ payment_methods ใช้ function เฉพาะ
    if (key === 'payment_methods') {
      return await getPaymentMethods();
    }
    
    const result = await apiCall('get', `/api/settings/${key}`);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        message: `ดึงข้อมูลการตั้งค่า '${key}' สำเร็จ`
      };
    } else {
      return {
        success: false,
        message: result.message || `ไม่พบการตั้งค่า '${key}'`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || `เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า '${key}'`,
      error
    };
  }
}

/**
 * อัปเดต Setting (Admin only)
 * @param {string} key ชื่อ setting key
 * @param {any} value ค่าใหม่
 * @returns {Promise<Object>} ผลลัพธ์การอัปเดต
 */
export async function updateSetting(key, value) {
  try {
    // สำหรับ payment_methods ใช้ function เฉพาะ
    if (key === 'payment_methods') {
      return await updatePaymentMethods(value);
    }
    
    const result = await apiCall('put', `/api/settings/${key}`, value);
    
    return {
      success: true,
      data: result.data,
      message: result.message || `อัปเดตการตั้งค่า '${key}' สำเร็จ`
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || `เกิดข้อผิดพลาดในการอัปเดตการตั้งค่า '${key}'`,
      error
    };
  }
}

// ============ Helper Functions ============

/**
 * ตรวจสอบสถานะ Payment Methods
 * @returns {Promise<Object>} สถานะการเปิดใช้งาน
 */
export async function checkPaymentMethodsStatus() {
  try {
    const paymentMethods = await getPaymentMethods();
    
    return {
      success: true,
      qr_enabled: paymentMethods.qr_payment?.enabled || false,
      bank_enabled: paymentMethods.bank_transfer?.enabled || false,
      has_qr_image: !!paymentMethods.qr_payment?.qr_image,
      any_enabled: (paymentMethods.qr_payment?.enabled || paymentMethods.bank_transfer?.enabled) || false
    };
  } catch (error) {
    return {
      success: false,
      message: 'ไม่สามารถตรวจสอบสถานะการชำระเงินได้',
      error
    };
  }
}

/**
 * ดึง QR Code URL
 * @returns {Promise<string|null>} URL ของ QR Code หรือ null
 */
export async function getQrCodeUrl() {
  try {
    const paymentMethods = await getPaymentMethods();
    return paymentMethods.qr_payment?.qr_image || null;
  } catch (error) {
    console.error('Error getting QR code URL:', error);
    return null;
  }
}