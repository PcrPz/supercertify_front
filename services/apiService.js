// services/apiService.js
import { fetchServices, fetchPackages, fetchAllServices, submitOrder } from '@/data/mockData';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_URL, // http://localhost:3000
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});


export async function getServices() {
 try {
   // เรียกใช้ API จริง
   const response = await api.get('/api/services');
   return response.data;
 } catch (error) {
   console.error('Error fetching services:', error);
   // Fallback ไปใช้ข้อมูลจำลอง
   console.log('Falling back to mock data');
   return await fetchServices();
 }
}

/**
* ดึงข้อมูลแพ็คเกจทั้งหมด
*/
export async function getPackages() {
 try {
   const response = await api.get('/api/packages');
   return response.data;
 } catch (error) {
   console.error('Error fetching packages:', error);
   // Fallback ไปใช้ข้อมูลจำลอง
   return await fetchPackages();
 }
}

/**
* ส่งข้อมูลคำสั่งซื้อไปยัง API
* @param {Object} orderData - ข้อมูลคำสั่งซื้อ
*/
export async function createOrder(orderData) {
 try {
   const response = await api.post('/api/orders', orderData);
   return response.data;
 } catch (error) {
   console.error('Error creating order:', error);
   // Fallback ไปใช้ข้อมูลจำลอง
   return await submitOrder(orderData);
 }
}