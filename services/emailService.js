// services/emailService.js

import { custom } from "zod";

/**
 * ส่งอีเมลแจ้งเตือนแอดมินเมื่อมีการชำระเงินใหม่
 * @param {Object} order ข้อมูลคำสั่งซื้อ
 * @returns {Promise<boolean>} ผลการส่งอีเมล
 */
export async function sendPaymentNotificationToAdmin(order) {
  console.log('Sending notification to admin, order ID:', order._id);
  console.log(order)
  try {
    // เรียกใช้ API Route App Router
    const response = await fetch('/api/email/notify-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: order._id,
        trackingNumber: order.TrackingNumber,
        paymentInfo: order.payment,
        totalPrice: order.TotalPrice
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email notification');
    }
    
    return true;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return false;
  }
}

/**
 * ส่งอีเมลแจ้งเตือนลูกค้าเมื่อการชำระเงินได้รับการอนุมัติ
 * @param {Object} order ข้อมูลคำสั่งซื้อ
 * @returns {Promise<boolean>} ผลการส่งอีเมล
 */
export async function sendPaymentApprovedToUser(order) {
  console.log('Sending payment approval email to user for order:', order.TrackingNumber);
  
  try {
    // เรียกใช้ API Route App Router
    const response = await fetch('/api/email/notify-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trackingNumber: order.TrackingNumber,
        customerEmail: order.user.email ,
        customerName: order.user.username,
        totalPrice: order.TotalPrice,
        orderId: order._id
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email notification');
    }
    
    return true;
  } catch (error) {
    console.error('Error sending user notification email:', error);
    return false;
  }
}

/**
 * ส่งอีเมลแจ้งเตือนลูกค้าเมื่อผลการตรวจสอบทั้งหมดเสร็จสิ้น
 * @param {Object} order ข้อมูลคำสั่งซื้อ
 * @param {Array} results ข้อมูลผลการตรวจสอบทั้งหมด
 * @returns {Promise<boolean>} ผลการส่งอีเมล
 */
export async function sendCompletedResultsNotification(order, results) {
  console.log(`📧 Starting email notification for order: ${order._id || order.TrackingNumber}`);
  
  // Check required fields
  if (!order || !order.user || !order.user.email) {
    console.error('Missing required email information:', {
      hasOrder: !!order,
      hasUser: order ? !!order.user : false,
      hasEmail: order && order.user ? !!order.user.email : false
    });
    return false;
  }
  
  // เพิ่ม logging ที่ละเอียดมากขึ้น
  console.log('Order information:', {
    id: order._id,
    tracking: order.TrackingNumber,
    customerEmail: order.user.email
  });
  
  try {
    // สร้าง URL ให้ถูกต้อง
    const apiUrl = window.location.origin; // ✅ แก้ไขตรงนี้
    const emailApiUrl = `${apiUrl}/api/email/results-completed`;
    
    console.log(`Calling API at: ${emailApiUrl}`);
    
    // เรียกใช้ API
    const response = await fetch(emailApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trackingNumber: order.TrackingNumber,
        customerEmail: order.user.email,
        customerName: order.user.name || order.user.username || 'ท่านผู้ใช้บริการ',
        totalPrice: order.TotalPrice || 0,
        orderId: order._id,
        results: results,
        resultSummary: {
          total: results.length,
          passed: results.filter(r => r.resultStatus === 'pass').length,
          failed: results.filter(r => r.resultStatus === 'fail').length,
          pending: results.filter(r => r.resultStatus === 'pending').length
        }
      }),
    });
    
    console.log(`API response status: ${response.status}`);
    
    // แก้ไขการจัดการ response
    const result = await response.json().catch(e => {
      console.error('Error parsing JSON response:', e);
      return null;
    });
    
    console.log('API response data:', result);
    
    return response.ok;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}
/**
 * ส่งอีเมลแจ้งเตือนลูกค้าเมื่อการชำระเงินถูกปฏิเสธ
 * @param {Object} order ข้อมูลคำสั่งซื้อ
 * @returns {Promise<boolean>} ผลการส่งอีเมล
 */
export async function sendPaymentRejectedToUser(order) {
  console.log('Sending payment rejection email to user for order:', order.TrackingNumber);
  
  // ตรวจสอบข้อมูลที่จำเป็น
  if (!order || !order.user || !order.user.email) {
    console.error('Missing required order information for sending rejection email');
    return false;
  }
  
  try {
    // เรียกใช้ API Route App Router
    console.log('Calling payment-rejected API with order data:', {
      trackingNumber: order.TrackingNumber,
      customerEmail: order.user.email,
      customerName: order.user.username || order.user.fullName,
      totalPrice: order.TotalPrice,
      orderId: order._id
    });
    
    const response = await fetch('/api/email/payment-rejected', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trackingNumber: order.TrackingNumber,
        customerEmail: order.user.email,
        customerName: order.user.username || order.user.fullName,
        totalPrice: order.TotalPrice,
        orderId: order._id,
        paymentInfo: order.payment
      }),
    });
    
    const result = await response.json();
    console.log('Payment rejection email API response:', result);
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email notification');
    }
    
    console.log('Payment rejection email sent successfully to:', order.user.email);
    return true;
  } catch (error) {
    console.error('Error sending payment rejection email:', error);
    return false;
  }
}