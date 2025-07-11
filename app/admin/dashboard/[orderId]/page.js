'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  getOrderWithDetails, // เปลี่ยนจาก getOrd
  updateOrderStatus, 
  updatePaymentStatus, 
  getDocumentsByCandidate 
} from '@/services/apiService';
import { 
  sendPaymentApprovedToUser, 
  sendPaymentRejectedToUser 
} from '@/services/emailService';
import useToast from '@/hooks/useToast';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon, 
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId;
  const router = useRouter();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCandidate, setExpandedCandidate] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  
  // เพิ่ม useToast hook
  const { success: successToast, error: errorToast, warning, info, loading: toastLoading, update } = useToast();
  
  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        setLoading(true);
        // เปลี่ยนจาก getOrderById เป็น getOrderWithDetails
        const orderData = await getOrderWithDetails(orderId);
        setOrder(orderData);
        setError(null);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrderDetails();
  }, [orderId]);
  
  // ฟังก์ชันช่วยต่างๆ
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusLabel = (status) => {
    const statusMap = {
      'awaiting_payment': 'รอชำระเงิน',
      'pending_verification': 'รอตรวจสอบการชำระเงิน',
      'payment_verified': 'ยืนยันการชำระเงินแล้ว',
      'processing': 'กำลังดำเนินการ',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
  };
  
  const getStatusBadge = (status) => {
    let colorClass = '';
    let icon = null;
    
    switch (status) {
      case 'awaiting_payment':
        colorClass = 'bg-orange-100 text-orange-800 border border-orange-200';
        icon = <BanknotesIcon className="h-4 w-4 mr-1.5" />;
        break;
      case 'pending_verification':
        colorClass = 'bg-blue-100 text-blue-800 border border-blue-200';
        icon = <ClockIcon className="h-4 w-4 mr-1.5" />;
        break;
      case 'payment_verified':
        colorClass = 'bg-cyan-100 text-cyan-800 border border-cyan-200';
        icon = <DocumentCheckIcon className="h-4 w-4 mr-1.5" />;
        break;
      case 'processing':
        colorClass = 'bg-amber-100 text-amber-800 border border-amber-200';
        icon = <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1.5" />;
        break;
      case 'completed':
        colorClass = 'bg-green-100 text-green-800 border border-green-200';
        icon = <CheckCircleIcon className="h-4 w-4 mr-1.5" />;
        break;
      case 'cancelled':
        colorClass = 'bg-red-100 text-red-800 border border-red-200';
        icon = <XCircleIcon className="h-4 w-4 mr-1.5" />;
        break;
      default:
        colorClass = 'bg-gray-100 text-gray-800 border border-gray-200';
        icon = <ClockIcon className="h-4 w-4 mr-1.5" />;
    }

    return (
      <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${colorClass}`}>
        <span className={`h-2 w-2 rounded-full mr-2 ${getStatusDotColor(status)}`}></span>
        {icon}
        {getStatusLabel(status)}
      </span>
    );
  };
  
  const getStatusDotColor = (status) => {
    switch(status) {
      case 'awaiting_payment': return 'bg-orange-500';
      case 'pending_verification': return 'bg-blue-500';
      case 'payment_verified': return 'bg-cyan-500';
      case 'processing': return 'bg-amber-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getResultLabel = (status) => {
    const statusMap = {
      'pass': 'ผ่าน',
      'fail': 'ไม่ผ่าน',
      'pending': 'รอผล'
    };
    return statusMap[status] || 'รอผล';
  };

  const truncateFileName = (fileName, maxLength = 30) => {
  if (!fileName || fileName.length <= maxLength) return fileName;
  
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'));
  const maxNameLength = maxLength - extension.length - 4; // -4 for "..." and "."
  
  if (nameWithoutExt.length <= maxNameLength) return fileName;
  
  return `${nameWithoutExt.slice(0, maxNameLength)}...${extension}`;
};
  
  const getResultTagColor = (status) => {
    switch(status) {
      case 'pass': return 'bg-green-100 text-green-800 border border-green-200';
      case 'fail': return 'bg-red-100 text-red-800 border border-red-200';
      case 'pending': return 'bg-amber-100 text-amber-800 border border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // ฟังก์ชันสำหรับอัปเดตสถานะ
  const handleUpdateStatus = async (newStatus) => {
    try {
      setIsUpdatingStatus(true);
      setUpdateError(null);
      
      const result = await updateOrderStatus(orderId, newStatus);
      
      if (result.success) {
        setOrder(result.data);
        router.refresh();
      } else {
        setUpdateError(result.message || 'ไม่สามารถอัปเดตสถานะได้');
      }
    } catch (error) {
      setUpdateError('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  // คอมโพเนนต์แสดงสถานะ
  const renderOrderStatusContent = () => {
    if (!order) return null;
    
    switch(order.OrderStatus) {
      case 'awaiting_payment':
        return <AwaitingPaymentContent order={order} />;
      case 'pending_verification':
        return <PendingVerificationContent 
                order={order}
                isUpdatingStatus={isUpdatingStatus}
                error={updateError}
              />;
      case 'payment_verified':
        return <PaymentVerifiedContent 
                order={order}
                onMoveToProcessing={() => handleUpdateStatus('processing')}
                isUpdatingStatus={isUpdatingStatus}
                error={updateError}
              />;
      case 'processing':
        return <ProcessingContent 
                order={order} 
                candidates={order.candidates || []} 
                expandedCandidate={expandedCandidate}
                setExpandedCandidate={setExpandedCandidate}
                orderId={orderId}
              />;
      case 'completed':
        return <CompletedContent 
                order={order} 
                candidates={order.candidates || []}
              />;
      case 'cancelled':
        return <CancelledContent order={order} />;
      default:
        return <div>สถานะไม่ได้ระบุ</div>;
    }
  };
  
  // คอมโพเนนต์แสดงสถานะรอชำระเงิน
const AwaitingPaymentContent = ({ order }) => (
  <div className="bg-[#F5F7FF] rounded-xl p-10 mt-6 text-center">
    <div className="flex flex-col items-center justify-center mb-6">
      {/* รูปภาพ smart watch */}
        <div className="h-40 w-40 rounded-xl flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 bg-[#444DDA] opacity-15 rounded-xl"></div>
          <img 
            src="/smart-watch.png" 
            alt="Verified Payment" 
            className="h-30 w-30" 
          />
        </div>
      
      {/* ข้อความหลัก */}
      <h3 className="text-2xl font-semibold text-gray-800 mb-2">รอการชำระเงิน</h3>
      <p className="text-gray-600 mb-6">
        กำลังรอการชำระเงินจากผู้ใช้
      </p>
    </div>
  </div>
);
  // คอมโพเนนต์แสดงสถานะรอตรวจสอบการชำระเงิน (แก้ไขแล้ว)
const PendingVerificationContent = ({ 
  order,
  isUpdatingStatus,
  error
}) => {
  const [zoomedImage, setZoomedImage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const handleImageZoom = (imageUrl) => {
    setZoomedImage(imageUrl === zoomedImage ? null : imageUrl);
  };

  const handleCloseZoom = (e) => {
    if (e.target.tagName !== 'IMG') {
      setZoomedImage(null);
    }
  };

// ฟังก์ชันอัปเดตสถานะการชำระเงิน (แก้ไขให้ใช้ toast)
const handleUpdatePaymentStatus = async (orderId, newStatus) => {
  let loadingToastId;
  
  try {
    setProcessing(true);
    
    if (!order || !order.payment) {
      throw new Error('ไม่พบข้อมูลการชำระเงิน');
    }
    
    // แสดง loading toast
    loadingToastId = toastLoading('กำลังอัปเดตสถานะการชำระเงิน...');
    
    // ใช้ payment ID แทน order ID
    const paymentId = order.payment._id;
    console.log('Updating payment status for paymentId:', paymentId);
    
    // ปรับเป็นรูปแบบที่ backend ต้องการ
    const result = await updatePaymentStatus(paymentId, {
      paymentStatus: newStatus
    });
    
    if (result.success) {
      // อัปเดตสถานะ Order ตามสถานะการชำระเงิน
      if (newStatus === 'completed') {
        await updateOrderStatus(orderId, 'payment_verified');
        
        // ดึงข้อมูล order ล่าสุด
        const updatedOrder = await getOrderWithDetails(orderId);
        
        // ส่งอีเมลแจ้งเตือนลูกค้า (ถ้ามีฟังก์ชันนี้)
        if (typeof sendPaymentApprovedToUser === 'function') {
          await sendPaymentApprovedToUser(updatedOrder);
        }
      }  else if (newStatus === 'failed' || newStatus === 'refunded') {
    await updateOrderStatus(orderId, 'awaiting_payment');
    
    // ส่งอีเมลแจ้งเตือนลูกค้าว่าการชำระเงินถูกปฏิเสธ
    try {
      console.log('Payment was rejected, preparing to send notification email...');
      
      // ดึงข้อมูล order ล่าสุด
      console.log('Fetching updated order data...');
    const updatedOrder = await getOrderWithDetails(orderId);
      console.log('Updated order data fetched:', updatedOrder);
      
      // ส่งอีเมลแจ้งเตือนลูกค้า
      if (typeof sendPaymentRejectedToUser === 'function') {
        console.log('Sending payment rejection email...');
        const emailResult = await sendPaymentRejectedToUser(updatedOrder);
        console.log('Payment rejection email result:', emailResult);
      } else {
        console.warn('sendPaymentRejectedToUser function not available');
      }
    } catch (emailError) {
      console.error('Failed to send payment rejection email:', emailError);
      // ไม่ต้องยกเลิกกระบวนการทั้งหมดหากส่งอีเมลไม่สำเร็จ
    }
      } else if (newStatus === 'pending_verification') {
        await updateOrderStatus(orderId, 'pending_verification');
      }
      
      // อัพเดต loading toast เป็น success
      update(loadingToastId, {
        render: 'อัปเดตสถานะการชำระเงินสำเร็จ! กำลังรีเฟรชหน้า...',
        type: 'success',
        isLoading: false,
        autoClose: 2000,
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      });
      
      // รีโหลดหน้าหลังจาก 2 วินาที
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      throw new Error(result.message || 'การอัปเดตสถานะล้มเหลว');
    }
  } catch (error) {
    // ส่วนจัดการข้อผิดพลาดที่มีอยู่เดิม
  } finally {
    setProcessing(false);
  }
};

  return (
    <div className="bg-[#F5F7FF] rounded-xl p-6 mt-6">
      {/* ส่วนหัว */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center h-20 w-20 bg-[#E8EAFF] rounded-full mb-4">
          <ClockIcon className="h-10 w-10 text-[#444DDA]" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">รอตรวจสอบการชำระเงิน</h3>
        <p className="text-sm text-gray-600 max-w-lg mx-auto">
          ลูกค้าได้อัปโหลดหลักฐานการชำระเงินแล้ว โปรดตรวจสอบรายละเอียดและยืนยันการชำระเงิน
        </p>
      </div>
      
      {/* ข้อความแสดงข้อผิดพลาด */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-sm text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      {/* ข้อมูลการชำระเงิน */}
      {order.payment && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gradient-to-r from-[#444DDA] to-[#5A67DD]">
            <h4 className="text-white font-medium flex justify-between items-center">
              <span>รายละเอียดการชำระเงิน</span>
              <span className="text-sm bg-white text-[#444DDA] px-2 py-1 rounded-full">
                {order.payment.Payment_ID}
              </span>
            </h4>
          </div>
          
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">วิธีการชำระเงิน</p>
                <p className="font-medium">
                  {order.payment.paymentMethod === 'bank_transfer' ? 'โอนเงินผ่านธนาคาร' : 
                   order.payment.paymentMethod === 'qr_payment' ? 'QR พร้อมเพย์' :
                   order.payment.paymentMethod || 'ไม่ระบุ'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">จำนวนเงิน</p>
                <p className="font-medium text-[#444DDA] text-lg">
                  {order.payment.transferInfo?.amount
                    ? parseInt(order.payment.transferInfo.amount).toLocaleString()
                    : order.TotalPrice.toLocaleString()
                  } บาท
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">วันที่ชำระเงิน</p>
                <p className="font-medium">
                  {order.payment.transferInfo?.date 
                    ? new Date(order.payment.transferInfo.date).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                    : new Date(order.payment.timestamp).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  }
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">วันที่แจ้งชำระเงิน</p>
                <p className="font-medium">
                  {new Date(order.payment.createdAt).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {order.payment.transferInfo?.name && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">ชื่อผู้โอน</p>
                  <p className="font-medium">{order.payment.transferInfo.name}</p>
                </div>
              )}

              {order.payment.transferInfo?.reference && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">รหัสอ้างอิง/เลขที่บัญชี</p>
                  <p className="font-medium">{order.payment.transferInfo.reference}</p>
                </div>
              )}
            </div>
            
            {/* รูปสลิป */}
            {order.payment.transferInfo?.receiptUrl && (
              <div className="border border-gray-200 rounded-lg p-2 mb-6">
                <p className="text-sm text-gray-500 mb-2">สลิปการโอนเงิน:</p>
                <div className="flex justify-center">
                  <img 
                    src={order.payment.transferInfo.receiptUrl} 
                    alt="Payment Slip" 
                    className="max-h-80 object-contain cursor-pointer hover:opacity-90 transition-opacity rounded-lg" 
                    onClick={() => handleImageZoom(order.payment.transferInfo.receiptUrl)}
                  />
                </div>
              </div>
            )}
            
            {/* ปุ่มดำเนินการ - ใช้ในรูปแบบเดียวกับตัวอย่างที่ให้มา */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleUpdatePaymentStatus(order._id, 'completed')}
                disabled={processing || isUpdatingStatus}
                className={`px-4 py-2 rounded-lg font-medium ${
                  processing || isUpdatingStatus
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {processing || isUpdatingStatus ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2 inline-block" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังยืนยัน...
                  </>
                ) : (
                  'ยืนยันการชำระเงิน'
                )}
              </button>
              
              <button
                onClick={() => handleUpdatePaymentStatus(order._id, 'failed')}
                disabled={processing || isUpdatingStatus}
                className={`px-4 py-2 rounded-lg font-medium ${
                  processing || isUpdatingStatus
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {processing || isUpdatingStatus ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2 inline-block" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังปฏิเสธ...
                  </>
                ) : (
                  'ปฏิเสธการชำระเงิน'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal สำหรับแสดงรูปภาพขนาดใหญ่ - แก้ไขพื้นหลังให้เบลอ */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={handleCloseZoom}
        >
          <div className="relative max-w-4xl max-h-screen p-4">
            <button
              className="absolute -top-2 -right-2 bg-white rounded-full p-3 shadow-lg text-gray-800 hover:bg-gray-200 transition-colors z-10"
              onClick={() => setZoomedImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={zoomedImage} 
              alt="สลิปการโอนเงิน (ขยาย)" 
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl border-4 border-white"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// คอมโพเนนต์แสดงสถานะยืนยันการชำระเงินแล้ว
const PaymentVerifiedContent = ({ order, onMoveToProcessing, isUpdatingStatus, error }) => {
  return (
    <div className="bg-[#F5F7FF] rounded-xl p-10 mt-6 text-center">
      <div className="flex flex-col items-center justify-center mb-6">
        {/* รูปภาพ smart watch */}
        <div className="h-40 w-40 rounded-xl flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 bg-[#444DDA] opacity-15 rounded-xl"></div>
          <img 
            src="/smart-watch.png" 
            alt="Verified Payment" 
            className="h-30 w-30" 
          />
        </div>
        
        {/* ข้อความหลัก */}
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">ข้อมูลที่ต้องตรวจสอบ</h3>
        <p className="text-gray-600 mb-6">
          กำลังรอการส่งข้อมูลที่ต้องตรวจสอบจากผู้ใช้
        </p>
        
        {/* แสดงข้อผิดพลาด (ถ้ามี) */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-sm text-red-700">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};
  
  // คอมโพเนนต์แสดงสถานะกำลังดำเนินการ
 // ProcessingContent Component ที่ปรับปรุงแล้ว
const ProcessingContent = ({ order, candidates, expandedCandidate, setExpandedCandidate, orderId }) => {
  const [candidateDocs, setCandidateDocs] = useState({});
  const [loadingDocs, setLoadingDocs] = useState({});

  const truncateFileName = (fileName, maxLength = 30) => {
  if (!fileName || fileName.length <= maxLength) return fileName;
  
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.slice(0, fileName.lastIndexOf('.'));
  const maxNameLength = maxLength - extension.length - 4; // -4 for "..." and "."
  
  if (nameWithoutExt.length <= maxNameLength) return fileName;
  
  return `${nameWithoutExt.slice(0, maxNameLength)}...${extension}`;
};
  
  // โหลดเอกสารเมื่อคลิกที่ expandedCandidate
  useEffect(() => {
    if (expandedCandidate && !candidateDocs[expandedCandidate]) {
      fetchCandidateDocuments(expandedCandidate);
    }
  }, [expandedCandidate]);

  // ฟังก์ชันโหลดเอกสารจาก API
  const fetchCandidateDocuments = async (candidateId) => {
    if (!candidateId) return;
    
    setLoadingDocs(prev => ({ ...prev, [candidateId]: true }));
    
    try {
      const docsData = await getDocumentsByCandidate(candidateId);
      console.log("API Response:", docsData);
      setCandidateDocs(prev => ({ ...prev, [candidateId]: docsData }));
    } catch (err) {
      console.error('Error fetching documents:', err);
      setCandidateDocs(prev => ({ ...prev, [candidateId]: { serviceDocuments: [] } }));
    } finally {
      setLoadingDocs(prev => ({ ...prev, [candidateId]: false }));
    }
  };
  
  // แสดงสถานะของเอกสารในแต่ละ service
  const getStatusBadge = (documents, requiredDocs) => {
    const requiredCount = requiredDocs?.length || 0;
    const uploadedCount = documents?.length || 0;
    
    if (uploadedCount >= requiredCount && requiredCount > 0) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
        <CheckCircleIcon className="h-3 w-3 mr-1" />ครบถ้วน
      </span>;
    } else if (uploadedCount > 0) {
      return <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full flex items-center">
        <ClockIcon className="h-3 w-3 mr-1" />ไม่ครบถ้วน ({uploadedCount}/{requiredCount})
      </span>;
    } else {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
        <ExclamationCircleIcon className="h-3 w-3 mr-1" />ยังไม่มีเอกสาร
      </span>;
    }
  };

  // ฟอร์แมตขนาดไฟล์
  const formatFileSize = (size) => {
    if (!size) return '0 KB';
    
    const kb = size / 1024;
    if (kb < 1024) return `${Math.round(kb * 10) / 10} KB`;
    return `${Math.round((kb / 1024) * 10) / 10} MB`;
  };
  
  // แสดงไอคอนตามประเภทไฟล์
  const getFileIcon = (fileType) => {
    if (!fileType) return null;
    
    let bgColor = 'bg-gray-100';
    fileType = fileType.toLowerCase();
    
    if (fileType === 'pdf') bgColor = 'bg-orange-100';
    else if (['png', 'jpg', 'jpeg'].includes(fileType)) bgColor = 'bg-yellow-100';
    else if (['doc', 'docx'].includes(fileType)) bgColor = 'bg-blue-100';
    
    return (
      <div className={`h-8 w-8 ${bgColor} rounded-lg flex items-center justify-center`}>
        <span className="text-xs font-bold uppercase">{fileType}</span>
      </div>
    );
  };

  // แสดงข้อมูลเอกสารของ candidate
  const renderDocuments = (candidate) => {
    const candidateId = candidate._id;
    
    // ถ้ากำลังโหลด
    if (loadingDocs[candidateId]) {
      return <div className="py-6 text-center">
        <div className="inline-block animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mb-2"></div>
        <p className="text-gray-600">กำลังโหลดข้อมูลเอกสาร...</p>
      </div>;
    }
    
    // ถ้ายังไม่มีข้อมูล
    if (!candidateDocs[candidateId]) {
      return <div className="text-gray-500 text-center py-4">
        ยังไม่มีข้อมูลเอกสาร กรุณารอสักครู่...
      </div>;
    }
    
    const docs = candidateDocs[candidateId];
    
    if (!docs.serviceDocuments || docs.serviceDocuments.length === 0) {
      return <div className="text-gray-500 text-center py-4">
        ยังไม่มีเอกสารที่อัปโหลด
      </div>;
    }
    
    // สร้างกลุ่มเอกสารตาม service type ที่คล้ายกับภาพตัวอย่าง
    const serviceGroups = {};
    
    // กำหนดกลุ่มหลักตามประเภทการตรวจสอบที่พบบ่อย
    docs.serviceDocuments.forEach(serviceDoc => {
      const service = serviceDoc.service || {};
      const serviceTitle = service.title || 'บริการตรวจสอบ';
      
      // ถ้ายังไม่มีกลุ่มนี้ ให้สร้างใหม่
      if (!serviceGroups[serviceTitle]) {
        serviceGroups[serviceTitle] = [];
      }
      
      // เพิ่ม service เข้าไปในกลุ่ม
      serviceGroups[serviceTitle].push(serviceDoc);
    });
    
    // แสดงเอกสารแยกตามกลุ่ม service
    return (
      <div className="space-y-8">
        {Object.entries(serviceGroups).map(([groupTitle, services], groupIndex) => (
          <div key={groupIndex} className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">{groupTitle}</h3>
            
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {services.map((serviceData, idx) => {
                const service = serviceData.service || {};
                const documents = serviceData.documents || [];
                const requiredDocuments = service.requiredDocuments || [];
                
                // สร้าง map ของเอกสารที่ต้องการ
                const requiredDocsMap = {};
                requiredDocuments.forEach(doc => {
                  requiredDocsMap[doc.document_id] = doc;
                });
                
                return requiredDocuments.map((requiredDoc, docIdx) => {
                  const docId = requiredDoc.document_id;
                  const uploadedDoc = documents.find(d => d.documentType === docId);
                  const fileType = requiredDoc.file_types?.[0] || 'doc';
                  
                  return (
                    <div key={`${idx}-${docIdx}`} className="rounded-lg overflow-hidden">
                      <div className="mb-2">
                        <h4 className="text-sm font-medium text-gray-800">{requiredDoc.document_name}</h4>
                      </div>
                      <div className="flex items-center border-2 border-gray-300 hover:border-gray-400 rounded-xl overflow-hidden transition-colors">
                        <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center">
                          <div className="w-10 h-10 bg-yellow-400 rounded-lg flex flex-col items-center justify-center overflow-hidden relative">
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                              <div className="w-6 h-7 bg-white rounded-sm flex items-end justify-end" style={{ clipPath: 'polygon(0 0, 70% 0, 100% 30%, 100% 100%, 0 100%)' }}>
                                <div className="w-3 h-3 bg-gray-100 border-t border-l border-gray-300"></div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase text-gray-700 mt-1 relative z-10">
                              {(uploadedDoc?.fileName?.split('.').pop() || fileType || 'doc').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 p-3">
                          <div 
                            className="text-sm font-medium truncate" 
                            title={uploadedDoc ? uploadedDoc.fileName : 'ยังไม่มีเอกสาร'}
                          >
                            {uploadedDoc ? truncateFileName(uploadedDoc.fileName) : 'ยังไม่มีเอกสาร'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {uploadedDoc ? `ขนาดไฟล์: ${formatFileSize(uploadedDoc.fileSize || 1024 * 1024)}` : 'ยังไม่อัปโหลดเอกสาร'}
                          </div>
                        </div>
                        
                        <div className="px-3 py-3 flex-shrink-0">
                          {uploadedDoc ? (
                            <a href={uploadedDoc.filePath} target="_blank" rel="noopener noreferrer" 
                              className="inline-block px-4 py-1.5 bg-amber-600 text-white text-xs rounded-full font-medium hover:bg-amber-700 transition-colors">
                              ดาวน์โหลด
                            </a>
                          ) : (
                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                              ยังไม่อัปโหลด
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="bg-amber-50 rounded-xl p-6 mb-6">
        <div className="flex items-center">
          <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
            <AdjustmentsHorizontalIcon className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800">กำลังดำเนินการตรวจสอบ</h3>
            <p className="text-sm text-gray-600">
              อยู่ในขั้นตอนการตรวจสอบประวัติ โปรดอัปโหลดผลการตรวจสอบเมื่อดำเนินการเสร็จสิ้น
            </p>
          </div>
        </div>
      </div>
      
      {/* Candidates Table */}
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-md mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-center py-3 px-4 font-medium text-gray-600 w-12">#</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">ชื่อเต็ม</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">ชื่อบริษัท</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">อีเมล</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">การตรวจสอบ</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">ข้อมูล</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">รายงานผล</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate, index) => (
                <React.Fragment key={candidate._id || index}>
                  <tr className="bg-white border-b border-gray-200 rounded-lg overflow-hidden">
                    <td className="text-center py-4 px-4 text-gray-700">{index + 1}</td>
                    <td className="py-4 px-4 font-medium text-gray-800">{candidate.C_FullName}</td>
                    <td className="py-4 px-4 text-gray-700">{candidate.C_Company_Name || '-'}</td>
                    <td className="py-4 px-4 text-gray-700">{candidate.C_Email}</td>
                    <td className="py-4 px-4">
                      {candidate.services && candidate.services.map((service, sIndex) => (
                        <span key={sIndex} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs mr-1 mb-1">
                          {service.name}
                        </span>
                      ))}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        className="inline-flex items-center px-3 py-1.5 bg-yellow-400 text-yellow-800 rounded-full text-xs font-medium"
                        onClick={() => setExpandedCandidate(expandedCandidate === (candidate._id || index) ? null : (candidate._id || index))}
                      >
                        <span className="mr-1">
                          {expandedCandidate === (candidate._id || index) ? 'ซ่อน' : 'ดู'}
                        </span>
                        <svg 
                          className={`w-4 h-4 transform ${expandedCandidate === (candidate._id || index) ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {candidate.result ? (
                        <span className={`px-2 py-1 rounded text-xs ${getResultTagColor(candidate.result.resultStatus)}`}>
                          {getResultLabel(candidate.result.resultStatus)}
                        </span>
                      ) : (
                        <Link 
                          href={`/admin/dashboard/${orderId}/add-result?candidateId=${candidate._id || index}`}
                          className="inline-block px-3 py-1 bg-[#444DDA] text-white rounded text-xs hover:bg-[#3B43BF]"
                        >
                          เพิ่มผลตรวจสอบ
                        </Link>
                      )}
                    </td>
                  </tr>
                  
                  {/* Expanded Documents */}
                  {expandedCandidate === (candidate._id || index) && (
                    <tr className="bg-gray-50">
                      <td colSpan="7" className="py-4 px-6">
                        <div className="border-t border-gray-200 pt-4">
                          {renderDocuments(candidate)}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Summary - ปรับแก้ส่วนนี้ตามที่ต้องการ */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">สรุปสถานะการตรวจสอบ</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#F5F7FF] rounded-xl p-4 border border-[#E0E4FF] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#444DDA]"></div>
            <p className="text-sm text-[#444DDA] mb-1 font-medium">จำนวนผู้สมัครทั้งหมด</p>
            <p className="text-2xl font-bold text-[#444DDA]">{candidates.length} คน</p>
          </div>
          
          <div className="bg-[#F5F7FF] rounded-xl p-4 border border-[#E0E4FF] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#444DDA]"></div>
            <p className="text-sm text-[#444DDA] mb-1 font-medium">ตรวจสอบแล้ว</p>
            <p className="text-2xl font-bold text-[#444DDA]">
              {candidates.filter(c => c.result).length} คน
            </p>
          </div>
          
          <div className="bg-[#F5F7FF] rounded-xl p-4 border border-[#E0E4FF] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#444DDA]"></div>
            <p className="text-sm text-[#444DDA] mb-1 font-medium">รอตรวจสอบ</p>
            <p className="text-2xl font-bold text-[#444DDA]">
              {candidates.filter(c => !c.result).length} คน
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <Link
            href={`/admin/dashboard/${orderId}/add-result`}
            className="px-4 py-2.5 bg-[#444DDA] text-white rounded-xl hover:bg-[#3B43BF] transition shadow-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            เพิ่มผลตรวจสอบใหม่
          </Link>
        </div>
      </div>
    </div>
  );
};
  
// คอมโพเนนต์แสดงสถานะเสร็จสิ้น - แก้ไขให้คล้าย User
const CompletedContent = ({ order, candidates }) => {
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  // นับจำนวนบริการที่เสร็จแล้วและรวมของแต่ละคน
  function getCandidateProgress(candidate) {
    if (!candidate.services || !candidate.serviceResults) {
      return { completed: candidate.services ? candidate.services.length : 0, total: candidate.services ? candidate.services.length : 0 };
    }
    
    const total = candidate.services.length;
    const completed = candidate.serviceResults.length;
    return { completed, total };
  }

  const services = order.services || [];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[40px] border border-gray-200 overflow-hidden p-8">
          {/* ข้อมูลบริษัทและข้อมูลการชำระเงิน */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            {/* ข้อมูลบริษัท */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">ข้อมูลบริษัท</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm">ชื่อเต็ม</p>
                  <p className="font-medium">{order.user?.username}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">ชื่อบริษัท</p>
                  <p className="font-medium">{order.user?.companyName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">ที่อยู่อีเมล</p>
                  <p className="font-medium">{order.user?.email}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">หมายเลขโทรศัพท์</p>
                  <p className="font-medium">{order.user?.phoneNumber}</p>
                </div>
              </div>
            </div>
            
            {/* ข้อมูลการชำระเงิน */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">ข้อมูลการชำระเงิน</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm">รหัสการชำระเงิน</p>
                  <p className="font-medium">{order.payment?.Payment_ID}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">วิธีการชำระเงิน</p>
                  <p className="font-medium">{order.payment?.paymentMethod === "qr_payment" ? "QR Payment" : order.payment?.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">ราคารวม</p>
                  <p className="font-medium">{order?.TotalPrice && `${order.TotalPrice.toLocaleString()} บาท`}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">สถานะ</p>
                  <p className="font-medium">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      จ่ายเรียบร้อย
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* แสดงความคืบหน้า - เสร็จสมบูรณ์ 100% */}
          <div className="mb-10 bg-[#F5F7FF] p-6 rounded-lg border border-[#E0E4FF]">
            <h3 className="text-lg font-semibold text-[#444DDA] mb-4">ความคืบหน้าการตรวจสอบ</h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div className="bg-[#444DDA] h-4 rounded-full transition-all duration-500" style={{width: '100%'}}></div>
            </div>
            <p className="text-gray-600 text-sm">
              การตรวจสอบเสร็จสมบูรณ์แล้ว (100%)
            </p>
          </div>

          {/* รายการการตรวจสอบประวัติ */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">รายการการตรวจสอบประวัติ</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#F5F7FF]">
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-[#444DDA]">
                      หมายเลข
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-[#444DDA]">
                      ประเภทการตรวจสอบประวัติ
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-[#444DDA]">
                      จำนวนคน
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-[#444DDA]">
                      ผู้สมัคร
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service, serviceIndex) => (
                    <tr key={serviceIndex} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {serviceIndex + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {service.title || 'บริการตรวจสอบ'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {candidates.filter(c => c.services && Array.isArray(c.services) && c.services.includes(service._id)).length || candidates.length}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex flex-col space-y-2">
                          {candidates.map((candidate, idx) => (
                            <div key={idx}>
                              {candidate.C_FullName}, {candidate.C_Email}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ผลการตรวจสอบของผู้สมัครแต่ละคน */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-[#444DDA] mb-6 border-b-2 border-[#444DDA] pb-2">
              ผลการตรวจสอบประวัติของผู้สมัคร
            </h3>
            
            {candidates.map((candidate, index) => {
              const progress = getCandidateProgress(candidate);
              return (
                <div key={index} className="mb-10 border-2 border-[#E0E4FF] rounded-xl overflow-hidden shadow-sm">
                  {/* Header สำหรับแต่ละ candidate */}
                  <div className="bg-[#444DDA] text-white p-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {candidate.C_FullName}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                          {candidate.C_Email}
                        </span>
                        <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                          {progress.completed}/{progress.total} บริการ
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFC107] text-[#444DDA]">
                          เสร็จสมบูรณ์
                        </span>
                      </div>
                    </div>
                    {candidate.C_Company_Name && (
                      <p className="text-sm text-white/80 mt-1">
                        บริษัท: {candidate.C_Company_Name}
                      </p>
                    )}
                  </div>
                  
                  <div className="p-6 bg-white">
                    {/* ผลการตรวจสอบแต่ละบริการ */}
                    <div className="mb-6">
                      <h5 className="text-md font-medium text-[#444DDA] mb-4 border-l-4 border-[#444DDA] pl-3">
                        ผลการตรวจสอบแต่ละบริการ
                      </h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {candidate.services && candidate.services.map((service, serviceIndex) => {
                          const serviceId = service.id || service;
                          const serviceResult = candidate.serviceResults?.find(r => r.serviceId === serviceId);
                          
                          // หาชื่อบริการ (ใช้ลำดับที่ถูกต้อง)
                          let serviceName = 'บริการตรวจสอบ';
                          
                          // วิธีที่ 1: จาก service.name (มีอยู่แล้วใน object)
                          if (service.name) {
                            serviceName = service.name;
                          }
                          // วิธีที่ 2: จาก serviceResult (ถ้ามีผลแล้ว)
                          else if (serviceResult?.serviceName) {
                            serviceName = serviceResult.serviceName;
                          }
                          // วิธีที่ 3: จาก services array ใน order
                          else if (services?.length > 0) {
                            const foundService = services.find(s => s._id === serviceId);
                            if (foundService?.title) {
                              serviceName = foundService.title;
                            }
                          }
                          
                          const status = serviceResult ? serviceResult.resultStatus : 'completed';
                          
                          return (
                            <div key={serviceIndex} className="border border-gray-200 rounded-lg p-4 bg-[#F5F7FF] hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full bg-[#444DDA] flex items-center justify-center mr-3 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <h6 className="font-medium text-gray-800">
                                    {serviceName}
                                  </h6>
                                </div>
                                
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                                  ${status === 'pass' ? 'bg-green-100 text-green-800' : 
                                    status === 'fail' ? 'bg-red-100 text-red-800' : 
                                      'bg-[#FFC107] text-[#444DDA]'}`}>
                                  {status === 'pass' ? 'ผ่าน' : 
                                    status === 'fail' ? 'ไม่ผ่าน' : 'เสร็จสิ้น'}
                                </span>
                              </div>
                              
                              {serviceResult && serviceResult.resultFile && (
                                <div className="mt-3 flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
                                  <div className="flex items-center flex-1 min-w-0">
                                    <div className="h-10 w-10 bg-[#FFC107]/20 rounded-lg flex items-center justify-center mr-3 text-[#FFC107]">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate" title={serviceResult.resultFileName || 'ผลการตรวจสอบ.pdf'}>
                                        {serviceResult.resultFileName || 'ผลการตรวจสอบ.pdf'}
                                      </p>
                                      {serviceResult.resultFileSize && (
                                        <p className="text-xs text-gray-500">
                                          {formatFileSize(serviceResult.resultFileSize)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={() => handleDownload(serviceResult.resultFile)}
                                    className="ml-2 px-3 py-1.5 bg-[#FFC107] hover:bg-[#FFB000] text-[#444DDA] text-sm font-medium rounded transition-colors flex items-center"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    ดาวน์โหลด
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* ผลการตรวจสอบรวม */}
                    {candidate.summaryResult ? (
                      <div className="mt-6">
                        <h5 className="text-md font-medium text-[#444DDA] mb-4 border-l-4 border-[#444DDA] pl-3">
                          ผลการตรวจสอบโดยรวม
                        </h5>
                        
                        <div className="border-2 border-[#444DDA]/20 rounded-lg p-5 bg-[#F5F7FF]">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center mb-2">
                                <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                                  candidate.summaryResult.overallStatus === 'pass' ? 'bg-green-500' : 
                                  candidate.summaryResult.overallStatus === 'fail' ? 'bg-red-500' : 
                                  'bg-[#FFC107]'}`}></div>
                                <h6 className="font-semibold text-gray-800 text-lg">
                                  ผลการตรวจสอบโดยรวม: {' '}
                                  <span className={
                                    candidate.summaryResult.overallStatus === 'pass' ? 'text-green-600' : 
                                    candidate.summaryResult.overallStatus === 'fail' ? 'text-red-600' : 
                                    'text-[#FFC107]'
                                  }>
                                    {candidate.summaryResult.overallStatus === 'pass' ? 'ผ่าน' : 
                                    candidate.summaryResult.overallStatus === 'fail' ? 'ไม่ผ่าน' : 'เสร็จสิ้น'}
                                  </span>
                                </h6>
                              </div>
                            </div>
                            
                            {/* ปุ่มดาวน์โหลดรายงานรวม */}
                            {candidate.summaryResult.resultFile && (
                              <button
                                onClick={() => handleDownload(candidate.summaryResult.resultFile)}
                                className="px-4 py-2 bg-[#444DDA] hover:bg-[#3B43BF] text-white text-sm font-medium rounded-lg transition-colors flex items-center shadow-md hover:shadow-lg"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                ดาวน์โหลดรายงานสรุป
                              </button>
                            )}
                          </div>
                          
                          {/* แสดงไฟล์สรุป */}
                          {candidate.summaryResult.resultFile && (
                            <div className="flex items-center p-3 rounded-lg border border-[#444DDA]/20 bg-white">
                              <div className="h-12 w-12 bg-[#444DDA]/10 rounded-lg flex items-center justify-center mr-4 text-[#444DDA]">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium" title={candidate.summaryResult.resultFileName || 'รายงานสรุป.pdf'}>
                                  {candidate.summaryResult.resultFileName || 'รายงานสรุป.pdf'}
                                </p>
                                {candidate.summaryResult.resultFileSize && (
                                  <p className="text-xs text-gray-500">
                                    PDF • {formatFileSize(candidate.summaryResult.resultFileSize)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6">
                        <h5 className="text-md font-medium text-[#444DDA] mb-4 border-l-4 border-[#444DDA] pl-3">
                          ผลการตรวจสอบโดยรวม
                        </h5>
                        <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-gray-500">การตรวจสอบเสร็จสมบูรณ์</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* แสดงข้อความแจ้งสถานะเสร็จสิ้น */}
          <div className="text-center p-6 bg-[#F5F7FF] rounded-lg border border-[#E0E4FF]">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-full bg-[#444DDA]/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#444DDA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h4 className="text-lg font-medium text-[#444DDA] mb-2">การตรวจสอบประวัติเสร็จสมบูรณ์</h4>
            <p className="text-gray-600">
              การตรวจสอบประวัติของท่านได้เสร็จสิ้นแล้ว สามารถดาวน์โหลดผลลัพธ์ได้ที่ด้านบน
            </p>
            <p className="text-gray-500 text-sm mt-2">
              หากมีข้อสงสัยเพิ่มเติม กรุณาติดต่อทีมงานของเรา
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
  
  // คอมโพเนนต์แสดงสถานะยกเลิก
  const CancelledContent = ({ order }) => (
    <div className="bg-red-50 rounded-xl p-8 mt-6">
      <div className="flex items-center justify-center mb-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
          <XCircleIcon className="h-8 w-8 text-red-500" />
        </div>
      </div>
      <h3 className="text-lg font-medium text-center text-gray-800 mb-2">คำขอตรวจสอบถูกยกเลิก</h3>
      <p className="text-sm text-center text-gray-600 mb-2">
        คำขอตรวจสอบนี้ถูกยกเลิกแล้ว
      </p>
      <p className="text-xs text-center text-gray-500 mb-6">
        ยกเลิกเมื่อ: {formatDate(order.updatedAt)}
      </p>
    </div>
  );

const OrderProgressBar = ({ currentStatus }) => {
  const steps = [
    { 
      id: 1, 
      name: 'รอชำระเงิน', 
      status: 'awaiting_payment',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      id: 2, 
      name: 'ตรวจสอบการชำระเงิน', 
      status: 'pending_verification',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 3, 
      name: 'ยืนยันการชำระเงินแล้ว', 
      status: 'payment_verified',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 4, 
      name: 'กำลังดำเนินการ', 
      status: 'processing',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    { 
      id: 5, 
      name: 'เสร็จสิ้น', 
      status: 'completed',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      )
    }
  ];

  const getCurrentStep = (status) => {
    if (status === 'cancelled') return 0;
    const step = steps.find(step => step.status === status);
    return step ? step.id : 0;
  };

  const getStepState = (stepId, currentStep) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  const activeStep = getCurrentStep(currentStatus);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
      <div className="relative">
        {/* Progress Line Background */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200" 
             style={{ 
               left: '24px', 
               right: '24px' 
             }} />
        
        {/* Active Progress Line */}
        <div 
          className="absolute top-6 left-6 h-0.5 bg-gradient-to-r from-[#444DDA] to-[#5A67DD] transition-all duration-700 ease-out"
          style={{
            width: activeStep > 1 ? `calc(${((activeStep - 1) / (steps.length - 1)) * 100}% - 12px)` : '0%'
          }}
        />

        {/* Steps */}
        <div className="flex justify-between items-start relative">
          {steps.map((step, index) => {
            const stepState = getStepState(step.id, activeStep);
            
            return (
              <div key={step.id} className="flex flex-col items-center group">
                {/* Step Circle */}
                <div className="relative">
                  <div
                    className={`
                      w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 transform
                      ${stepState === 'completed' 
                        ? 'bg-gradient-to-r from-[#444DDA] to-[#5A67DD] border-[#444DDA] text-white shadow-lg scale-105' 
                        : stepState === 'current'
                        ? 'bg-white border-[#444DDA] text-[#444DDA] shadow-md scale-110 ring-4 ring-[#444DDA] ring-opacity-20'
                        : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                      }
                    `}
                  >
                    {stepState === 'completed' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className={`transition-all duration-300 ${stepState === 'current' ? 'scale-110' : ''}`}>
                        {step.icon}
                      </div>
                    )}
                  </div>
                  
                  {/* Current Step Pulse Animation */}
                  {stepState === 'current' && (
                    <div className="absolute inset-0 rounded-full border-2 border-[#444DDA] animate-ping opacity-30"></div>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-4 text-center max-w-[140px]">
                  <div 
                    className={`
                      text-sm font-medium transition-all duration-300
                      ${stepState === 'completed' || stepState === 'current' 
                        ? 'text-[#444DDA]' 
                        : 'text-gray-500'
                      }
                    `}
                  >
                    {step.name}
                  </div>
                  
                  {/* Step Number */}
                  <div 
                    className={`
                      text-xs mt-1 transition-all duration-300
                      ${stepState === 'completed' || stepState === 'current' 
                        ? 'text-[#444DDA] opacity-70' 
                        : 'text-gray-400'
                      }
                    `}
                  >
                    ขั้นตอนที่ {step.id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
  
 // แสดงผลหน้า
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <Link 
          href="/admin/dashboard"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          กลับไปหน้า Dashboard
        </Link>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">ไม่พบข้อมูลคำขอตรวจสอบ</p>
            </div>
          </div>
        </div>
        <Link 
          href="/admin/dashboard"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          กลับไปหน้า Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      {/* ===== ส่วนใหม่ที่ปรับปรุงแล้ว ===== */}
      
      {/* Header with back button and title */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/admin/dashboard" className="mr-4 text-gray-600 hover:text-gray-800 transition-colors">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-800">
                รหัสการตรวจสอบประวัติ: <span className="text-gray-800">#{order.TrackingNumber}</span>
              </h1>
              {getStatusBadge(order.OrderStatus)}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 ml-10">
          สร้างเมื่อ {formatDate(order.createdAt)} • อัปเดตล่าสุด {formatDate(order.updatedAt)}
        </p>
      </div>
      <OrderProgressBar currentStatus={order.OrderStatus} />
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Left Column - Customer Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#444DDA] to-[#5A67DD] p-6">
            <h2 className="text-lg font-semibold text-white">ข้อมูลบริษัท</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">ชื่อเต็ม</p>
                  <p className="font-medium text-gray-800">{order.user?.username || order.user?.fullName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">ชื่อบริษัท</p>
                  <p className="font-medium text-gray-800">{order.user?.companyName || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">ที่อยู่อีเมล</p>
                  <p className="font-medium text-gray-800 break-all text-sm">{order.user?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">หมายเลขโทรศัพท์</p>
                  <p className="font-medium text-gray-800">{order.user?.phoneNumber || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Payment Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#444DDA] to-[#5A67DD] p-6">
            <h2 className="text-lg font-semibold text-white">ข้อมูลการชำระเงิน</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">รหัสการชำระเงิน</p>
                  <p className="font-medium text-gray-800 font-mono text-sm">{order.payment?.Payment_ID || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">วิธีชำระเงิน</p>
                  <p className="font-medium text-gray-800">
                    {order.payment?.paymentMethod === 'qr_payment' ? 'QR Payment' : 
                     order.payment?.paymentMethod === 'bank_transfer' ? 'โอนเงินผ่านธนาคาร' : 
                     order.payment?.paymentMethod || '-'}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">ราคารวม</p>
                  <p className="font-bold text-xl text-[#444DDA]">{order.TotalPrice?.toLocaleString() || '0'} บาท</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">สถานะ</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  order.payment?.paymentStatus === 'completed' ? 'bg-green-50 text-green-700 border border-green-200' : 
                  order.payment?.paymentStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 
                  order.payment?.paymentStatus === 'pending_verification' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  'bg-gray-50 text-gray-700 border border-gray-200'
                }`}>
                  {order.payment?.paymentStatus === 'completed' ? '✓ จ่ายแล้ว' : 
                  order.payment?.paymentStatus === 'pending' ? '⏳ รอดำเนินการ' : 
                  order.payment?.paymentStatus === 'pending_verification' ? '🔍 รอตรวจสอบ' :
                  order.payment?.paymentStatus || 'ไม่ระบุ'}
                </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Status-specific content - ใช้ฟังก์ชันเดิม */}
      {renderOrderStatusContent()}
    </div>
  );
}