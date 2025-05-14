'use client'
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getOrderById } from '@/services/apiService';
import { ClipboardCopy } from 'lucide-react';

export default function DocumentSubmissionSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const { orderId } = params;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (!orderId) {
      setError('ไม่พบรหัสคำสั่งซื้อ');
      setLoading(false);
      return;
    }
    
    async function fetchOrderData() {
      try {
        const orderData = await getOrderById(orderId);
        setOrder(orderData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
        setLoading(false);
      }
    }
    
    fetchOrderData();
  }, [orderId]);
  
  const goToDashboard = () => {
    router.push('/background-check/dashboard');
  };

  const copyTrackingNumber = () => {
    const trackingNumber = order?.TrackingNumber || "SCT26993706424";
    navigator.clipboard.writeText(trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex justify-center items-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#444DDA] mx-auto mb-6"></div>
          <p className="text-lg text-gray-700 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex justify-center items-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-100 text-red-600 p-8 rounded-2xl shadow-lg mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl font-medium">{error}</p>
          </div>
          <button 
            onClick={goToDashboard}
            className="bg-[#444DDA] text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            กลับไปยังหน้าหลัก
          </button>
        </div>
      </div>
    );
  }
  
  // The main success view with improved styling
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Main Content Card with deeper shadow and more rounded corners */}
        <div className="bg-white border-0 rounded-3xl p-6 md:p-12 shadow-2xl">
          {/* Logo without background */}
          <div className="flex justify-center mb-2">
            <img
              src="/SC-Thank.png"
              alt="SUPERCERTIFY"
              className="h-20"
            />
          </div>
          
          {/* Thank you message with improved typography */}
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 leading-tight">
              ขอบคุณ! คุณได้ส่งข้อมูลผู้สมัครแล้ว
            </h2>
            <p className="text-base text-gray-700 mb-2">
              รหัสการตรวจสอบประวัติถูกส่งไปยังบัญชีอีเมลของคุณ
            </p>
            <p className="text-base text-blue-600 font-medium mb-6">
              {order?.user?.email || "pacharaeiamsongkram@gmail.com"}
            </p>
            <p className="text-base text-gray-700">
              รหัสตรวจสอบประวัติของคุณสำหรับติดตามสถานะการประมวลผลคือ
            </p>
          </div>
          
          {/* Background Check ID with improved copy button */}
          <div className="flex justify-center items-center space-x-3 mb-10">
            <h3 className="text-3xl font-bold text-[#444DDA]">
              #{order?.TrackingNumber || "SCT26993706424"}
            </h3>
            <button 
              onClick={copyTrackingNumber}
              className={`${copied ? 'bg-green-500' : 'bg-yellow-400'} 
                        text-black text-xs px-3 py-1.5 rounded-full flex items-center 
                        transition-all duration-300 hover:bg-yellow-500 shadow-sm`}
            >
              <ClipboardCopy className="h-3.5 w-3.5 mr-1 mb-1" />
              <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
            </button>
          </div>
          
          {/* Additional content - Thank you message and survey link with improvements */}
          <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-6 rounded-2xl mb-8 text-center shadow-inner">
            <p className="text-base text-gray-800 mb-4 leading-relaxed">
              ขอบคุณพระคุณลูกค้าทุกท่านสำหรับการใช้บริการ <span className="font-semibold">Supercertify</span> เเละไว้วางใจให้เราเป็นส่วนหนึ่งในการคัดกรองบุคคลากรเเละพัฒนาคุณภาพองค์กรของท่าน
            </p>
            <p className="text-base text-gray-800 mb-6 leading-relaxed">
              <span className="font-semibold">แวนเนส พลัส คอลซัลติ้ง</span> ขอรบกวนเวลาอันมีค่าเพียง 5 นาทีของท่าน ทำเเบบสอบถามความพึงพอใจในการใช้บริการของเรา พร้อมรับโปรโมชั่นสุดพิเศษจากเราเป็นการขอบคุณ
            </p>
            <a 
              href="https://docs.google.com/forms/d/1oKOG8iPsH6TRfVBVYGuOCcEOKLfE7zLi6qAoNXLKIGw/viewform?edit_requested=true"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#444DDA] text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition-all duration-300 inline-block shadow-md hover:shadow-lg"
            >
              ทำแบบสอบถาม
            </a>
          </div>
          
          {/* Added footer with dashboard button */}
          <div className="text-center mt-8">
            <button 
              onClick={goToDashboard}
              className="text-[#444DDA] border-2 border-[#444DDA] px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors"
            >
              กลับไปยังแดชบอร์ด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}