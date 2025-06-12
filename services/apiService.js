// services/apiService.js

import axios from 'axios';
import Cookies from 'js-cookie';
import { sendCompletedResultsNotification } from './emailService';

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

// ส่วนที่เหลือของไฟล์คงไว้เหมือนเดิม...
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
      
      throw error;
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

/**
 * ดึงข้อมูลบริการทั้งหมด
 * @returns {Promise<Array>} รายการบริการทั้งหมด พร้อม URL รูปภาพที่พร้อมใช้งาน
 */
export async function getServices() {
  return apiCall('get', '/api/services');
}

/**
 * ดึงข้อมูลแพ็คเกจทั้งหมด
 */
export async function getPackages() {
  return apiCall('get', '/api/packages');
}

export async function getServiceNames() {
  try {
    const services = await apiCall('get', '/api/services');
    
    // สร้าง Map เพื่อแปลง ID เป็นข้อมูลบริการทั้งหมด
    const serviceMap = services.reduce((acc, service) => {
      acc[service._id] = service; // เก็บ service object ทั้งหมด
      return acc;
    }, {});

    return serviceMap;
  } catch (error) {
    console.error('Error fetching service names:', error);
    return {}; // ส่งคืน object ว่างหากเกิดข้อผิดพลาด
  }
}

/**
 * สร้างคำสั่งซื้อใหม่
 * @param {Object} orderData ข้อมูลคำสั่งซื้อ
 * @returns {Promise<Object>} ผลลัพธ์การสร้างคำสั่งซื้อ
 */
export async function createOrder(orderData) {
  try {
    const result = await apiCall('post', '/api/orders', orderData);
    
    return {
      success: true,
      orderId: result._id,
      message: result.message || 'สร้างคำสั่งซื้อสำเร็จ',
      orderData: result
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ',
      error
    };
  }
}

/**
 * ดึงข้อมูลคำสั่งซื้อตาม ID
 * @param {string} orderId รหัสคำสั่งซื้อ
 * @returns {Promise<Object>} ข้อมูลคำสั่งซื้อ
 */
export async function getOrderById(orderId) {
  try {
    const token = Cookies.get('access_token');
    if (!token) {
      throw new Error('No access token found');
    }
    
    // Fetch order data
    const orderData = await apiCall('get', `/api/orders/${orderId}`);
    
    // Fetch candidates for this order
    const candidatesResponse = await apiCall('get', `/api/candidates/order/${orderId}`);
    orderData.candidates = candidatesResponse;
    
    // Fetch service names
    const serviceMap = await getServiceNames();
    
    // Map service names for candidates and check document status
    if (orderData.candidates && orderData.candidates.length > 0) {
      // Process each candidate
      const candidatesWithServices = await Promise.all(orderData.candidates.map(async (candidate) => {
        // For each candidate, get their documents status
        try {
          // ดึงข้อมูลเอกสารที่ขาดของ candidate
          const missingDocsResponse = await apiCall('get', `/api/documents/candidate/${candidate._id}/missing`);
          
          // ดึงข้อมูลเอกสารที่อัปโหลดแล้วของ candidate
          const uploadedDocsResponse = await apiCall('get', `/api/documents/candidate/${candidate._id}/documents`);
          
          // คำนวณจำนวนเอกสารที่ต้องอัปโหลด/ที่อัปโหลดแล้วของแต่ละบริการ
          const servicesWithStatus = candidate.services.map(serviceId => {
            // ดึงชื่อบริการจาก serviceMap
            const serviceTitle = serviceMap[serviceId]?.Service_Title || `บริการ #${serviceId}`;
            
            // นับเอกสารที่ขาดของ service นี้
            const missingDocs = missingDocsResponse.missingDocuments?.filter(
              doc => doc.serviceId === serviceId
            ) || [];
            
            // นับเอกสารที่อัปโหลดแล้วของ service นี้
            const uploadedServiceDocs = uploadedDocsResponse.serviceDocuments?.find(
              sd => sd.service._id === serviceId
            );
            
            const uploadedDocsCount = uploadedServiceDocs ? uploadedServiceDocs.documents.length : 0;
            
            // คำนวณจำนวนเอกสารทั้งหมดที่ต้องการ
            const totalDocsRequired = missingDocs.length + uploadedDocsCount;
            
            return {
              id: serviceId,
              name: serviceTitle,
              missingDocs: missingDocs.length,
              uploadedDocs: uploadedDocsCount,
              totalDocs: totalDocsRequired,
              isComplete: missingDocs.length === 0 && uploadedDocsCount > 0
            };
          });
          
          return {
            ...candidate,
            services: servicesWithStatus
          };
        } catch (error) {
          console.error(`Error processing candidate ${candidate._id}:`, error);
          // If there's an error, return the candidate with basic service info
          return {
            ...candidate,
            services: candidate.services.map(serviceId => ({
              id: serviceId,
              name: serviceMap[serviceId]?.Service_Title || `บริการ #${serviceId}`,
              error: true
            }))
          };
        }
      }));
      
      orderData.candidates = candidatesWithServices;
    }
    
    return orderData;
  } catch (error) {
    console.error('Complete Error getting order:', error);
    throw error;
  }
}

/**
 * ดึงข้อมูลคำสั่งซื้อทั้งหมด (สำหรับ Admin)
 * @returns {Promise<Array>} รายการคำสั่งซื้อทั้งหมด
 */
export async function getAllOrders() {
  return apiCall('get', '/api/orders');
}

/**
 * อัปเดตข้อมูลคำสั่งซื้อ
 * @param {string} orderId รหัสคำสั่งซื้อ
 * @param {Object} orderData ข้อมูลคำสั่งซื้อที่ต้องการอัปเดต
 * @returns {Promise<Object>} ผลลัพธ์การอัปเดตคำสั่งซื้อ
 */
export async function updateOrder(orderId, orderData) {
  try {
    const result = await apiCall('put', `/api/orders/${orderId}`, orderData);
    
    return {
      success: true,
      orderId: orderId,
      message: result.message || 'อัปเดตคำสั่งซื้อสำเร็จ',
      orderData: result
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการอัปเดตคำสั่งซื้อ',
      error
    };
  }
}

/**
 * อัปเดตข้อมูลการชำระเงิน
 * @param {string} orderId รหัสคำสั่งซื้อ
 * @param {FormData} formData ข้อมูลการชำระเงินพร้อมไฟล์ (FormData)
 * @returns {Promise<Object>} ผลลัพธ์การอัปเดตข้อมูลการชำระเงิน
 */
export async function updatePayment(orderId, formData) {
  try {
    // เพิ่ม orderId เข้าไปใน FormData (ถ้ายังไม่มี)
    if (!formData.has('orderId')) {
      formData.append('orderId', orderId);
    }
    
    const result = await apiCall('post', '/api/payments', formData, true);
    
    return {
      success: true,
      orderId: orderId,
      message: 'อัปเดตข้อมูลการชำระเงินสำเร็จ',
      orderData: result
    };
  } catch (error) {
    console.error('Error updating payment:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการชำระเงิน',
      error
    };
  }
}

/**
 * อัปเดตสถานะการชำระเงิน (สำหรับ Admin)
 * @param {string} orderId รหัสคำสั่งซื้อ
 * @param {Object} statusData ข้อมูลสถานะการชำระเงิน
 * @returns {Promise<Object>} ผลลัพธ์การอัปเดตสถานะการชำระเงิน
 */
export async function updatePaymentStatus(paymentId, statusData) {
  try {
    const result = await apiCall('put', `/api/payments/${paymentId}/status`, statusData);
    
    return {
      success: true,
      message: 'อัปเดตสถานะการชำระเงินสำเร็จ',
      data: result
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะการชำระเงิน',
      error
    };
  }
}
/**
 * ดึงข้อมูลคำสั่งซื้อของผู้ใช้ปัจจุบัน
 * @returns {Promise<Array>} รายการคำสั่งซื้อของผู้ใช้ปัจจุบัน
 */
export async function getMyOrders() {
  try {
    return apiCall('get', '/api/orders/my-orders');
  } catch (error) {
    console.error('Error fetching my orders:', error);
    throw error;
  }
}
/**
 * ตรวจสอบสถานะการชำระเงิน
 * @param {string} orderId รหัสคำสั่งซื้อ
 * @returns {Promise<Object>} ข้อมูลสถานะการชำระเงิน
 */
export async function checkPaymentStatus(orderId) {
  return apiCall('get', `/api/orders/${orderId}/payment-status`);
}

/**
 * ลบคำสั่งซื้อตาม ID
 * @param {string} orderId รหัสคำสั่งซื้อ
 * @returns {Promise<Object>} ผลลัพธ์การลบคำสั่งซื้อ
 */
export async function deleteOrder(orderId) {
  try {
    const result = await apiCall('delete', `/api/orders/${orderId}`);
    
    return {
      success: true,
      message: 'ลบคำสั่งซื้อสำเร็จ',
      data: result
    };
  } catch (error) {
    console.error('Error deleting order:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการลบคำสั่งซื้อ',
      error
    };
  }
}

/**
 * ดึงข้อมูลเอกสารที่ต้องการแต่ยังไม่ได้อัปโหลดของผู้สมัคร
 * @param {string} candidateId รหัสผู้สมัคร
 * @returns {Promise<Object>} ข้อมูลเอกสารที่ยังขาดของผู้สมัคร
 */
export async function getMissingDocuments(candidateId) {
  return apiCall('get', `/api/documents/candidate/${candidateId}/missing`);
}

/**
 * ดึงข้อมูลเอกสารที่อัปโหลดแล้วของผู้สมัคร
 * @param {string} candidateId รหัสผู้สมัคร
 * @returns {Promise<Object>} ข้อมูลเอกสารที่อัปโหลดแล้วของผู้สมัคร
 */
export async function getUploadedDocuments(candidateId) {
  return apiCall('get', `/api/documents/candidate/${candidateId}/documents`);
}

/**
 * อัปโหลดเอกสาร
 * @param {FormData} formData ข้อมูลเอกสารพร้อมไฟล์ (FormData)
 * @returns {Promise<Object>} ผลลัพธ์การอัปโหลดเอกสาร
 */
export async function uploadDocument(formData) {
  try {
    const result = await apiCall('post', '/api/documents/upload', formData, true);
    return {
      success: true,
      message: 'อัปโหลดเอกสารสำเร็จ',
      data: result
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการอัปโหลดเอกสาร',
      error
    };
  }
}

/**
 * อัปโหลดเอกสารทั้งหมดพร้อมกัน
 * @param {Object} data ข้อมูลและไฟล์ทั้งหมดที่ต้องการอัปโหลด
 * @returns {Promise<Object>} ผลลัพธ์การอัปโหลดเอกสารทั้งหมด
 */
export async function uploadDocuments(data) {
  // ถ้าไม่มีไฟล์ให้อัปโหลด
  if (!data || !data.files || Object.keys(data.files).length === 0) {
    return {
      success: false,
      message: 'ไม่มีไฟล์ให้อัปโหลด'
    };
  }
  
  try {
    // สร้าง array ของ promises สำหรับอัปโหลดแต่ละไฟล์
    const uploadPromises = Object.keys(data.files).map(key => {
      // ข้ามไฟล์ที่เป็น null
      if (!data.files[key]) return null;
      
      // แยกข้อมูลเกี่ยวกับไฟล์ (รูปแบบของ key คือ 'ServiceName_docId')
      const [serviceName, docId] = key.split('_');
      const serviceId = data.serviceIds[serviceName];
      
      // สร้าง FormData สำหรับแต่ละไฟล์
      const formData = new FormData();
      formData.append('file', data.files[key]); // ไฟล์ที่จะอัปโหลด
      formData.append('candidateId', data.candidateId);
      formData.append('serviceId', serviceId);
      formData.append('documentType', docId);
      
      // อัปโหลดไฟล์
      return uploadDocument(formData);
    }).filter(p => p !== null); // กรองเอาเฉพาะ promises ที่ไม่ใช่ null
    
    // รอให้การอัปโหลดทั้งหมดเสร็จสิ้น
    const results = await Promise.all(uploadPromises);
    
    // ตรวจสอบว่ามีการอัปโหลดที่ล้มเหลวหรือไม่
    const failedUploads = results.filter(result => !result.success);
    
    if (failedUploads.length > 0) {
      return {
        success: false,
        message: `มีเอกสาร ${failedUploads.length} รายการที่อัปโหลดไม่สำเร็จ`,
        details: failedUploads
      };
    }
    
    return {
      success: true,
      message: `อัปโหลดเอกสารทั้งหมด ${results.length} รายการสำเร็จ`,
      results
    };
  } catch (error) {
    console.error('Error uploading documents:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปโหลดเอกสาร',
      error
    };
  }
}

export async function updateOrderToProcessing(orderId) {
  try {
    // เนื่องจากไม่มี API endpoint สำหรับผู้ใช้ทั่วไปในการเปลี่ยนสถานะโดยตรง
    // เราจึงสร้าง API endpoint พิเศษสำหรับการอัพเดทสถานะหลังจากอัปโหลดเอกสารครบแล้ว
    const result = await apiCall('put', `/api/orders/${orderId}/complete-documents`, {
      status: 'processing'
    });
    
    return {
      success: true,
      message: 'อัปเดตสถานะคำสั่งซื้อสำเร็จ',
      data: result
    };
  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะคำสั่งซื้อ',
      error
    };
  }
}
/**
 * ลบเอกสาร
 * @param {string} documentId รหัสเอกสาร
 * @returns {Promise<Object>} ผลลัพธ์การลบเอกสาร
 */
export async function deleteDocument(documentId) {
  try {
    await apiCall('delete', `/api/documents/${documentId}`);
    
    return {
      success: true,
      message: 'ลบเอกสารสำเร็จ'
    };
  } catch (error) {
    console.error('Error deleting document:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการลบเอกสาร',
      error
    };
  }
}

/**
 * ยืนยันเอกสาร (สำหรับ Admin)
 * @param {string} documentId รหัสเอกสาร
 * @returns {Promise<Object>} ผลลัพธ์การยืนยันเอกสาร
 */
export async function verifyDocument(documentId) {
  try {
    const result = await apiCall('post', `/api/documents/${documentId}/verify`);
    
    return {
      success: true,
      message: 'ยืนยันเอกสารสำเร็จ',
      data: result
    };
  } catch (error) {
    console.error('Error verifying document:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการยืนยันเอกสาร',
      error
    };
  }
}


/**
 * ค้นหาข้อมูลการตรวจสอบประวัติด้วย Tracking Number
 * @param {string} trackingNumber รหัสติดตามการตรวจสอบประวัติ
 * @returns {Promise<Object>} ข้อมูลการตรวจสอบประวัติ
 */
export async function trackOrderByTrackingNumber(trackingNumber) {
  try {
    // ตรวจสอบรูปแบบเบื้องต้น
    if (!trackingNumber.startsWith('SCT')) {
      return {
        success: false,
        message: 'รหัสอ้างอิงไม่ถูกต้อง รหัสควรขึ้นต้นด้วย SCT ตามด้วยตัวเลข'
      };
    }

    // ใช้ endpoint ที่ไม่ต้องการการยืนยันตัวตน
    const axios = require('axios');
    const instance = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3500', // ใช้ค่าเริ่มต้นหากไม่มี env
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    console.log(`🔄 Public API Call: GET /api/orders/public/track/${trackingNumber}`);
    console.time(`Public API GET /api/orders/public/track/${trackingNumber}`);
    
    const response = await instance.get(`/api/orders/public/track/${trackingNumber}`);
    
    console.timeEnd(`Public API GET /api/orders/public/track/${trackingNumber}`);
    console.log(`✅ Public API Success: GET /api/orders/public/track/${trackingNumber}`, response.data);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`❌ Error tracking order with number ${trackingNumber}:`, error);
    
    let errorMessage = 'ไม่พบข้อมูลการตรวจสอบประวัติตามรหัสที่ระบุ';
    
    if (error.response) {
      if (error.response.status === 404) {
        errorMessage = 'ไม่พบข้อมูลที่ตรงกับรหัสอ้างอิงที่ระบุ โปรดตรวจสอบความถูกต้องและลองอีกครั้ง';
      } else if (error.response.status === 400) {
        errorMessage = 'รูปแบบรหัสอ้างอิงไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง';
      } else if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    } else if (error.request) {
      errorMessage = 'ไม่สามารถเชื่อมต่อกับระบบได้ในขณะนี้ กรุณาลองใหม่ภายหลัง';
    }
    
    return {
      success: false,
      message: errorMessage,
      error
    };
  }
}
/**
 * อัปโหลดไฟล์ผลการตรวจสอบให้กับ Candidate
 * @param {string} candidateId รหัสผู้สมัคร
 * @param {FormData} formData ข้อมูลผลการตรวจสอบพร้อมไฟล์ (FormData)
 * @param {string} orderId รหัสคำสั่งซื้อ (ส่งมาเพื่อตรวจสอบการอัปโหลดครบ)
 * @returns {Promise<Object>} ผลลัพธ์การอัปโหลดผลการตรวจสอบ
 */
export async function uploadResultFile(candidateId, formData, orderId = null) {
  try {
    // สร้าง instance ของ axios สำหรับอัปโหลดไฟล์
    const token = Cookies.get('access_token');
    const api = axios.create({
      baseURL: process.env.API_URL,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true,
      timeout: 60000
    });
    
    console.log(`🔄 Making API call: POST /api/candidates/${candidateId}/upload-result`);
    const response = await api.post(`/api/candidates/${candidateId}/upload-result`, formData);
    console.log(`✅ API call successful:`, response.data);
    
    if (orderId) {
      console.log(`Checking if all results are uploaded for order ${orderId}`);
      try {
        await checkAndNotifyIfAllResultsUploaded(orderId);
      } catch (error) {
        console.error(`Error checking/notifying for order ${orderId}:`, error);
      }
    } else {
      console.log(`Skip checking - no orderId provided`);
    }
    
    return {
      success: true,
      message: 'อัปโหลดผลการตรวจสอบสำเร็จ',
      data: response.data
    };
  } catch (error) {
    console.error('Error uploading result file:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการอัปโหลดผลการตรวจสอบ',
      error
    };
  }
}

/**
 * ตรวจสอบว่าคำสั่งซื้อมีการอัปโหลดผลการตรวจสอบครบทุกคนหรือยัง
 * ถ้าครบแล้วจะอัปเดตสถานะคำสั่งซื้อและส่งอีเมลแจ้งเตือนไปยังลูกค้า
 * @param {string} orderId รหัสคำสั่งซื้อ
 * @returns {Promise<boolean>} ผลการตรวจสอบ
 */
export async function checkAndNotifyIfAllResultsUploaded(orderId) {
  console.log(`📋 Checking results for order ${orderId}`);
  
  try {
    // 1. ดึงข้อมูลคำสั่งซื้อล่าสุดพร้อมกับข้อมูล candidates
    console.log(`🔍 Fetching order data for ${orderId}`);
    const order = await getOrderById(orderId);
    
    if (!order) {
      console.error(`❌ Order ${orderId} not found`);
      return false;
    }
    
    if (!order.candidates || order.candidates.length === 0) {
      console.log(`⚠️ No candidates found for order ${orderId}`);
      return false;
    }
    
    console.log(`ℹ️ Order ${orderId} has ${order.candidates.length} candidates`);
    
    // 2. ตรวจสอบว่ามีผลการตรวจสอบสำหรับทุกคนหรือไม่
    const totalCandidates = order.candidates.length;
    const candidatesWithResults = order.candidates.filter(c => c.result !== null);
    const completedResults = candidatesWithResults.length;
    
    console.log(`ℹ️ Order ${orderId}: ${completedResults}/${totalCandidates} candidates have results`);
    
    // แสดงสถานะของแต่ละ candidate
    order.candidates.forEach((c, index) => {
      console.log(`ℹ️ Candidate #${index+1}: ${c.C_FullName} - Result: ${c.result ? 'YES' : 'NO'}`);
    });
    
    // 3. ตรวจสอบว่ายังอัปโหลดไม่ครบ
    if (completedResults < totalCandidates) {
      console.log(`⏳ Still need ${totalCandidates - completedResults} more results for order ${orderId}`);
      return false;
    }
    
    // 4. ถ้าครบทุกคนแล้ว
    console.log(`✅ All ${totalCandidates} candidates have results for order ${orderId}`);
    
    // 5. แปลงข้อมูลผลการตรวจสอบให้อยู่ในรูปแบบที่เหมาะกับการส่งอีเมล
    const results = order.candidates.map(candidate => ({
      candidateName: candidate.C_FullName,
      candidateEmail: candidate.C_Email,
      resultStatus: candidate.result ? candidate.result.resultStatus : 'unknown',
      resultNotes: candidate.result ? candidate.result.resultNotes : '',
      resultDate: candidate.result ? candidate.result.createdAt : new Date()
    }));
    
    console.log(`📊 Prepared result data for ${results.length} candidates`);
    
    // 6. อัปเดตสถานะคำสั่งซื้อเป็น 'completed' ถ้ายังไม่ได้อัปเดต
    if (order.OrderStatus !== 'completed') {
      console.log(`📝 Updating order status to 'completed' for order ${orderId}`);
      try {
        const updateResult = await updateOrderStatus(orderId, 'completed');
        console.log(`✅ Order status updated:`, updateResult);
      } catch (updateError) {
        console.error(`❌ Error updating order status:`, updateError);
        // ทำงานต่อไปแม้จะอัพเดตสถานะไม่สำเร็จ
      }
    } else {
      console.log(`ℹ️ Order ${orderId} already has 'completed' status`);
    }
    
    // 7. ส่งอีเมลแจ้งเตือนไปยังลูกค้า
    console.log(`📧 Sending email notification for order ${orderId}`);
    
    // ตรวจสอบข้อมูลที่จำเป็นก่อนส่งอีเมล
    if (!order.user || !order.user.email) {
      console.error(`❌ Customer email not found in order ${orderId}`);
      return false;
    }
    
    try {
      const emailResult = await sendCompletedResultsNotification(order, results);
      console.log(`📧 Email notification result:`, emailResult);
      
      if (emailResult) {
        console.log(`✅ Email notification sent successfully`);
      } else {
        console.error(`❌ Failed to send email notification`);
      }
    } catch (emailError) {
      console.error(`❌ Error sending email notification:`, emailError);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error checking order completion for ${orderId}:`, error);
    return false;
  }
}




/**
 * อัปเดตสถานะของคำสั่งซื้อ
 * @param {string} orderId รหัสคำสั่งซื้อ
 * @param {string} status สถานะใหม่ ('awaiting_payment', 'pending_verification', 'payment_verified', 'processing', 'completed', 'cancelled')
 * @returns {Promise<Object>} ผลลัพธ์การอัปเดตสถานะ
 */
export async function updateOrderStatus(orderId, status) {
  try {
    const response = await apiCall('put', `/api/orders/${orderId}/status`, { status });
    
    return {
      success: true,
      message: 'อัปเดตสถานะคำสั่งซื้อสำเร็จ',
      data: response
    };
  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะคำสั่งซื้อ',
      error
    };
  }
}

/**
 * ตรวจสอบคูปอง - เวอร์ชันที่แก้ไขแล้ว
 * @param {string} code รหัสคูปอง
 * @param {number} subtotal ราคารวมก่อนหักส่วนลด
 * @param {number} promotionDiscount ส่วนลดจากโปรโมชั่น
 * @returns {Promise<Object>} ข้อมูลคูปอง
 */
export async function checkCoupon(code, subtotal, promotionDiscount) {
  try {
    // ตรวจสอบ input parameters
    if (!code || typeof code !== 'string' || code.trim() === '') {
      throw new Error('รหัสคูปองไม่ถูกต้อง');
    }
    
    if (typeof subtotal !== 'number' || subtotal <= 0) {
      throw new Error('ยอดรวมไม่ถูกต้อง');
    }
    
    if (typeof promotionDiscount !== 'number' || promotionDiscount < 0) {
      throw new Error('ส่วนลดโปรโมชั่นไม่ถูกต้อง');
    }
    
    const requestData = {
      code: code.trim().toUpperCase(), // ทำให้เป็นตัวพิมพ์ใหญ่และตัดช่องว่าง
      subtotal: Math.round(subtotal), // ปัดเศษให้เป็นจำนวนเต็ม
      promotionDiscount: Math.round(promotionDiscount) // ปัดเศษให้เป็นจำนวนเต็ม
    };
    
    console.log('🔄 Checking coupon with data:', requestData);
    
    const result = await apiCall('post', '/api/coupons/check', requestData);
    
    console.log('✅ Coupon check successful:', result);
    
    // ตรวจสอบ response structure
    if (!result || !result.coupon) {
      throw new Error('ข้อมูลคูปองจากเซิร์ฟเวอร์ไม่ครบถ้วน');
    }
    
    if (typeof result.discountAmount !== 'number' || result.discountAmount < 0) {
      throw new Error('จำนวนส่วนลดไม่ถูกต้อง');
    }
    
    return {
      success: true,
      coupon: result.coupon,
      discountAmount: result.discountAmount
    };
  } catch (error) {
    console.error('❌ Error checking coupon:', error);
    
    // จัดการ error response
    let errorMessage = 'ไม่สามารถตรวจสอบคูปองได้';
    
    if (error.response?.status === 400) {
      // Bad request - อาจเป็นปัญหาจากข้อมูลที่ส่งไป
      errorMessage = error.response.data?.message || 'ข้อมูลที่ส่งไปไม่ถูกต้อง';
    } else if (error.response?.status === 404) {
      errorMessage = 'ไม่พบคูปองนี้ในระบบ';
    } else if (error.response?.status === 401) {
      errorMessage = 'กรุณาเข้าสู่ระบบใหม่';
    } else if (error.response?.status === 500) {
      errorMessage = 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage,
      error: error
    };
  }
}

/**
 * ตรวจสอบคูปองสำหรับ Order เฉพาะ
 * @param {string} orderId รหัส Order
 * @param {string} couponCode รหัสคูปอง
 * @returns {Promise<Object>} ข้อมูลคูปอง
 */
export async function checkOrderCoupon(orderId, couponCode) {
  try {
    const result = await apiCall('post', `/api/orders/${orderId}/check-coupon`, {
      couponCode
    });
    
    return {
      success: true,
      coupon: result.coupon,
      discountAmount: result.discountAmount
    };
  } catch (error) {
    console.error('Error checking order coupon:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'ไม่สามารถตรวจสอบคูปองได้',
      error
    };
  }
}

/**
 * ใช้คูปองกับ Order
 * @param {string} orderId รหัส Order
 * @param {string} couponCode รหัสคูปอง
 * @returns {Promise<Object>} ข้อมูลคูปองและ Order ที่อัปเดตแล้ว
 */
export async function applyOrderCoupon(orderId, couponCode) {
  try {
    const result = await apiCall('post', `/api/orders/${orderId}/apply-coupon`, {
      couponCode
    });
    
    return {
      success: true,
      coupon: result.coupon,
      discountAmount: result.discountAmount,
      order: result.order
    };
  } catch (error) {
    console.error('Error applying coupon to order:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'ไม่สามารถใช้คูปองได้',
      error
    };
  }
}

/**
 * ยกเลิกการใช้คูปองกับ Order
 * @param {string} orderId รหัส Order
 * @returns {Promise<Object>} ข้อมูล Order ที่อัปเดตแล้ว
 */
export async function removeOrderCoupon(orderId) {
  try {
    const result = await apiCall('delete', `/api/orders/${orderId}/coupon`);
    
    return {
      success: true,
      order: result
    };
  } catch (error) {
    console.error('Error removing coupon from order:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'ไม่สามารถยกเลิกคูปองได้',
      error
    };
  }
}

/**
 * สร้างคูปองจากแบบสอบถาม
 * @returns {Promise<Object>} ข้อมูลคูปองที่สร้างหรือข้อมูลคูปองที่มีอยู่แล้ว
 */
export async function createSurveyCoupon() {
  try {
    const token = Cookies.get('access_token');
    
    if (!token) {
      return {
        success: false,
        message: 'ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่',
        error: true
      };
    }

    const api = axios.create({
      baseURL: process.env.API_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      timeout: 60000
    });

    console.log(`🔄 Making API call: POST /api/coupons/survey-coupon`);
    
    const response = await api.post('/api/coupons/survey-coupon');
    console.log(`✅ API call successful:`, response.data);

    // Backend ตอนนี้ส่งคืน response ที่มี structure ชัดเจนแล้ว
    // ไม่ต้องแปลงอะไรเพิ่มเติม
    return response.data;

  } catch (error) {
    console.error(`❌ API call failed:`, error);
    
    // จัดการ error response จาก backend
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์',
        error: true
      };
    }
    
    // จัดการ network error หรือ timeout
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง',
        error: true
      };
    }
    
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      error: true
    };
  }
}

/**
 * ดึงรายการคูปองของผู้ใช้
 * @param {boolean} includeUsed รวมคูปองที่ใช้แล้วหรือไม่
 * @returns {Promise<Object>} รายการคูปองของผู้ใช้
 */
export async function getUserCoupons(includeUsed = false) {
  try {
    const token = Cookies.get('access_token');
    
    if (!token) {
      return {
        success: false,
        message: 'ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่',
        error: true
      };
    }

    const api = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3000',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      timeout: 15000
    });

    // ✅ เพิ่ม query parameter
    const endpoint = `/api/coupons/my-coupons${includeUsed ? '?includeUsed=true' : ''}`;
    console.log(`🔄 Making API call: GET ${endpoint}`);
    
    const response = await api.get(endpoint);
    console.log('✅ API call successful:', response.data);

    return {
      success: true,
      coupons: response.data
    };
  } catch (error) {
    console.error('❌ Error fetching user coupons:', error);
    
    if (error.response?.data) {
      return {
        success: false,
        message: error.response.data.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์',
        error: true
      };
    }
    
    return {
      success: false,
      message: error.message || 'ไม่สามารถดึงข้อมูลคูปองได้',
      error: true
    };
  }
}

/**
 * ดึงข้อมูลภาพรวมคูปองสำหรับ Admin
 * @returns {Promise<Object>} ข้อมูลภาพรวมคูปอง
 */
export async function getAdminCouponOverview() {
  try {
    const result = await apiCall('get', '/api/coupons/admin/overview');
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error fetching admin coupon overview:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'ไม่สามารถดึงข้อมูลภาพรวมคูปองได้',
      error
    };
  }
}

/**
 * ดึงรายการคูปองสาธารณะ
 * @returns {Promise<Object>} รายการคูปองสาธารณะ
 */
export async function getPublicCoupons() {
  try {
    const token = Cookies.get('access_token');
    
    if (!token) {
      return {
        success: false,
        message: 'ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่',
        error: true
      };
    }

    const api = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3000',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      timeout: 15000
    });

    console.log('🔄 Making API call: GET /api/coupons/public');
    
    const response = await api.get('/api/coupons/public');
    console.log('✅ API call successful:', response.data);

    return {
      success: true,
      coupons: response.data
    };
  } catch (error) {
    console.error('❌ Error fetching public coupons:', error);
    
    if (error.response?.data) {
      return {
        success: false,
        message: error.response.data.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์',
        error: true
      };
    }
    
    return {
      success: false,
      message: error.message || 'ไม่สามารถดึงข้อมูลคูปองสาธารณะได้',
      error: true
    };
  }
}


// services/apiService.js - แก้ไข claimCoupon ให้เหมือน createSurveyCoupon

/**
 * เก็บคูปองสาธารณะ
 * @param {string} couponId รหัสคูปอง
 * @returns {Promise<Object>} ผลลัพธ์การเก็บคูปอง
 */
export async function claimCoupon(couponId) {
  try {
    console.log('🔄 Claiming coupon with ID:', couponId);
    
    // ✅ ใช้แบบเดียวกับ createSurveyCoupon
    const token = Cookies.get('access_token');
    
    if (!token) {
      return {
        success: false,
        message: 'ไม่พบข้อมูลการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่',
        error: true
      };
    }

    // ตรวจสอบ input
    if (!couponId) {
      return {
        success: false,
        message: 'รหัสคูปองไม่ถูกต้อง',
        error: true
      };
    }

    // ✅ สร้าง axios instance เหมือน createSurveyCoupon
    const api = axios.create({
      baseURL: process.env.API_URL || 'http://localhost:3000',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      timeout: 60000
    });

    console.log(`🔄 Making API call: POST /api/coupons/claim/${couponId}`);
    
    const response = await api.post(`/api/coupons/claim/${couponId}`);
    console.log(`✅ API call successful:`, response.data);

    // ✅ ตรวจสอบ response structure
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('ข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง');
    }
    
    // ถ้า backend ส่ง success: false มา
    if (response.data.success === false) {
      return {
        success: false,
        message: response.data.message || 'ไม่สามารถเก็บคูปองได้',
        error: true
      };
    }
    
    // ✅ ส่งข้อมูลกลับเหมือน createSurveyCoupon
    return response.data;

  } catch (error) {
    console.error(`❌ API call failed:`, error);
    
    // ✅ จัดการ error เหมือน createSurveyCoupon
    if (error.response && error.response.data) {
      return {
        success: false,
        message: error.response.data.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์',
        error: true
      };
    }
    
    // จัดการ network error หรือ timeout
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง',
        error: true
      };
    }
    
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      error: true
    };
  }
}

/**
 * สร้างคูปองสาธารณะ (Admin)
 * @param {Object} couponData ข้อมูลคูปอง
 * @returns {Promise<Object>} ผลลัพธ์การสร้างคูปอง
 */
export async function createPublicCoupon(couponData) {
  try {
    const result = await apiCall('post', '/api/coupons/public', couponData);
    
    return {
      success: true,
      coupon: result,
      message: 'สร้างคูปองสำเร็จ'
    };
  } catch (error) {
    console.error('Error creating public coupon:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'ไม่สามารถสร้างคูปองได้',
      error
    };
  }
}

/**
 * ลบคูปอง (Admin)
 * @param {string} couponId รหัสคูปอง
 * @returns {Promise<Object>} ผลลัพธ์การลบคูปอง
 */
export async function deleteCoupon(couponId) {
  try {
    await apiCall('delete', `/api/coupons/${couponId}`);
    
    return {
      success: true,
      message: 'ลบคูปองสำเร็จ'
    };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'ไม่สามารถลบคูปองได้',
      error
    };
  }
}

/**
 * ดึงรายการคูปองทั้งหมด (Admin)
 * @returns {Promise<Object>} รายการคูปองทั้งหมด
 */
export async function getAllCoupons() {
  try {
    const result = await apiCall('get', '/api/coupons');
    
    return {
      success: true,
      coupons: result
    };
  } catch (error) {
    console.error('Error fetching all coupons:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'ไม่สามารถดึงข้อมูลคูปองทั้งหมดได้',
      error
    };
  }
}

/**
 * ตรวจสอบสถานะการเก็บคูปอง
 * @param {Array} couponIds รายการรหัสคูปอง
 * @returns {Promise<Object>} สถานะการเก็บคูปอง
 */
export async function getClaimedStatus(couponIds) {
  try {
    const couponIdsString = couponIds.join(',');
    const result = await apiCall('get', `/api/coupons/claimed-status?couponIds=${couponIdsString}`);
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error fetching claimed status:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'ไม่สามารถตรวจสอบสถานะการเก็บคูปองได้',
      error
    };
  }
}
/**
 * ดึงข้อมูลเอกสารของผู้สมัคร (สำหรับหน้าแสดงเอกสาร)
 * @param {string} candidateId รหัสผู้สมัคร
 * @returns {Promise<Object>} ข้อมูลเอกสารของผู้สมัคร
 */
export async function getDocumentsByCandidate(candidateId) {
  try {
    // ดึงข้อมูลเอกสารที่อัปโหลดแล้ว
    const uploadedDocs = await apiCall('get', `/api/documents/candidate/${candidateId}/documents`);
    
    // ดึงข้อมูลเอกสารที่ยังขาด
    const missingDocs = await apiCall('get', `/api/documents/candidate/${candidateId}/missing`);
    
    // ดึงข้อมูลผู้สมัคร
    const candidate = await apiCall('get', `/api/candidates/${candidateId}`);
    
    // จัดรูปแบบข้อมูลให้ตรงกับที่คอมโพเนนต์ต้องการ
    return {
      candidate: {
        _id: candidate._id,
        name: candidate.C_FullName,
        email: candidate.C_Email,
        company: candidate.C_Company_Name
      },
      serviceDocuments: uploadedDocs.serviceDocuments || [],
      missingDocuments: missingDocs.missingDocuments || []
    };
  } catch (error) {
    console.error('Error fetching candidate documents:', error);
    throw error;
  }
 
}

/**
 * ดึงจำนวนคำสั่งซื้อของผู้ใช้แต่ละคน (สำหรับ Admin)
 * @returns {Promise<Object>} จำนวนคำสั่งซื้อของผู้ใช้แต่ละคนในรูปแบบ { userId: count }
 */
export async function getOrderCountByUser() {
  try {
    // เริ่มต้นด้วยการพยายามเรียก API endpoint ใหม่
    try {
      const result = await apiCall('get', '/api/orders/count-by-user');
      if (result && typeof result === 'object') {
        return result;
      }
      throw new Error('ข้อมูลที่ได้รับไม่อยู่ในรูปแบบที่ถูกต้อง');
    } catch (newApiError) {
      console.warn('ไม่สามารถใช้ API ใหม่ได้, กำลังใช้วิธีเดิม:', newApiError.message);
      
      // ถ้า API ใหม่ไม่ทำงาน ให้ใช้วิธีเดิมโดยดึงข้อมูลคำสั่งซื้อทั้งหมด
      const orders = await apiCall('get', '/api/orders');
      
      if (!Array.isArray(orders)) {
        throw new Error('ข้อมูลคำสั่งซื้อไม่อยู่ในรูปแบบที่ถูกต้อง');
      }
      
      // นับจำนวนคำสั่งซื้อของผู้ใช้แต่ละคน
      const orderCounts = {};
      orders.forEach(order => {
        if (order.user && order.user._id) {
          const userId = typeof order.user._id === 'object' 
            ? order.user._id.toString() 
            : order.user._id;
          
          orderCounts[userId] = (orderCounts[userId] || 0) + 1;
        }
      });
      
      return orderCounts;
    }
  } catch (error) {
    console.error('Error fetching order count by user:', error);
    return {};
  }
}

/**
 * ดึงข้อมูลคำสั่งซื้อของผู้ใช้ตาม User ID
 * @param {string} userId รหัสผู้ใช้
 * @returns {Promise<Array>} รายการคำสั่งซื้อของผู้ใช้
 */
export async function getUserOrders(userId) {
  try {
    return apiCall('get', `/api/orders/user/${userId}`);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
}