'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrderById, updatePayment } from '@/services/apiService';
import { sendPaymentNotificationToAdmin } from '@/services/emailService';

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
  
  // ข้อมูลการโอนเงิน (สำหรับทั้งสองวิธี)
  const [transferInfo, setTransferInfo] = useState({
    name: '',
    date: '',
    amount: '',
    reference: '', // เลขอ้างอิง หรือ 3-4 ตัวท้ายของเลขบัญชี
    receipt: null,
    receiptPreview: null
  });

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
    if (!transferInfo.name || !transferInfo.date || !transferInfo.amount) {
      throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
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
    if (transferInfo.reference) {
      formData.append('transferInfo.reference', transferInfo.reference);
    }
    
    // เพิ่มไฟล์สลิป (ถ้ามี)
    if (transferInfo.receipt) {
      formData.append('receipt', transferInfo.receipt);
    }
    
    // ลบฟังก์ชัน uploadReceipt เพราะไม่จำเป็นต้องใช้แล้ว
    // เราส่งไฟล์ไปยัง API โดยตรงผ่าน FormData
    
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
        window.location.href = `//background-check/payment-success?orderId=${orderId}`;
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
  
  return (
    <div className="container max-w-2xl mx-auto p-8">
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
            <button
              onClick={() => handlePaymentMethodChange('qr_payment')}
              className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'qr_payment' ? 'border-[#444DDA] bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
            >
              <div className="flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 mb-2 ${paymentMethod === 'qr_payment' ? 'text-[#444DDA]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span className={`text-sm font-medium ${paymentMethod === 'qr_payment' ? 'text-[#444DDA]' : 'text-gray-600'}`}>QR พร้อมเพย์</span>
              </div>
            </button>
            
            <button
              onClick={() => handlePaymentMethodChange('bank_transfer')}
              className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'bank_transfer' ? 'border-[#444DDA] bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
            >
              <div className="flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 mb-2 ${paymentMethod === 'bank_transfer' ? 'text-[#444DDA]' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                <span className={`text-sm font-medium ${paymentMethod === 'bank_transfer' ? 'text-[#444DDA]' : 'text-gray-600'}`}>โอนเงินผ่านธนาคาร</span>
              </div>
            </button>
          </div>
          
          {/* แสดงรายละเอียดตามวิธีการชำระเงิน */}
          {paymentMethod === 'qr_payment' && (
            <div className="border-t border-gray-200 pt-6">
              <div className="text-center">
                <h4 className="font-medium mb-4">สแกน QR Code เพื่อชำระเงิน</h4>
                
                {/* QR Code สมมติ (ในระบบจริงควรสร้าง QR Code จริง) */}
                <div className="bg-white border-4 border-[#444DDA] w-64 h-64 mx-auto mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <p className="text-sm text-gray-500 mt-2">ตัวอย่าง QR Code</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 text-left">
                  <h5 className="font-medium mb-2">ข้อมูลการชำระเงิน</h5>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-gray-600">ชื่อบัญชี:</span>
                      <span className="font-medium">บริษัท SuperCertify จำกัด</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">หมายเลขพร้อมเพย์:</span>
                      <span className="font-medium">0-9999-99999-99-9</span>
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
          
          {paymentMethod === 'bank_transfer' && (
            <div className="border-t border-gray-200 pt-6">
              <div className="text-center mb-6">
                <h4 className="font-medium mb-4">โอนเงินเข้าบัญชีธนาคาร</h4>
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 text-left">
                  <h5 className="font-medium mb-2">ข้อมูลบัญชี</h5>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-gray-600">ธนาคาร:</span>
                      <span className="font-medium">ธนาคารกสิกรไทย</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">ชื่อบัญชี:</span>
                      <span className="font-medium">บริษัท SuperCertify จำกัด</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">เลขบัญชี:</span>
                      <span className="font-medium">XXX-X-XXXXX-X</span>
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
                {paymentMethod === 'qr_payment' ? 'รหัสอ้างอิง (ถ้ามี)' : 'เลขที่บัญชี 4 ตัวท้าย'}
              </label>
              <input
                type="text"
                value={transferInfo.reference}
                onChange={(e) => handleTransferInfoChange('reference', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={paymentMethod === 'qr_payment' ? "รหัสอ้างอิง" : "4 ตัวท้าย เช่น 1234"}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">อัปโหลดสลิป (ถ้ามี)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {transferInfo.receiptPreview && (
                <div className="mt-2 border rounded-xl p-2 overflow-hidden">
                  <img src={transferInfo.receiptPreview} alt="สลิปการโอนเงิน" className="max-h-44 mx-auto" />
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