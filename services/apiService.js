// services/apiService.js
import axios from 'axios';
import Cookies from 'js-cookie';

// สร้าง instance ของ axios พร้อมกำหนดค่าเริ่มต้น
const createApiInstance = () => {
  const token = Cookies.get('access_token');
  
  return axios.create({
    baseURL: process.env.API_URL, // API Server ที่ต้องการเรียกใช้
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    withCredentials: true,
    timeout: 15000 // กำหนด timeout เป็น 15 วินาที
  });
  
};

// สร้างฟังก์ชันครอบการเรียก API พร้อมระบบ logging และ error handling
const apiCall = async (method, endpoint, data = null) => {
  const token = Cookies.get('access_token');
  const api = createApiInstance();
  
  try {
    console.log(`🔄 API Call: ${method.toUpperCase()} ${endpoint}`);
    console.time(`API ${method.toUpperCase()} ${endpoint}`);
    
    let response;
    if (method.toLowerCase() === 'get') {
      response = await api.get(endpoint);
    } else if (method.toLowerCase() === 'post') {
      response = await api.post(endpoint, data);
    } else if (method.toLowerCase() === 'put') {
      response = await api.put(endpoint, data);
    } else if (method.toLowerCase() === 'delete') {
      response = await api.delete(endpoint);
    }
    
    console.timeEnd(`API ${method.toUpperCase()} ${endpoint}`);
    console.log(`✅ API Success: ${method.toUpperCase()} ${endpoint}`, response.data);
    
    return response.data;
  } catch (error) {
    console.timeEnd(`API ${method.toUpperCase()} ${endpoint}`);
    console.error(`❌ Complete API Error Details:`, error);
    
    throw error;
  }
};

/**
 * ดึงข้อมูลบริการทั้งหมด
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
    
    // สร้าง instance ของ axios พร้อมกำหนดค่าเริ่มต้น
    const token = Cookies.get('access_token');
    const api = axios.create({
      baseURL: process.env.API_URL,
      headers: {
        'Content-Type': 'multipart/form-data', // เปลี่ยนเป็น multipart/form-data
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true,
      timeout: 30000 // เพิ่ม timeout เป็น 30 วินาที เพราะอัปโหลดไฟล์อาจใช้เวลานาน
    });
    
    console.log('🔄 API Call: POST /api/payments');
    console.time('API POST /api/payments');
    
    const response = await api.post('/api/payments', formData);
    
    console.timeEnd('API POST /api/payments');
    console.log('✅ API Success: POST /api/payments', response.data);
    
    return {
      success: true,
      orderId: orderId,
      message: 'อัปเดตข้อมูลการชำระเงินสำเร็จ',
      orderData: response.data
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
    // สร้าง instance ของ axios สำหรับอัปโหลดไฟล์
    const token = Cookies.get('access_token');
    const api = axios.create({
      baseURL: process.env.API_URL,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true,
      timeout: 60000 // เพิ่ม timeout เป็น 60 วินาที เพราะอัปโหลดไฟล์อาจใช้เวลานาน
    });
    
    console.log('🔄 API Call: POST /api/documents/upload');
    console.time('API POST /api/documents/upload');
    
    const response = await api.post('/api/documents/upload', formData);
    
    console.timeEnd('API POST /api/documents/upload');
    console.log('✅ API Success: POST /api/documents/upload', response.data);
    
    return {
      success: true,
      message: 'อัปโหลดเอกสารสำเร็จ',
      data: response.data
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
    // ใช้ endpoint ที่ไม่ต้องการการยืนยันตัวตน
    // ไม่ต้องใช้ token เนื่องจากเป็น public API
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
    
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'ไม่พบข้อมูลการตรวจสอบประวัติตามรหัสที่ระบุ',
      error
    };
  }
}

/**
 * อัปโหลดไฟล์ผลการตรวจสอบให้กับ Candidate
 * @param {string} candidateId รหัสผู้สมัคร
 * @param {FormData} formData ข้อมูลผลการตรวจสอบพร้อมไฟล์ (FormData)
 * @returns {Promise<Object>} ผลลัพธ์การอัปโหลดผลการตรวจสอบ
 */
export async function uploadResultFile(candidateId, formData) {
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
      timeout: 60000 // เพิ่ม timeout เป็น 60 วินาที เพราะอัปโหลดไฟล์อาจใช้เวลานาน
    });
    
    console.log(`🔄 API Call: POST /api/candidates/${candidateId}/upload-result`);
    console.time(`API POST /api/candidates/${candidateId}/upload-result`);
    
    const response = await api.post(`/api/candidates/${candidateId}/upload-result`, formData);
    
    console.timeEnd(`API POST /api/candidates/${candidateId}/upload-result`);
    console.log(`✅ API Success: POST /api/candidates/${candidateId}/upload-result`, response.data);
    
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