'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeftIcon,
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon,
  DocumentCheckIcon,
  AdjustmentsHorizontalIcon,
  BanknotesIcon,
  ReceiptRefundIcon,
  XCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { getOrderById } from '../../../services/apiService';
import TrackingSteps from '@/components/tracking/TrackingSteps';
import AwaitingPaymentContent from '@/components/tracking/status-content/AwaitingPaymentContent';
import PendingVerificationContent from '@/components/tracking/status-content/PendingVerificationContent';
import PaymentVerifiedContent from '@/components/tracking/status-content/PaymentVerifiedContent';
import ProcessingContent from '@/components/tracking/status-content/ProcessingContent';
import CompletedContent from '@/components/tracking/status-content/CompletedContent';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // โหลดข้อมูล Order จาก API
  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        // ใช้ getOrderById เพื่อดึงข้อมูลรายละเอียดของ Order
        const response = await getOrderById(orderId);
        
        // กำหนดข้อมูล Order ที่ได้รับมา
        setOrder(response);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order detail:', err);
        setError('ไม่สามารถโหลดข้อมูลรายละเอียดคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง');
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  // แปลงสถานะเป็นตัวเลขสำหรับแสดงขั้นตอน
  const getStepNumber = (status) => {
    switch(status) {
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
      case 'cancelled':
        return -1; // ยกเลิก (กำหนดค่าพิเศษสำหรับแสดงผลการยกเลิก)
      default:
        return 1;
    }
  };

  // แปลงสถานะเป็นภาษาไทย
  const getThaiStatus = (status) => {
    switch(status) {
      case 'awaiting_payment':
        return 'รอการชำระเงิน';
      case 'pending_verification':
        return 'รอตรวจสอบการชำระเงิน';
      case 'payment_verified':
        return 'ยืนยันการชำระเงินแล้ว';
      case 'processing':
        return 'กำลังดำเนินการ';
      case 'completed':
        return 'เสร็จสิ้น';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return status;
    }
  };

  // ฟังก์ชันสำหรับสีของแท็กสถานะ
  const getStatusTagColor = (status) => {
    switch(status) {
      case 'awaiting_payment':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'pending_verification':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'payment_verified':
        return 'bg-[#eceefe] text-[#444DDA] border border-[#d8dcf7]';
      case 'processing':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // ฟังก์ชันสำหรับการแสดงไอคอนตามสถานะ
  const getStatusIcon = (status) => {
    switch(status) {
      case 'awaiting_payment':
        return <BanknotesIcon className="h-5 w-5" />;
      case 'pending_verification':
        return <ClockIcon className="h-5 w-5" />;
      case 'payment_verified':
        return <DocumentCheckIcon className="h-5 w-5" />;
      case 'processing':
        return <AdjustmentsHorizontalIcon className="h-5 w-5" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  // แสดง Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#444DDA] mx-auto"></div>
          <p className="mt-4 text-[#444DDA] font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // แสดงข้อความ Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600 font-medium text-lg">{error}</p>
          <div className="mt-8 flex justify-center space-x-4">
            <button 
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition duration-200 font-medium flex items-center"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              กลับหน้าหลัก
            </button>
            <button 
              className="bg-[#444DDA] text-white px-6 py-2 rounded-lg hover:bg-[#3a42be] transition duration-200 font-medium flex items-center"
              onClick={() => window.location.reload()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ตรวจสอบว่ามีข้อมูล Order หรือไม่
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600 font-medium text-lg">ไม่พบข้อมูลการตรวจสอบประวัติ</p>
          <button 
            className="mt-8 bg-[#444DDA] text-white px-6 py-2 rounded-lg hover:bg-[#3a42be] transition duration-200 font-medium flex items-center mx-auto"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            กลับไปหน้ารายการตรวจสอบประวัติ
          </button>
        </div>
      </div>
    );
  }

  // จัดรูปแบบรหัสอ้างอิง
  const formattedTrackingNumber = order.TrackingNumber;
  
  // จัดรูปแบบวันที่
  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่มีข้อมูล';
    
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')} ${
      ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][date.getMonth()]
    } ${date.getFullYear() + 543}`;
  };
  
  const formattedDate = formatDate(order.createdAt);
  
  // ตรวจสอบสถานะปัจจุบัน
  const currentStep = getStepNumber(order.OrderStatus);
  const currentStatus = order.OrderStatus;

  // ดึงข้อมูลเวลาต่างๆ จาก order
  const orderCreatedAt = order.createdAt;
  const paymentCreatedAt = order.payment?.createdAt;
  const paymentUpdatedAt = order.payment?.updatedAt;
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
      case 'cancelled':
        return <CancelledContent order={order} />;
      default:
        return <AwaitingPaymentContent order={order} />;
    }
  };

  // ฟังก์ชันคำนวณจำนวนบริการที่เลือก
  const countServices = () => {
    if (!order.candidates || order.candidates.length === 0) {
      return 0;
    }
    
    let totalServices = 0;
    order.candidates.forEach(candidate => {
      if (candidate.services && candidate.services.length > 0) {
        totalServices += candidate.services.length;
      }
    });
    
    return totalServices;
  };

  // จำนวนบริการที่เลือกทั้งหมด
  const totalServices = countServices();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-[#444DDA] to-[#5d65e3] text-white py-5 shadow-md">
        <div className="container mx-auto px-4 lg:px-6">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors shadow-md font-medium"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span>กลับสู่รายการ</span>
          </button>
        </div>
      </div>
      
      <main className="container mx-auto px-4 lg:px-6 py-8">
        {/* หัวข้อและสถานะ */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-[#444DDA]">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">รายละเอียดการตรวจสอบประวัติ</h1>
              <div className="flex flex-wrap items-center text-gray-600">
                <div className="flex items-center mr-6 mb-2 lg:mb-0">
                  <DocumentDuplicateIcon className="h-5 w-5 text-[#444DDA] mr-2" />
                  <span>รหัสการตรวจสอบ: <span className="font-medium">{formattedTrackingNumber}</span></span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-[#444DDA] mr-2" />
                  <span>วันที่สร้าง: <span className="font-medium">{formattedDate}</span></span>
                </div>
              </div>
            </div>
            <div className={`flex items-center px-5 py-2.5 rounded-full mt-4 lg:mt-0 ${getStatusTagColor(currentStatus)}`}>
              <span className="mr-2">{getStatusIcon(currentStatus)}</span>
              <span className="font-medium">{getThaiStatus(currentStatus)}</span>
            </div>
          </div>
        </div>
        
        {/* ส่วนแสดงขั้นตอนการดำเนินการ */}
        {currentStatus !== 'cancelled' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6 transition-all duration-300 hover:shadow-xl border border-[#444DDA]">
            <div className="bg-[#eceefe] px-6 py-4 border-b border-[#d8dcf7]">
              <h2 className="text-lg font-semibold text-[#444DDA]">สถานะการดำเนินการ</h2>
            </div>
            <div className="p-4">
              <TrackingSteps 
                currentStep={currentStep} 
                orderCreatedAt={orderCreatedAt}
                paymentCreatedAt={paymentCreatedAt}
                paymentUpdatedAt={paymentUpdatedAt}
                processingStartedAt={processingStartedAt}
                completedAt={completedAt}
              />
            </div>
          </div>
        )}
        
        {/* การสรุปรายละเอียด */}
        <section className="bg-white shadow-lg rounded-xl overflow-hidden mb-6 transition-all duration-300 hover:shadow-xl border border-[#444DDA]">
          <div className="bg-[#eceefe] px-6 py-4 border-b border-[#d8dcf7]">
            <h2 className="text-lg font-semibold text-[#444DDA]">ข้อมูลคำสั่งซื้อ</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <InfoBox 
                label="ประเภทการตรวจสอบ" 
                value={order.OrderType === 'company' ? 'บริษัท' : 'บุคคล'}
                icon={order.OrderType === 'company' ? <BuildingOfficeIcon className="h-5 w-5 text-indigo-500" /> : <UserIcon className="h-5 w-5 text-indigo-500" />}
              />
              <InfoBox 
                label="จำนวนผู้สมัคร" 
                value={`${order.candidates?.length || 0} คน`}
                icon={<UserIcon className="h-5 w-5 text-indigo-500" />}
              />
              <InfoBox 
                label="จำนวนบริการ" 
                value={`${totalServices} รายการ`}
                icon={<DocumentDuplicateIcon className="h-5 w-5 text-indigo-500" />}
              />
            </div>
            
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InfoBox 
                label="ราคารวม" 
                value={`${order.TotalPrice?.toLocaleString() || 0} บาท`} 
                highlight
                icon={<BanknotesIcon className="h-5 w-5 text-green-500" />}
              />
              <InfoBox 
                label="วิธีชำระเงิน" 
                value={order.payment?.paymentMethod || 'โอนเงิน'}
                icon={<ReceiptRefundIcon className="h-5 w-5 text-indigo-500" />}
              />
              <InfoBox 
                label="วันที่ชำระเงิน" 
                value={order.payment ? formatDate(order.payment.createdAt) : 'ยังไม่ชำระเงิน'}
                icon={<ClockIcon className="h-5 w-5 text-indigo-500" />}
              />
            </div>
          </div>
        </section>
        
        {/* ส่วนแสดงข้อมูลตามสถานะ */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 transition-all duration-300 hover:shadow-xl border border-[#444DDA]">
          <div className="bg-[#eceefe] px-6 py-4 border-b border-[#d8dcf7]">
            <h2 className="text-lg font-semibold text-[#444DDA]">รายละเอียดเพิ่มเติม</h2>
          </div>
          <div className="p-4">
            {renderStatusContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoBox({ label, value, highlight, icon }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 transition-all duration-300 hover:shadow-md border border-gray-100">
      <div className="flex items-center mb-2">
        <div className="text-[#444DDA]">{icon}</div>
        <p className="text-gray-500 text-sm font-medium ml-2">{label}</p>
      </div>
      <p className={`text-lg font-medium ${highlight ? 'text-[#444DDA] text-xl' : 'text-gray-800'}`}>
        {value}
      </p>
    </div>
  )
}

// ต้องเพิ่ม CancelledContent component ที่หายไป
function CancelledContent({ order }) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-center py-6">
        <div className="text-center max-w-lg">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-600 mb-2">คำสั่งซื้อถูกยกเลิก</h3>
          <p className="text-gray-600 mb-6">
            คำสั่งซื้อนี้ได้ถูกยกเลิกแล้ว หากคุณต้องการสั่งซื้อใหม่ กรุณาสร้างคำสั่งซื้อใหม่
          </p>
          <div className="flex justify-center">
            <button 
              className="bg-[#444DDA] text-white font-medium px-6 py-2 rounded-lg hover:bg-[#3a42be] transition-colors duration-300"
              onClick={() => window.location.href = '/order/create'}
            >
              สร้างคำสั่งซื้อใหม่
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}