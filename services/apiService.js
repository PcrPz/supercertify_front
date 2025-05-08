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
  console.log('Current Token:', token); // Debug token

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
    console.log('Order Fetch - Token:', token);
    
    if (!token) {
      throw new Error('No access token found');
    }
    
    // Fetch order data
    const orderData = await apiCall('get', `/api/orders/${orderId}`);
    
    // Fetch service names
    const serviceMap = await getServiceNames();
    
    // Map service names for candidates
    if (orderData.candidates) {
      orderData.candidates = orderData.candidates.map(candidate => ({
        ...candidate,
        services: candidate.services.map(serviceId => ({
          id: serviceId,
          name: serviceMap[serviceId]?.Service_Title || `บริการ #${serviceId}`
        }))
      }));
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