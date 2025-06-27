import React, { useEffect, useState } from 'react';
import TrackingSteps from './TrackingSteps';
import AwaitingPaymentContent from './status-content/AwaitingPaymentContent';
import PendingVerificationContent from './status-content/PendingVerificationContent';
import PaymentVerifiedContent from './status-content/PaymentVerifiedContent';
import ProcessingContent from './status-content/ProcessingContent';
import CompletedContent from './status-content/CompletedContent';
import { getOrderWithDetails } from '@/services/apiService';

const TrackingResultCard = ({ order: initialOrder, orderId }) => {
  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ถ้ามี orderId ให้เรียก API ดึงข้อมูลล่าสุด
  useEffect(() => {
    if (orderId) {
      const fetchOrderDetails = async () => {
        try {
          setLoading(true);
          const orderData = await getOrderWithDetails(orderId);
          setOrder(orderData);
          setError(null);
        } catch (err) {
          console.error('Error fetching order details:', err);
          setError('ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้');
        } finally {
          setLoading(false);
        }
      };

      fetchOrderDetails();
    }
  }, [orderId]);

  if (!order && !loading) return null;
  
  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#444DDA] mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // แปลงสถานะเป็นตัวเลขสำหรับแสดงขั้นตอน
  const getStepNumber = (status) => {
    switch (status) {
      case 'awaiting_payment':
        return 1;
      case 'pending_verification':
        return 2; // รอตรวจสอบการชำระเงิน
      case 'payment_verified':
        return 3; // ชำระเงินเรียบร้อยแล้ว
      case 'processing':
        return 4; // กำลังดำเนินการตรวจสอบ
      case 'completed':
        return 5; // เสร็จสิ้น
      default:
        return 1;
    }
  };

  // จัดรูปแบบรหัสอ้างอิง
  const formattedTrackingNumber = order.TrackingNumber || 'BGC1568022';
  const formattedDate = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('th-TH') 
    : '05/02/2025';

  // ตรวจสอบสถานะปัจจุบัน
  const currentStep = getStepNumber(order.OrderStatus || 'awaiting_payment');
  const currentStatus = order.OrderStatus || 'awaiting_payment';

  // ดึงข้อมูลเวลาต่างๆ จาก order
  const orderCreatedAt = order.createdAt;
  const paymentCreatedAt = order.payment?.createdAt;
  const paymentUpdatedAt = order.payment?.paymentUpdatedAt;
  const processingStartedAt = order.OrderStatus === 'processing' ? order.updatedAt : null;
  const completedAt = order.OrderStatus === 'completed' ? order.updatedAt : null;

  // ฟังก์ชั่นแสดงข้อมูลตามสถานะ
  const renderStatusContent = () => {
    switch (currentStatus) {
      case 'awaiting_payment':
        return <AwaitingPaymentContent order={order} />;
      case 'pending_verification':
        return <PendingVerificationContent order={order} />;
      case 'payment_verified':
        return <PaymentVerifiedContent order={order} />;
      case 'processing':
        return <ProcessingContent order={order} />;
      case 'completed':
        return <CompletedContent order={order} />;
      default:
        return <AwaitingPaymentContent order={order} />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* ส่วนที่ 1: หัวข้อ */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        รหัสการตรวจสอบประวัติ: #{formattedTrackingNumber} - {formattedDate}
      </h2>
      
      {/* ส่วนที่ 2: Tracking Timeline */}
      <div className="rounded-3xl border-2 border-gray-300 overflow-hidden mb-8">
        <TrackingSteps 
          currentStep={currentStep} 
          orderCreatedAt={orderCreatedAt}
          paymentCreatedAt={paymentCreatedAt}
          paymentUpdatedAt={paymentUpdatedAt}
          processingStartedAt={processingStartedAt}
          completedAt={completedAt}
        />
      </div>

      <div className="rounded-3xl border-2 border-gray-300 overflow-hidden mb-8">
        {renderStatusContent()}
      </div>
    </div>
  );
};

export default TrackingResultCard;