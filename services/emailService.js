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
  console.log(`📧 [sendCompletedResultsNotification] Starting for order ${order.TrackingNumber}`);
  
  // ตรวจสอบข้อมูลที่จำเป็น
  if (!order.user || !order.user.email) {
    console.error(`❌ [sendCompletedResultsNotification] Missing user.email`);
    return false;
  }
  
  if (!order.TrackingNumber) {
    console.error(`❌ [sendCompletedResultsNotification] Missing TrackingNumber`);
    return false;
  }
  
  try {
    // สร้าง resultSummary
    const resultSummary = {
      total: results.length,
      passed: results.filter(r => r.resultStatus === 'pass').length,
      failed: results.filter(r => r.resultStatus === 'fail').length,
      pending: results.filter(r => r.resultStatus === 'pending').length
    };
    
    // เตรียมข้อมูลสำหรับส่งอีเมล
    const emailPayload = {
      trackingNumber: order.TrackingNumber,
      customerEmail: order.user.email,
      customerName: order.user.name || order.user.username,
      totalPrice: order.TotalPrice,
      orderId: order._id,
      results: results,
      resultSummary: resultSummary
    };
    
    console.log(`📧 [sendCompletedResultsNotification] Sending to ${emailPayload.customerEmail}`);
    
    // เรียกใช้ API Route
    const response = await fetch('/api/email/results-completed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });
    
    console.log(`📧 [sendCompletedResultsNotification] API response status: ${response.status}`);
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error(`❌ [sendCompletedResultsNotification] API error:`, result);
      return false;
    }
    
    console.log(`✅ [sendCompletedResultsNotification] Email sent successfully`);
    return true;
  } catch (error) {
    console.error(`❌ [sendCompletedResultsNotification] Error:`, error);
    return false;
  }
}