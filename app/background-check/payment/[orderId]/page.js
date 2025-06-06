'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrderById, updatePayment } from '@/services/apiService';
import { sendPaymentNotificationToAdmin } from '@/services/emailService';
import { getPaymentMethods } from '@/services/PaymentSettingsApi';



// คอมโพเนนต์ Modal สำหรับขยายรูปภาพ
function ImageModal({ isOpen, onClose, imageUrl, altText }) {
  // เมื่อ Modal ถูกเรียกใช้งาน ให้ล็อคการ scroll
  if (isOpen && typeof window !== 'undefined') {
    document.body.style.overflow = 'hidden';
  }
  
  // เมื่อปิด Modal ให้คืนค่า scroll
  const handleClose = () => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = 'auto';
    }
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm transition-all duration-300"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      }} 
      onClick={handleClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl transition-transform duration-300 transform scale-100">
        <button 
          className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110 z-10"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img 
          src={imageUrl} 
          alt={altText} 
          className="max-h-[90vh] max-w-full object-contain bg-white rounded-xl" 
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}


export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ข้อมูลการชำระเงิน
  const [paymentMethod, setPaymentMethod] = useState('qr_payment');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ข้อมูล Payment Methods จาก API
  const [paymentMethods, setPaymentMethods] = useState(null);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  
  // ข้อมูลการโอนเงิน (สำหรับทั้งสองวิธี)
  const [transferInfo, setTransferInfo] = useState({
    name: '',
    date: '',
    amount: '',
    reference: '', // เลขอ้างอิง หรือ 3-4 ตัวท้ายของเลขบัญชี
    receipt: null,
    receiptPreview: null
  });

  // Modal state สำหรับขยายรูปภาพ
  const [imageModal, setImageModal] = useState({
    isOpen: false,
    imageUrl: '',
    altText: ''
  });

  // เปิด Modal แสดงรูปภาพขยาย
  const openImageModal = (imageUrl, altText) => {
    setImageModal({
      isOpen: true,
      imageUrl,
      altText
    });
  };

  // ปิด Modal
  const closeImageModal = () => {
    setImageModal({
      ...imageModal,
      isOpen: false
    });
  };
  
  // โหลดข้อมูล Payment Methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const data = await getPaymentMethods();
        setPaymentMethods(data);
        console.log('Payment methods loaded:', data);
        
        // ตั้งค่า default payment method ตามที่เปิดใช้งาน
        if (data.qr_payment?.enabled) {
          setPaymentMethod('qr_payment');
        } else if (data.bank_transfer?.enabled) {
          setPaymentMethod('bank_transfer');
        }
      } catch (error) {
        console.error('Error loading payment methods:', error);
        // ใช้ข้อมูล default ถ้าโหลดไม่ได้
      } finally {
        setPaymentMethodsLoading(false);
      }
    };

    loadPaymentMethods();
  }, []);

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
        
        // กำหนดยอดเงินที่ต้องชำระ
        setTransferInfo(prev => ({
          ...prev,
          amount: orderData.TotalPrice.toString()
        }));
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
        setLoading(false);
      }
    }
    
    fetchOrderData();
  }, [orderId]);
  
  // จัดการการเปลี่ยนวิธีการชำระเงิน
  const handlePaymentMethodChange = (method) => {
    // ตรวจสอบว่า method นั้นเปิดใช้งานหรือไม่
    if (method === 'qr_payment' && !paymentMethods?.qr_payment?.enabled) {
      return;
    }
    if (method === 'bank_transfer' && !paymentMethods?.bank_transfer?.enabled) {
      return;
    }
    setPaymentMethod(method);
  };
  
  // จัดการการเปลี่ยนข้อมูลการโอนเงิน
  const handleTransferInfoChange = (field, value) => {
    setTransferInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // จัดการการอัปโหลดสลิป
  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTransferInfo(prev => ({
          ...prev,
          receipt: file,
          receiptPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // อัปโหลดสลิปไปยังเซิร์ฟเวอร์ (simulatedในตัวอย่างนี้) และได้ URL
  const uploadReceipt = async (file) => {
    // ในสถานการณ์จริง คุณต้องอัปโหลดไฟล์ไปยังเซิร์ฟเวอร์และรับ URL กลับมา
    // ในตัวอย่างนี้ เราจะจำลองการอัปโหลดและคืนค่า URL ตัวอย่าง
    return new Promise((resolve) => {
      setTimeout(() => {
        // สมมติว่าอัปโหลดสำเร็จและได้ URL
        resolve(transferInfo.receiptPreview);
      }, 1000);
    });
  };
  
  // จัดการการส่งข้อมูลการชำระเงิน
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!transferInfo.name || !transferInfo.date || !transferInfo.amount || !transferInfo.reference || !transferInfo.receipt) {
        throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน และอัปโหลดสลิปการโอนเงิน');
      }
      
      // สร้าง FormData สำหรับส่งข้อมูลพร้อมไฟล์
      const formData = new FormData();
      
      // เพิ่มข้อมูลการชำระเงิน
      formData.append('paymentMethod', paymentMethod);
      formData.append('orderId', orderId);
      
      // เพิ่มข้อมูลการโอนเงิน
      formData.append('transferInfo.name', transferInfo.name);
      formData.append('transferInfo.date', transferInfo.date);
      formData.append('transferInfo.amount', transferInfo.amount);
      formData.append('transferInfo.reference', transferInfo.reference);
      
      // เพิ่มไฟล์สลิป
      if (transferInfo.receipt) {
        formData.append('receipt', transferInfo.receipt);
      }
      
      // ใช้ฟังก์ชัน updatePayment จาก apiService
      const result = await updatePayment(orderId, formData);
      
      if (result.success) {
        // ส่งอีเมลแจ้งเตือนแอดมิน
        try {
          const orderData = await getOrderById(orderId);
          await sendPaymentNotificationToAdmin(orderData);
          
          // เพิ่มการหน่วงเวลา 2 วินาที เพื่อให้ข้อมูลถูกบันทึกสมบูรณ์
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // ไปยังหน้าแสดงผลการชำระเงิน
          router.push(`/background-check/payment-success?orderId=${orderId}`);
        } catch (emailError) {
          console.error('Failed to verify payment:', emailError);
          // แม้จะเกิดข้อผิดพลาดในการตรวจสอบ ก็ยังให้ไปยังหน้าถัดไป
          window.location.href = `/background-check/payment-success?orderId=${orderId}`;
        }
      } else {
        throw new Error(result.message || 'การชำระเงินล้มเหลว');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(`เกิดข้อผิดพลาดในการส่งข้อมูลชำระเงิน: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // หน้าโหลดข้อมูล
  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#444DDA] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  // หน้าแสดงข้อผิดพลาด
  if (error) {
    return (
      <div className="container max-w-2xl mx-auto p-8 flex justify-center items-center min-h-screen">
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
  
  // หน้าแสดงเมื่อไม่พบข้อมูลคำสั่งซื้อ
  if (!order) {
    return (
      <div className="container max-w-2xl mx-auto p-8 flex justify-center items-center min-h-screen">
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

  // ตรวจสอบว่ามี payment method ที่เปิดใช้งานหรือไม่
  const hasEnabledPaymentMethod = paymentMethods?.qr_payment?.enabled || paymentMethods?.bank_transfer?.enabled;

  if (!hasEnabledPaymentMethod) {
    return (
      <div className="container max-w-2xl mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="bg-yellow-100 text-yellow-800 p-6 rounded-xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-lg font-medium">ขณะนี้ยังไม่เปิดให้บริการการชำระเงิน</p>
            <p className="text-sm mt-2">กรุณาติดต่อเจ้าหน้าที่เพื่อดำเนินการชำระเงิน</p>
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

  return (
    <div className="container max-w-2xl mx-auto p-8">
      {/* Modal สำหรับแสดงรูปภาพขยาย */}
      <ImageModal 
        isOpen={imageModal.isOpen} 
        onClose={closeImageModal} 
        imageUrl={imageModal.imageUrl} 
        altText={imageModal.altText} 
      />
      
      <h1 className="text-3xl font-bold text-center mb-6">ชำระเงิน</h1>
      
      {/* สรุปคำสั่งซื้อ */}
      <div className="bg-white rounded-3xl border-2 border-black shadow-xl mb-8">
        <div className="px-8 py-6 border-b-2 border-gray-300">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">สรุปคำสั่งซื้อ</h3>
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              #{order.TrackingNumber}
            </div>
          </div>
        </div>
        
        <div className="px-8 py-6">
          <div className="flex justify-between mb-2">
            <div className="text-gray-600">ยอดรวม:</div>
            <div className="font-medium">{order.SubTotalPrice?.toLocaleString() || 0} บาท</div>
          </div>
          
          {order.SubTotalPrice > order.TotalPrice && (
            <div className="flex justify-between mb-2 text-green-600">
              <div>ส่วนลด:</div>
              <div className="font-medium">-{(order.SubTotalPrice - order.TotalPrice)?.toLocaleString() || 0} บาท</div>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">
            <div className="font-medium text-lg">ยอดชำระทั้งสิ้น:</div>
            <div className="font-bold text-xl">{order.TotalPrice?.toLocaleString() || 0} บาท</div>
          </div>
        </div>
      </div>
      
      {/* วิธีการชำระเงิน */}
      <div className="bg-white rounded-3xl border-2 border-black shadow-xl mb-8">
        <div className="px-8 py-6 border-b-2 border-gray-300">
          <h3 className="font-medium">เลือกวิธีการชำระเงิน</h3>
        </div>
        
        <div className="px-8 py-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* QR Payment Button */}
            {paymentMethods?.qr_payment?.enabled && (
              <button
                onClick={() => handlePaymentMethodChange('qr_payment')}
                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'qr_payment' ? 'border-[#444DDA] bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
              >
                <div className="flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 mb-2 ${paymentMethod === 'qr_payment' ? 'text-[#444DDA]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span className={`text-sm font-medium ${paymentMethod === 'qr_payment' ? 'text-[#444DDA]' : 'text-gray-600'}`}>
                    {paymentMethods.qr_payment.description || 'QR พร้อมเพย์'}
                  </span>
                </div>
              </button>
            )}
            
           {/* Bank Transfer Button */}
            {paymentMethods?.bank_transfer?.enabled && (
              <button
                onClick={() => handlePaymentMethodChange('bank_transfer')}
                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'bank_transfer' ? 'border-[#444DDA] bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
              >
                <div className="flex flex-col items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 mb-2 ${paymentMethod === 'bank_transfer' ? 'text-[#444DDA]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  <span className={`text-sm font-medium ${paymentMethod === 'bank_transfer' ? 'text-[#444DDA]' : 'text-gray-600'}`}>
                    {paymentMethods.bank_transfer.description || 'โอนเงินผ่านธนาคาร'}
                  </span>
                </div>
              </button>
            )}
          </div>
          
          {/* แสดงรายละเอียดตามวิธีการชำระเงิน */}
          {paymentMethod === 'qr_payment' && paymentMethods?.qr_payment?.enabled && (
            <div className="border-t border-gray-200 pt-6">
              <div className="text-center">
                <h4 className="font-medium mb-4">สแกน QR Code เพื่อชำระเงิน</h4>
                
                {/* QR Code - แสดงรูปจริงถ้ามี หรือ placeholder */}
                <div 
                  className="bg-white border-4 border-[#444DDA] w-64 h-64 mx-auto mb-4 flex items-center justify-center cursor-pointer relative group"
                  onClick={() => paymentMethods.qr_payment.qr_image && openImageModal(paymentMethods.qr_payment.qr_image, 'QR Code สำหรับชำระเงิน')}
                >
                  {paymentMethods.qr_payment.qr_image ? (
                    <>
                    <img 
                      src={paymentMethods.qr_payment.qr_image} 
                      alt="QR Code สำหรับชำระเงิน"
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-blue-900 bg-opacity-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-opacity-30 transition-all duration-300">
                      <div className="bg-white p-3 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <p className="text-sm text-gray-500 mt-2">QR Code</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 text-left">
                  <h5 className="font-medium mb-2">ข้อมูลการชำระเงิน</h5>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-gray-600">ชื่อบัญชี:</span>
                      <span className="font-medium">{paymentMethods.qr_payment.account_name}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">หมายเลขพร้อมเพย์:</span>
                      <span className="font-medium">{paymentMethods.qr_payment.account_number}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">จำนวนเงิน:</span>
                      <span className="font-medium">{order.TotalPrice?.toLocaleString() || 0} บาท</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {paymentMethod === 'bank_transfer' && paymentMethods?.bank_transfer?.enabled && (
            <div className="border-t border-gray-200 pt-6">
              <div className="text-center mb-6">
                <h4 className="font-medium mb-4">โอนเงินเข้าบัญชีธนาคาร</h4>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 text-left">
                  <h5 className="font-medium mb-2">ข้อมูลบัญชี</h5>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-gray-600">ธนาคาร:</span>
                      <span className="font-medium">{paymentMethods.bank_transfer.bank_name}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">ชื่อบัญชี:</span>
                      <span className="font-medium">{paymentMethods.bank_transfer.account_name}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">เลขบัญชี:</span>
                      <span className="font-medium">{paymentMethods.bank_transfer.account_number}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">จำนวนเงิน:</span>
                      <span className="font-medium">{order.TotalPrice?.toLocaleString() || 0} บาท</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {/* ฟอร์มยืนยันการชำระเงิน (ใช้ฟอร์มเดียวกันสำหรับทั้งสองวิธี) */}
          <form onSubmit={handleConfirmPayment} className="mt-6 border-t border-gray-200 pt-6">
            <h4 className="font-medium mb-4">ยืนยันการชำระเงิน</h4>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">ชื่อผู้โอน</label>
              <input
                type="text"
                value={transferInfo.name}
                onChange={(e) => handleTransferInfoChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ชื่อ-นามสกุล"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">วันที่โอน</label>
              <input
                type="date"
                value={transferInfo.date}
                onChange={(e) => handleTransferInfoChange('date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">จำนวนเงิน</label>
              <input
                type="text"
                value={transferInfo.amount}
                onChange={(e) => handleTransferInfoChange('amount', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                {paymentMethod === 'qr_payment' ? 'รหัสอ้างอิง' : 'เลขที่บัญชี 4 ตัวท้าย'}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={transferInfo.reference}
                onChange={(e) => handleTransferInfoChange('reference', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={paymentMethod === 'qr_payment' ? "รหัสอ้างอิง" : "4 ตัวท้าย เช่น 1234"}
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                อัปโหลดสลิป
                <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              
              {transferInfo.receiptPreview && (
                <div 
                  className="mt-2 border rounded-xl p-2 overflow-hidden cursor-pointer group relative"
                  onClick={() => openImageModal(transferInfo.receiptPreview, 'สลิปการโอนเงิน')}
                >
                <img 
                  src={transferInfo.receiptPreview} 
                  alt="สลิปการโอนเงิน" 
                  className="max-h-44 mx-auto transition-transform duration-300 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-blue-900 bg-opacity-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-opacity-30 transition-all duration-300">
                  <div className="bg-white p-3 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                </div>
              )}
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
              <div className="flex">
                <div className="text-yellow-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-700">
                    เมื่อทำการชำระเงินเรียบร้อยแล้ว กรุณากรอกข้อมูลและยืนยันการชำระเงิน
                    ทีมงานจะตรวจสอบและดำเนินการภายใน 24 ชั่วโมง
                  </p>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-[#444DDA] text-white py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันการชำระเงิน'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}