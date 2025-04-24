// services/apiService.js
import { fetchServices, fetchPackages, fetchAllServices, submitOrder } from '@/data/mockData';

/**
 * ดึงข้อมูลบริการทั้งหมด (ไม่รวมแพ็คเกจ)
 */
export async function getServices() {
  try {
    // สำหรับการใช้งานจริง ให้เปลี่ยนเป็น fetch API
    // const response = await fetch('/api/services');
    // if (!response.ok) throw new Error('Failed to fetch services');
    // return await response.json();
    
    // ใช้ข้อมูลจำลอง
    return await fetchServices();
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
}

/**
 * ดึงข้อมูลแพ็คเกจทั้งหมด
 */
export async function getPackages() {
  try {
    // สำหรับการใช้งานจริง ให้เปลี่ยนเป็น fetch API
    // const response = await fetch('/api/packages');
    // if (!response.ok) throw new Error('Failed to fetch packages');
    // return await response.json();
    
    // ใช้ข้อมูลจำลอง
    return await fetchPackages();
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
}

/**
 * ดึงข้อมูลบริการทั้งหมด (รวมทั้งบริการและแพ็คเกจ)
 */
export async function getAllServices() {
  try {
    // สำหรับการใช้งานจริง ให้เปลี่ยนเป็น fetch API
    // const response = await fetch('/api/services/all');
    // if (!response.ok) throw new Error('Failed to fetch all services');
    // return await response.json();
    
    // ใช้ข้อมูลจำลอง
    return await fetchAllServices();
  } catch (error) {
    console.error('Error fetching all services:', error);
    throw error;
  }
}

/**
 * ส่งข้อมูลคำสั่งซื้อไปยัง API
 * @param {Object} orderData - ข้อมูลคำสั่งซื้อ
 */
export async function createOrder(orderData) {
  try {
    // สำหรับการใช้งานจริง ให้เปลี่ยนเป็น fetch API
    // const response = await fetch('/api/orders', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(orderData),
    // });
    // if (!response.ok) throw new Error('Failed to create order');
    // return await response.json();
    
    // ใช้ข้อมูลจำลอง
    return await submitOrder(orderData);
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}