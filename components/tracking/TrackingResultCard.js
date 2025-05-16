import React from 'react';
import TrackingSteps from './TrackingSteps';
import AwaitingPaymentContent from './status-content/AwaitingPaymentContent';
import PendingVerificationContent from './status-content/PendingVerificationContent';
import PaymentVerifiedContent from './status-content/PaymentVerifiedContent';
import ProcessingContent from './status-content/ProcessingContent';
import CompletedContent from './status-content/CompletedContent';

const TrackingResultCard = ({ order }) => {
  if (!order) return null;

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