'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrderById } from '@/services/apiService';

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId;
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!orderId) {
      setError('ไม่พบรหัสคำสั่งซื้อ');
      setLoading(false);
      return;
    }
    
    async function fetchOrderData() {
      try {
        const orderData = await getOrderById(orderId);
        
        // Calculate discount
        const discount = orderData.SubTotalPrice - orderData.TotalPrice > 0 
          ? orderData.SubTotalPrice - orderData.TotalPrice 
          : 0;

        // Modify orderData to include discount
        const processedOrderData = {
          ...orderData,
          discount: discount,
          subtotalPrice: orderData.SubTotalPrice,
          totalPrice: orderData.TotalPrice
        };

        setOrder(processedOrderData);
        console.log(processedOrderData)
        setLoading(false);
      } catch (err) {
        console.error('Complete Error fetching order:', err);
        setError('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
        setLoading(false);
      }
    }
    
    fetchOrderData();
  }, [orderId]);

  const handleProceedToPayment = () => {
    router.push(`/background-check/payment?orderId=${orderId}`);
  };
  
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
      <h1 className="text-3xl font-bold text-center mb-6">ยืนยันคำสั่งซื้อ</h1>
      
      <div className="bg-white rounded-3xl border-2 border-black shadow-xl mb-8">
        <div className="px-8 py-6 border-b-2 border-gray-300">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">รายละเอียดคำสั่งซื้อ </h3>
            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              #{order.TrackingNumber}
            </div>
          </div>
        </div>
        
        <div className="px-8 py-6 border-b border-gray-200">
          <h4 className="font-medium mb-4">บริการที่สั่งซื้อ</h4>
          
          {order.services && order.services.length > 0 ? (
            <div className="space-y-4">
              {order.services.map((service, index) => (
                <div key={index} className="flex justify-between items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium">{service.title || `บริการ #${service.service}`}</div>
                    <div className="text-sm text-gray-500">
                      {service.price.toLocaleString()} บาท x {service.quantity} คน
                    </div>
                  </div>
                  <div className="font-medium">
                    {(service.price * service.quantity).toLocaleString()} บาท
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-2">ไม่พบรายการบริการ</p>
          )}
        </div>
        
        <div className="px-8 py-6 border-b border-gray-200">
          <h4 className="font-bold text-xl text-gray-800 mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-2 mb-1 text-[#444DDA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            ข้อมูลผู้สมัคร
          </h4>
          
          {order.candidates && order.candidates.length > 0 ? (
            <div className="space-y-6">
              {order.candidates.map((candidate, index) => (
                <div 
                  key={index} 
                  className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg"
                >
                  <div className="px-6 py-4 bg-gradient-to-r from-[#444DDA]/10 to-blue-100 border-b border-gray-200 flex items-center">
                    <div className="w-12 h-12 bg-[#444DDA] text-white rounded-full flex items-center justify-center mr-4 font-bold text-lg shadow-md">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mb-1 text-[#444DDA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {candidate.C_FullName || 'ไม่ระบุชื่อ'}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mb-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {candidate.C_Email || 'ไม่ระบุอีเมล'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4">
                    {candidate.C_Company_Name && (
                      <div className="mb-4 flex items-center bg-gray-50 p-3 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 mb-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-gray-700 font-medium">
                          บริษัท: {candidate.C_Company_Name}
                        </span>
                      </div>
                    )}
                    
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
                      <h5 className="font-semibold text-blue-800 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mb-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        บริการที่เลือก
                      </h5>
                      
                      {candidate.services && candidate.services.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                            <span className="text-sm text-gray-700">
                              จำนวนบริการทั้งหมด
                            </span>
                            <span className="font-bold text-[#444DDA] bg-blue-100 px-2 py-1 rounded-full text-sm">
                              {candidate.services.length} บริการ
                            </span>
                          </div>
                          
                          <ul className="space-y-2">
                            {candidate.services.map((service, serviceIndex) => (
                              <li 
                                key={serviceIndex} 
                                className="bg-white border border-gray-100 p-3 rounded-lg flex justify-between items-center"
                              >
                                <span className="text-sm text-gray-700">
                                  {service.name}
                                </span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="text-center bg-white p-4 rounded-lg text-gray-500">
                          ไม่มีบริการที่เลือก
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-gray-400 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <p className="text-xl text-gray-600 font-medium">
                ยังไม่มีข้อมูลผู้สมัคร
              </p>
            </div>
          )}
        </div>
        
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex justify-between mb-2">
            <div className="text-gray-600">ยอดรวม:</div>
            <div className="font-medium">{order.subtotalPrice?.toLocaleString() || 0} บาท</div>
          </div>
          
          {order.discount > 0 && (
            <div className="flex justify-between mb-2 text-green-600">
              <div>ส่วนลด:</div>
              <div className="font-medium">-{order.discount?.toLocaleString() || 0} บาท</div>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200">
            <div className="font-medium text-lg">ยอดชำระทั้งสิ้น:</div>
            <div className="font-bold text-xl">{order.totalPrice?.toLocaleString() || 0} บาท</div>
          </div>
        </div>
        
        <div className="p-8">
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
            <div className="flex">
              <div className="text-yellow-600 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-700">
                  กรุณาตรวจสอบข้อมูลทั้งหมดให้ถูกต้องก่อนดำเนินการชำระเงิน
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleProceedToPayment}
            className="w-full bg-[#444DDA] text-white py-4 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-md"
          >
            ดำเนินการชำระเงิน
          </button>  
        </div>
      </div>
    </div>
  );
}