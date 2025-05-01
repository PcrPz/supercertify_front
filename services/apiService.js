// services/apiService.js process.env.API_URL

import axios from 'axios';
import Cookies from 'js-cookie';

// สร้าง instance ของ axios พร้อมกำหนดค่าเริ่มต้น
const createApiInstance = () => {
  const token = Cookies.get('access_token');
  console.log(token)
  
  return axios.create({
    baseURL: process.env.API_URL, // API Server ที่ต้องการเรียกใช้
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    withCredentials: true,
    timeout: 10000 // กำหนด timeout เป็น 10 วินาที
  });
};

// สร้างฟังก์ชันครอบการเรียก API พร้อมระบบ logging และ error handling
const apiCall = async (method, endpoint, data = null) => {
  const token = Cookies.get('access_token');
  console.log('Current Token:', token); // Debug token

  const api = createApiInstance();
  
  try {
    console.log(api.getUri())
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
    console.error(`❌ Complete API Error Details:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      config: error.config
    });
    
    // Detailed error handling
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error Response Data:', error.response.data);
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error Message:', error.message);
    }
    
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

    console.log('Order Creation Result:', result._id); 
    
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
          name: serviceMap[serviceId].Service_Title || `บริการ #${serviceId}`
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
 * @param {Object} paymentData ข้อมูลการชำระเงิน
 * @returns {Promise<Object>} ผลลัพธ์การอัปเดตข้อมูลการชำระเงิน
 */
export async function updatePayment(orderId, paymentData) {
  try {
    const result = await apiCall('post', `/api/orders/${orderId}/payment`, paymentData);
    
    return {
      success: true,
      payment: result.payment,
      message: result.message || 'อัปเดตข้อมูลการชำระเงินสำเร็จ',
      data: result
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการชำระเงิน',
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