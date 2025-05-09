'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getOrderById, checkPaymentStatus } from '@/services/apiService';

export default function PaymentSuccessPage() {
  const router = useRouter();
  // เปลี่ยนเป็น window.location.search เพื่อดึงค่าจาก URL โดยตรง
  const [params, setParams] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  
  // ดึง params จาก URL โดยตรง
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const id = searchParams.get('orderId');
      setParams(searchParams);
      setOrderId(id);
      console.log('OrderId from URL:', id);
    }
  }, []);
  
  // ใช้ useEffect แยกเพื่อรอให้ orderId มีค่าก่อน
  useEffect(() => {
    if (!orderId) {
      return; // รอให้ orderId มีค่าก่อน
    }
    
    async function fetchOrderData() {
      try {
        console.log('Fetching order data for ID:', orderId);
        // เพิ่มการลองใหม่อัตโนมัติ
        let attempts = 0;
        let maxAttempts = 3;
        let orderData = null;
        
        while (attempts < maxAttempts && !orderData) {
          try {
            orderData = await getOrderById(orderId);
            console.log('Attempt', attempts + 1, 'Received order data:', orderData);
            
            if (!orderData) {
              throw new Error('Order data is null');
            }
          } catch (err) {
            attempts++;
            console.log(`Attempt ${attempts} failed, waiting before retry...`);
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              throw err; // ถ้าลองครบ 3 ครั้งแล้วยังไม่ได้ ให้โยน error
            }
          }
        }
        
        setOrder(orderData);
        console.log(orderData,"sdasdasaddasdsadsasdasaadsadsadsads");
        // ดึงสถานะการชำระเงิน
        const paymentData = await checkPaymentStatus(orderId);
        console.log(orderData.orderStatus,orderData.payment?.paymentStatus)
        // อัปเดตสถานะการชำระเงินโดยพิจารณาจาก order และ payment
        const status = orderData.OrderStatus === 'payment_verified' && 
                       orderData.payment?.paymentStatus === 'completed' 
                       ? 'completed' 
                       : 'pending_verification';
        
        setPaymentStatus(status);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order data:', err);
        setError('ไม่สามารถดึงข้อมูลได้: ' + err.message);
        setLoading(false);
      }
    }
    
    fetchOrderData();
  }, [orderId]);
  
  
  // แปลสถานะการชำระเงินเป็นภาษาไทย
  const getStatusText = (status) => {
    switch(status) {
      case 'completed':
        return 'ชำระเงินสำเร็จ';
      case 'pending_verification':
        return 'รอการตรวจสอบ';
      case 'awaiting_payment':
        return 'รอการชำระเงิน';
      case 'failed':
        return 'การชำระเงินล้มเหลว';
      default:
        return 'รอการตรวจสอบ';
    }
  };
  
  // กำหนดข้อความคำแนะนำตามสถานะ
  const getStatusMessage = (status) => {
    switch(status) {
      case 'completed':
        return 'การชำระเงินของคุณเสร็จสมบูรณ์แล้ว เราจะเริ่มกระบวนการตรวจสอบประวัติตามบริการที่คุณสั่งซื้อ';
      case 'pending_verification':
        return 'เราได้รับข้อมูลการชำระเงินของคุณแล้ว ทีมงานจะตรวจสอบและยืนยันการชำระเงินภายใน 24 ชั่วโมง เมื่อยืนยันเรียบร้อยแล้ว เราจะแจ้งให้ท่านทราบทางอีเมล';
      case 'awaiting_payment':
        return 'กรุณาดำเนินการชำระเงินตามวิธีที่เลือกไว้ และกลับมายืนยันการชำระเงินเมื่อเรียบร้อย';
      case 'failed':
        return 'เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้งหรือติดต่อฝ่ายสนับสนุน';
      default:
        return 'เราได้รับข้อมูลการชำระเงินของคุณแล้ว ทีมงานจะตรวจสอบและยืนยันการชำระเงินภายใน 24 ชั่วโมง เมื่อยืนยันเรียบร้อยแล้ว เราจะแจ้งให้ท่านทราบทางอีเมล';
    }
  };

  // คำนวณส่วนลด (ถ้ามี)
  const calculateDiscount = () => {
    if (!order) return { hasDiscount: false, discountAmount: 0, discountPercentage: 0 };
    
    // ตรวจสอบว่ามีส่วนลดหรือไม่
    const originalPrice = order.OriginalPrice || order.SubTotalPrice;
    const finalPrice = order.TotalPrice;
    
    if (originalPrice && finalPrice && originalPrice > finalPrice) {
      const discountAmount = originalPrice - finalPrice;
      const discountPercentage = Math.round((discountAmount / originalPrice) * 100);
      return {
        hasDiscount: true,
        discountAmount,
        discountPercentage,
        originalPrice
      };
    }
    
    return { hasDiscount: false, discountAmount: 0, discountPercentage: 0 };
  };

  // ฟังก์ชันสำหรับรีเฟรชหน้า
  const handleRefresh = () => {
    window.location.reload();
  };
  
  // แสดงหน้าโหลดข้อมูล
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#444DDA] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  // แสดงข้อความผิดพลาด
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-100 text-red-600 p-6 rounded-xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">{error}</p>
          </div>
          <button 
            onClick={() => router.push('/background-check/services')}
            className="bg-[#444DDA] text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            กลับไปเลือกบริการ
          </button>
        </div>
      </div>
    );
  }
  
  // แสดงข้อความเมื่อไม่พบข้อมูลคำสั่งซื้อ
  if (!order) {
    return (
      <div className="container max-w-4xl mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600">ไม่พบข้อมูลคำสั่งซื้อ</p>
          <button 
            onClick={() => router.push('/background-check/services')}
            className="bg-[#444DDA] text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors mt-4"
          >
            กลับไปเลือกบริการ
          </button>
        </div>
      </div>
    );
  }
  
  // คำนวณข้อมูลส่วนลด
  const discountInfo = calculateDiscount();
  
  return (
    <div className="container max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 mt-2 ml-2">
        {paymentStatus === 'completed' ? 'Complete Payment' : 'Payment Verified'}
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">
        {/* ส่วนซ้าย - รายละเอียด Order และสถานะ */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tracking Order ID - #{order.TrackingNumber}</h2>
            <button 
              onClick={() => {navigator.clipboard.writeText(order.TrackingNumber)}}
              className="bg-yellow-400 hover:bg-yellow-500 
                 text-sm font-medium 
                 px-3 py-1 
                 rounded-full 
                 cursor-pointer 
                 hover:cursor-pointer 
                 transition-all 
                 duration-200 
                 ease-in-out"
            >
              Copy ID
            </button>
          </div>
          
          {/* ข้อมูลลูกค้า */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{order.user?.username || 'ไม่ระบุ'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="font-medium">{order.user?.email|| 'ไม่ระบุ'}</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-dashed border-gray-300 my-6"></div>
          {/* กล่องสถานะการชำระเงิน */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Background Check Process</h3>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-yellow-400 rounded-full w-12 h-10 flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Payment Status</p>
                  <p className="text-sm text-gray-600">
                    {paymentStatus === 'completed'
                      ? 'ชำระเงินเรียบร้อยแล้ว กำลังดำเนินการตรวจสอบ'
                      : 'รอการตรวจสอบและยืนยันการชำระเงิน'}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {paymentStatus === 'completed'
                      ? 'เราจะแจ้งความคืบหน้าให้ทราบทางอีเมล'
                      : 'เมื่อตรวจสอบเรียบร้อยแล้ว เราจะแจ้งให้ทราบทางอีเมล'}
                  </p>
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium 
                ${paymentStatus === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : paymentStatus === 'failed' 
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'}`}
              >
                {getStatusText(paymentStatus)}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-4">
              Tracking Process can be done with Background Check ID
            </p>
          </div>
        </div>
        
        {/* ส่วนขวา - รายละเอียดการชำระเงิน */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Payment Detail</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <p className="text-gray-600">Payment ID</p>
              <p className="font-medium">{order.payment?.Payment_ID || 'N/A'}</p>
            </div>
            
            <div className="flex justify-between">
              <p className="text-gray-600">Method</p>
              <p className="font-medium">
                {order.payment?.paymentMethod === 'qr_payment' 
                  ? 'QR Payment/E-Wallet' 
                  : order.payment?.paymentMethod === 'bank_transfer'
                    ? 'Bank Transfer'
                    : 'Other Payment Method'}
              </p>
            </div>
            <div className="flex justify-between">
              <p className="text-gray-600">Payment Date</p>
              <p className="font-medium">
                {order.payment?.transferInfo?.date || 
                  new Date(order.createdAt).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })
                }
              </p>
            </div>
            
            {/* แสดงราคาปกติ (ถ้ามีส่วนลด) */}
            {discountInfo.hasDiscount && (
              <div className="flex justify-between">
                <p className="text-gray-600">Original Price</p>
                <p className="font-medium line-through text-gray-500">
                  {discountInfo.originalPrice.toLocaleString()} BAHT
                </p>
              </div>
            )}
            
            {/* แสดงส่วนลด (ถ้ามี) */}
            {discountInfo.hasDiscount && (
              <div className="flex justify-between">
                <p className="text-gray-600">Discount</p>
                <p className="font-medium text-green-600">
                  - {discountInfo.discountAmount.toLocaleString()} BAHT ({discountInfo.discountPercentage}%)
                </p>
              </div>
            )}
            
            <div className="flex justify-between">
              <p className="text-gray-600">Total Price</p>
              <p className="font-medium">{order.TotalPrice?.toLocaleString() || 0} BAHT</p>
            </div>
            
            <div className="flex justify-between">
              <p className="text-gray-600">Status</p>
              <div className={`px-3 py-1 rounded-full text-sm font-medium 
                ${paymentStatus === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : paymentStatus === 'failed' 
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'}`}
              >
                {paymentStatus === 'completed' ? 'Paid' : 'Pending'}
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center bg-yellow-400 text-gray-700 px-4 py-3 rounded-xl">
                <p className="font-bold">Total Price</p>
                <div>
                  <p className="font-bold">
                    {order.TotalPrice?.toLocaleString()} BAHT
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-8 space-x-4">
        <button 
          onClick={handleRefresh}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-700 px-8 py-3 rounded-xl font-medium"
        >
          Refresh
        </button>
        
        <button 
          onClick={() => paymentStatus === 'completed' ? router.push('/background-check/drop-document') : router.push('/background-check/dashboard')}
          className="bg-[#444DDA] hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium"
        >
          {paymentStatus === 'completed' ? 'Drop Document' : 'Go to Dashboard'}
        </button>
      </div>
    </div>
  );
}