// services/servicePackageApi.js
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

// ===================== SERVICE API =====================

/**
 * ดึงข้อมูลบริการทั้งหมด
 * @returns {Promise<Array>} รายการบริการทั้งหมด พร้อม URL รูปภาพที่พร้อมใช้งาน
 */
export async function getAllServices() {
  try {
    const services = await apiCall('get', '/api/services');
    return services;
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
}


/**
 * ดึงข้อมูลบริการตาม ID
 * @param {string} serviceId ID ของบริการที่ต้องการดึงข้อมูล
 * @returns {Promise<Object>} ข้อมูลบริการ พร้อม URL รูปภาพที่พร้อมใช้งาน
 */
export async function getServiceById(serviceId) {
  try {
    const service = await apiCall('get', `/api/services/${serviceId}`);
    return service;
  } catch (error) {
    console.error(`Error fetching service with ID ${serviceId}:`, error);
    throw error;
  }
}

/**
 * สร้างบริการใหม่
 * @param {Object} serviceData ข้อมูลบริการ
 * @param {File} imageFile ไฟล์รูปภาพของบริการ (optional)
 * @returns {Promise<Object>} ข้อมูลบริการที่สร้างใหม่ พร้อม URL รูปภาพที่พร้อมใช้งาน
 */
export async function createService(serviceData, imageFile = null) {
  try {
    // ตรวจสอบข้อมูลพื้นฐานก่อนส่ง
    if (!serviceData.Service_Title || !serviceData.Service_Title.trim()) {
      throw new Error('ชื่อบริการเป็นสิ่งจำเป็น');
    }
    
    if (!serviceData.Price || serviceData.Price < 0) {
      throw new Error('ราคาต้องเป็นจำนวนที่มากกว่าหรือเท่ากับ 0');
    }
    
    if (!serviceData.RequiredDocuments || serviceData.RequiredDocuments.length === 0) {
      throw new Error('ต้องระบุเอกสารที่จำเป็นอย่างน้อย 1 รายการ');
    }
    
    // ตรวจสอบความถูกต้องของแต่ละเอกสาร
    for (const doc of serviceData.RequiredDocuments) {
      if (!doc.document_name || doc.document_name.trim() === '') {
        throw new Error('ชื่อเอกสารเป็นสิ่งจำเป็น');
      }
      
      if (!doc.file_types || doc.file_types.length === 0) {
        throw new Error(`ต้องระบุประเภทไฟล์สำหรับเอกสาร ${doc.document_name}`);
      }
    }

    const formData = new FormData();
    
    // เพิ่มข้อมูลพื้นฐานของบริการ
    formData.append('Service_Title', serviceData.Service_Title.trim());
    formData.append('Service_Desc', serviceData.Service_Desc || '');
    formData.append('Price', serviceData.Price.toString());
    
    // เพิ่มข้อมูล RequiredDocuments เป็น JSON string ตามโครงสร้างที่ถูกต้อง
    formData.append('RequiredDocuments', JSON.stringify(serviceData.RequiredDocuments));
    
    // เพิ่มไฟล์รูปภาพถ้ามี
    if (imageFile) {
      formData.append('service_image', imageFile);
    }
    
    const result = await apiCall('post', '/api/services', formData, true);
    return result;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
}

/**
 * อัปเดตข้อมูลบริการ
 * @param {string} serviceId ID ของบริการที่ต้องการอัปเดต
 * @param {Object} serviceData ข้อมูลบริการที่ต้องการอัปเดต
 * @param {File} imageFile ไฟล์รูปภาพใหม่ (optional)
 * @returns {Promise<Object>} ข้อมูลบริการที่อัปเดต พร้อม URL รูปภาพที่พร้อมใช้งาน
 */
export async function updateService(serviceId, serviceData, imageFile = null) {
  try {
    const formData = new FormData();
    
    // เพิ่มข้อมูลที่ต้องการอัปเดต
    if (serviceData.Service_Title) {
      formData.append('Service_Title', serviceData.Service_Title);
    }
    
    if (serviceData.Service_Desc !== undefined) {
      formData.append('Service_Desc', serviceData.Service_Desc);
    }
    
    if (serviceData.Price !== undefined) {
      formData.append('Price', serviceData.Price);
    }
    
    // เพิ่มข้อมูล RequiredDocuments เป็น JSON string ถ้ามีการอัปเดต
    if (serviceData.RequiredDocuments) {
      // ตรวจสอบความถูกต้องของแต่ละเอกสาร
      for (const doc of serviceData.RequiredDocuments) {
        if (!doc.document_name || doc.document_name.trim() === '') {
          throw new Error('ชื่อเอกสารเป็นสิ่งจำเป็น');
        }
        
        if (!doc.file_types || doc.file_types.length === 0) {
          throw new Error(`ต้องระบุประเภทไฟล์สำหรับเอกสาร ${doc.document_name}`);
        }
      }
      
      formData.append('RequiredDocuments', JSON.stringify(serviceData.RequiredDocuments));
    }
    
    // เพิ่มไฟล์รูปภาพใหม่ถ้ามี
    if (imageFile) {
      formData.append('service_image', imageFile);
    }
    
    const result = await apiCall('put', `/api/services/${serviceId}`, formData, true);
    return result;
  } catch (error) {
    console.error(`Error updating service with ID ${serviceId}:`, error);
    throw error;
  }
}

/**
 * ลบบริการ
 * @param {string} serviceId ID ของบริการที่ต้องการลบ
 * @returns {Promise<void>}
 */
export async function deleteService(serviceId) {
  try {
    await apiCall('delete', `/api/services/${serviceId}`);
    return { success: true, message: 'ลบบริการสำเร็จ' };
  } catch (error) {
    console.error(`Error deleting service with ID ${serviceId}:`, error);
    throw error;
  }
}




// ===================== PACKAGE API =====================

/**
 * ดึงข้อมูลแพ็คเกจทั้งหมด
 * @returns {Promise<Array>} รายการแพ็คเกจทั้งหมด
 */
export async function getAllPackages() {
  try {
    const packages = await apiCall('get', '/api/packages');
    return packages;
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
}

/**
 * ดึงข้อมูลแพ็คเกจตาม ID
 * @param {string} packageId ID ของแพ็คเกจที่ต้องการดึงข้อมูล
 * @returns {Promise<Object>} ข้อมูลแพ็คเกจ
 */
export async function getPackageById(packageId) {
  try {
    const packageData = await apiCall('get', `/api/packages/${packageId}`);
    return packageData;
  } catch (error) {
    console.error(`Error fetching package with ID ${packageId}:`, error);
    throw error;
  }
}

/**
 * สร้างแพ็คเกจใหม่
 * @param {Object} packageData ข้อมูลแพ็คเกจ
 * @returns {Promise<Object>} ข้อมูลแพ็คเกจที่สร้างใหม่
 */
export async function createPackage(packageData) {
  try {
    const result = await apiCall('post', '/api/packages', packageData);
    return result;
  } catch (error) {
    console.error('Error creating package:', error);
    throw error;
  }
}

/**
 * อัปเดตข้อมูลแพ็คเกจ
 * @param {string} packageId ID ของแพ็คเกจที่ต้องการอัปเดต
 * @param {Object} packageData ข้อมูลแพ็คเกจที่ต้องการอัปเดต
 * @returns {Promise<Object>} ข้อมูลแพ็คเกจที่อัปเดต
 */
export async function updatePackage(packageId, packageData) {
  try {
    const result = await apiCall('put', `/api/packages/${packageId}`, packageData);
    return result;
  } catch (error) {
    console.error(`Error updating package with ID ${packageId}:`, error);
    throw error;
  }
}

/**
 * ลบแพ็คเกจ
 * @param {string} packageId ID ของแพ็คเกจที่ต้องการลบ
 * @returns {Promise<Object>} ผลลัพธ์การลบแพ็คเกจ
 */
export async function deletePackage(packageId) {
  try {
    await apiCall('delete', `/api/packages/${packageId}`);
    return { success: true, message: 'ลบแพ็คเกจสำเร็จ' };
  } catch (error) {
    console.error(`Error deleting package with ID ${packageId}:`, error);
    throw error;
  }
}

/**
 * เพิ่มบริการเข้าไปในแพ็คเกจ
 * @param {string} packageId ID ของแพ็คเกจ
 * @param {string} serviceId ID ของบริการที่ต้องการเพิ่ม
 * @returns {Promise<Object>} ข้อมูลแพ็คเกจที่อัปเดต
 */
export async function addServiceToPackage(packageId, serviceId) {
  try {
    const result = await apiCall('post', `/api/packages/${packageId}/services/${serviceId}`);
    return result;
  } catch (error) {
    console.error(`Error adding service ${serviceId} to package ${packageId}:`, error);
    throw error;
  }
}

/**
 * ลบบริการออกจากแพ็คเกจ
 * @param {string} packageId ID ของแพ็คเกจ
 * @param {string} serviceId ID ของบริการที่ต้องการลบ
 * @returns {Promise<Object>} ข้อมูลแพ็คเกจที่อัปเดต
 */
export async function removeServiceFromPackage(packageId, serviceId) {
  try {
    const result = await apiCall('delete', `/api/packages/${packageId}/services/${serviceId}`);
    return result;
  } catch (error) {
    console.error(`Error removing service ${serviceId} from package ${packageId}:`, error);
    throw error;
  }
}

/**
 * อัปโหลดเอกสารสำหรับบริการ
 * @param {Object} documentData ข้อมูลเอกสาร
 * @param {File} file ไฟล์เอกสาร
 * @returns {Promise<Object>} ผลลัพธ์การอัปโหลดเอกสาร
 */
export async function uploadServiceDocument(documentData, file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // เพิ่มข้อมูลที่เกี่ยวข้องกับเอกสาร
    Object.keys(documentData).forEach(key => {
      formData.append(key, documentData[key]);
    });
    
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
      message: error.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปโหลดเอกสาร',
      error
    };
  }
}

/**
 * อัปโหลดเอกสารทั้งหมดพร้อมกัน
 * @param {Object} data ข้อมูลและไฟล์ทั้งหมดที่ต้องการอัปโหลด
 * @returns {Promise<Object>} ผลลัพธ์การอัปโหลดเอกสารทั้งหมด
 */
export async function uploadMultipleDocuments(data) {
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
      
      // สร้าง object ข้อมูลเอกสาร
      const documentData = {
        serviceId: serviceId,
        documentType: docId,
        candidateId: data.candidateId
      };
      
      // อัปโหลดไฟล์
      return uploadServiceDocument(documentData, data.files[key]);
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

/**
 * Helper function เพื่อแปลง Service ID เป็นข้อมูลบริการ
 * @returns {Promise<Object>} Map ของบริการทั้งหมด โดยใช้ ID เป็น key
 */
export async function getServiceMap() {
  try {
    const services = await getAllServices();
    
    // สร้าง Map เพื่อแปลง ID เป็นข้อมูลบริการทั้งหมด
    const serviceMap = services.reduce((acc, service) => {
      acc[service._id] = service; // เก็บ service object ทั้งหมด
      return acc;
    }, {});

    return serviceMap;
  } catch (error) {
    console.error('Error creating service map:', error);
    return {}; // ส่งคืน object ว่างหากเกิดข้อผิดพลาด
  }
}