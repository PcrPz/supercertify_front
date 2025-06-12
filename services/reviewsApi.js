// services/reviewsApi.js
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

// สร้างฟังก์ชันครอบการเรียก API พร้อมระบบ logging และ error handling
const apiCall = async (method, endpoint, data = null) => {
  const api = createApiInstance();
  
  try {
    console.log(`🔄 API Call: ${method.toUpperCase()} ${endpoint}`);
    console.time(`API ${method.toUpperCase()} ${endpoint}`);
    
    let response;
    const config = {};
    
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

// ============ Reviews API Functions ============

/**
 * ดึงข้อมูล Order ที่สามารถรีวิวได้ของผู้ใช้ปัจจุบัน
 * @returns {Promise<Object>} ข้อมูล Order ที่สามารถรีวิวได้
 */
export async function getReviewableOrders() {
  try {
    const result = await apiCall('get', '/api/orders/reviewable');
    
    return {
      success: true,
      data: result.data,
      message: result.message || 'ดึงข้อมูล Order ที่สามารถรีวิวได้สำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล Order ที่สามารถรีวิวได้',
      error
    };
  }
}

/**
 * สร้าง Review สำหรับ Order
 * @param {Object} reviewData ข้อมูล Review ที่จะสร้าง
 * @param {string} reviewData.orderId ID ของ Order ที่ต้องการรีวิว
 * @param {number} reviewData.rating คะแนนความพึงพอใจ (1-5)
 * @param {string} reviewData.comment ความคิดเห็นเพิ่มเติม
 * @returns {Promise<Object>} ข้อมูล Review ที่สร้าง
 */
export async function createReview(reviewData) {
  try {
    // Validate reviewData
    if (!reviewData.orderId) {
      throw new Error('กรุณาระบุ Order ID');
    }
    
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('กรุณาให้คะแนนความพึงพอใจระหว่าง 1-5');
    }
    
    const data = {
      orderId: reviewData.orderId,
      rating: reviewData.rating,
      comment: reviewData.comment || ''
    };
    
    const result = await apiCall('post', '/api/reviews', data);
    
    return {
      success: true,
      data: result.data,
      message: result.message || 'สร้าง Review สำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการสร้าง Review',
      error
    };
  }
}

/**
 * อัปเดต Review ที่มีอยู่แล้ว
 * @param {string} reviewId ID ของ Review ที่ต้องการอัปเดต
 * @param {Object} reviewData ข้อมูล Review ที่จะอัปเดต
 * @param {number} reviewData.rating คะแนนความพึงพอใจ (1-5)
 * @param {string} reviewData.comment ความคิดเห็นเพิ่มเติม
 * @returns {Promise<Object>} ข้อมูล Review ที่อัปเดตแล้ว
 */
export async function updateReview(reviewId, reviewData) {
  try {
    // Validate reviewData
    if (!reviewId) {
      throw new Error('กรุณาระบุ Review ID');
    }
    
    if (reviewData.rating && (reviewData.rating < 1 || reviewData.rating > 5)) {
      throw new Error('กรุณาให้คะแนนความพึงพอใจระหว่าง 1-5');
    }
    
    const data = {
      rating: reviewData.rating,
      comment: reviewData.comment
    };
    
    // ลบ property ที่เป็น undefined ออก
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
    
    const result = await apiCall('put', `/api/reviews/${reviewId}`, data);
    
    return {
      success: true,
      data: result.data,
      message: result.message || 'อัปเดต Review สำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการอัปเดต Review',
      error
    };
  }
}

/**
 * ดึงข้อมูล Review ตาม ID
 * @param {string} reviewId ID ของ Review
 * @returns {Promise<Object>} ข้อมูล Review
 */
export async function getReviewById(reviewId) {
  try {
    if (!reviewId) {
      throw new Error('กรุณาระบุ Review ID');
    }
    
    const result = await apiCall('get', `/api/reviews/${reviewId}`);
    
    return {
      success: true,
      data: result.data,
      message: result.message || 'ดึงข้อมูล Review สำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล Review',
      error
    };
  }
}

/**
 * ดึงข้อมูล Review ของผู้ใช้ปัจจุบัน
 * @returns {Promise<Object>} ข้อมูล Review ของผู้ใช้
 */
export async function getMyReviews() {
  try {
    const result = await apiCall('get', '/api/reviews/my-reviews');
    
    return {
      success: true,
      data: result.data,
      message: result.message || 'ดึงข้อมูล Review ของคุณสำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล Review ของคุณ',
      error
    };
  }
}

/**
 * ดึงข้อมูล Review ของ Order
 * @param {string} orderId ID ของ Order
 * @returns {Promise<Object>} ข้อมูล Review ของ Order
 */
export async function getReviewByOrderId(orderId) {
  try {
    if (!orderId) {
      throw new Error('กรุณาระบุ Order ID');
    }
    
    const result = await apiCall('get', `/api/reviews/order/${orderId}`);
    
    return {
      success: true,
      data: result.data,
      message: result.message || 'ดึงข้อมูล Review ของ Order สำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล Review ของ Order',
      error
    };
  }
}

/**
 * ลบ Review
 * @param {string} reviewId ID ของ Review ที่ต้องการลบ
 * @returns {Promise<Object>} ผลลัพธ์การลบ
 */
export async function deleteReview(reviewId) {
  try {
    if (!reviewId) {
      throw new Error('กรุณาระบุ Review ID');
    }
    
    const result = await apiCall('delete', `/api/reviews/${reviewId}`);
    
    return {
      success: true,
      data: result.data,
      message: result.message || 'ลบ Review สำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการลบ Review',
      error
    };
  }
}

/**
 * ดึงข้อมูลสถิติ Review ทั้งหมด (สำหรับ Admin)
 * @returns {Promise<Object>} ข้อมูลสถิติ Review
 */
export async function getReviewStats() {
  try {
    const result = await apiCall('get', '/api/reviews/stats');
    
    return {
      success: true,
      data: result.data,
      message: result.message || 'ดึงข้อมูลสถิติ Review สำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ Review',
      error
    };
  }
}

/**
 * ดึงข้อมูล Review ทั้งหมด (สำหรับ Admin)
 * @param {Object} options ตัวเลือกในการดึงข้อมูล
 * @param {number} options.page หน้าที่ต้องการ (เริ่มจาก 1)
 * @param {number} options.limit จำนวน Review ต่อหน้า
 * @param {string} options.sortBy ฟิลด์ที่ต้องการเรียงลำดับ
 * @param {string} options.sortOrder ลำดับการเรียง (asc หรือ desc)
 * @returns {Promise<Object>} ข้อมูล Review ทั้งหมด
 */
export async function getAllReviews(options = {}) {
  try {
    // แยกตัวแปรจาก options
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      isPublic,
      isDisplayed,  // เพิ่มการรับพารามิเตอร์ isDisplayed
      minRating,
      search
    } = options;
    
    // สร้าง object สำหรับพารามิเตอร์
    const params = {};
    
    // ใส่พารามิเตอร์พื้นฐาน
    params.page = page;
    params.limit = limit;
    params.sortBy = sortBy;
    params.sortOrder = sortOrder;
    
    // เพิ่มพารามิเตอร์ตัวกรองเมื่อมีค่า
    if (isPublic !== undefined) {
      params.isPublic = isPublic;
    }
    
    if (isDisplayed !== undefined) {
      params.isDisplayed = isDisplayed;  // เพิ่มการส่งค่า isDisplayed
    }
    
    if (minRating !== undefined) {
      params.minRating = minRating;
    }
    
    if (search) {
      params.search = search;
    }
    
    // สร้าง query string
    const queryParams = new URLSearchParams(params).toString();
    
    // เรียก API
    const result = await apiCall('get', `/api/reviews?${queryParams}`);
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: result.message || 'ดึงข้อมูล Review ทั้งหมดสำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล Review ทั้งหมด',
      error
    };
  }
}

// ============ Helper Functions ============

/**
 * ตรวจสอบว่า Order มี Review แล้วหรือไม่
 * @param {string} orderId ID ของ Order
 * @returns {Promise<boolean>} ผลการตรวจสอบ
 */
export async function hasOrderBeenReviewed(orderId) {
  try {
    if (!orderId) {
      throw new Error('กรุณาระบุ Order ID');
    }
    
    const result = await getReviewByOrderId(orderId);
    
    // ถ้าดึงข้อมูลสำเร็จและมีข้อมูล Review แสดงว่า Order นี้มีการรีวิวแล้ว
    return result.success && !!result.data;
  } catch (error) {
    // ถ้าเกิด error หรือไม่พบข้อมูล Review แสดงว่า Order นี้ยังไม่ได้รีวิว
    return false;
  }
}

/**
 * คำนวณคะแนนเฉลี่ยของ Review
 * @param {Array} reviews รายการ Review
 * @returns {number} คะแนนเฉลี่ย
 */
export function calculateAverageRating(reviews) {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return 0;
  }
  
  const sum = reviews.reduce((total, review) => total + (review.rating || 0), 0);
  return parseFloat((sum / reviews.length).toFixed(1));
}

/**
 * แปลงคะแนน Review เป็นดาว
 * @param {number} rating คะแนน (1-5)
 * @returns {string} สตริงดาว (★)
 */
export function ratingToStars(rating) {
  if (!rating || rating < 1 || rating > 5) {
    return '☆☆☆☆☆';
  }
  
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;
  
  return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
}
/**
 * ดึงข้อมูล Review สาธารณะทั้งหมด
 * @returns {Promise<Object>} ข้อมูล Review สาธารณะ
 */
export async function getPublicReviews() {
  try {
    const result = await apiCall('get', '/api/reviews/public');
    
    return {
      success: true,
      data: result.data,
      message: result.message || 'ดึงข้อมูล Review สาธารณะสำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล Review สาธารณะ',
      error
    };
  }
}

/**
 * ดึงข้อมูล Review ที่ถูกเลือกให้เป็น featured
 * @returns {Promise<Object>} ข้อมูล Review ที่เป็น featured
 */
export async function getFeaturedReviews() {
  try {
    const result = await apiCall('get', '/api/reviews/featured');
    
    return {
      success: true,
      data: result.data,
      message: result.message || 'ดึงข้อมูล Review ที่เป็น featured สำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล Review ที่เป็น featured',
      error
    };
  }
}

/**
 * ดึงข้อมูล Review ของผู้ใช้ตาม ID (สำหรับ Admin)
 * @param {string} userId ID ของผู้ใช้
 * @returns {Promise<Object>} ข้อมูล Review ของผู้ใช้
 */
export async function getReviewsByUserId(userId) {
  try {
    if (!userId) {
      throw new Error('กรุณาระบุ User ID');
    }
    
    const result = await apiCall('get', `/api/reviews/user/${userId}`);
    
    return {
      success: true,
      data: result.data,
      message: result.message || 'ดึงข้อมูล Review ของผู้ใช้สำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล Review ของผู้ใช้',
      error
    };
  }
}

/**
 * อัปเดต Review โดย Admin
 * @param {string} reviewId ID ของ Review ที่ต้องการอัปเดต
 * @param {Object} adminReviewData ข้อมูล Review ที่จะอัปเดต
 * @param {number} [adminReviewData.rating] คะแนนความพึงพอใจ (1-5)
 * @param {string} [adminReviewData.comment] ความคิดเห็นเพิ่มเติม
 * @param {boolean} [adminReviewData.isPublic] สถานะการแสดงบนเว็บไซต์
 * @param {boolean} [adminReviewData.isFeatured] สถานะการเป็น featured
 * @returns {Promise<Object>} ข้อมูล Review ที่อัปเดตแล้ว
 */
export async function adminUpdateReview(reviewId, adminReviewData) {
  try {
    if (!reviewId) {
      throw new Error('กรุณาระบุ Review ID');
    }
    
    // ตรวจสอบข้อมูลเบื้องต้น
    if (adminReviewData.rating && (adminReviewData.rating < 1 || adminReviewData.rating > 5)) {
      throw new Error('กรุณาให้คะแนนความพึงพอใจระหว่าง 1-5');
    }
    
    const result = await apiCall('put', `/api/reviews/${reviewId}/admin`, adminReviewData);

    
    return {
      success: true,
      data: result.data,
      message: result.message || 'อัปเดต Review โดย Admin สำเร็จ'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการอัปเดต Review โดย Admin',
      error
    };
  }
}

// Export default object ที่รวมทุกฟังก์ชัน
export default {
  getReviewableOrders,
  createReview,
  updateReview,
  getReviewById,
  getMyReviews,
  getReviewByOrderId,
  deleteReview,
  getReviewStats,
  getAllReviews,
  hasOrderBeenReviewed,
  calculateAverageRating,
  ratingToStars,
  getPublicReviews,
  getFeaturedReviews,
  getReviewsByUserId,
  adminUpdateReview
};