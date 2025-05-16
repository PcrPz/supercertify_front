// app/admin/dashboard/[orderId]/page.client.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrderById } from '@/services/apiService';
import Link from 'next/link';

export default function OrderDetailsClient({ orderId }) {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        setLoading(true);
        const orderData = await getOrderById(orderId);
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
  
  // แสดงวันที่ในรูปแบบที่อ่านง่าย
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
  
  // แสดงสถานะในรูปแบบที่อ่านง่าย
  const getStatusBadge = (status) => {
    const statusMap = {
      'awaiting_payment': { text: 'รอชำระเงิน', class: 'bg-yellow-100 text-yellow-800' },
      'pending_verification': { text: 'รอตรวจสอบการชำระเงิน', class: 'bg-blue-100 text-blue-800' },
      'payment_verified': { text: 'ยืนยันการชำระเงินแล้ว', class: 'bg-green-100 text-green-800' },
      'processing': { text: 'กำลังดำเนินการ', class: 'bg-indigo-100 text-indigo-800' },
      'completed': { text: 'เสร็จสิ้น', class: 'bg-green-100 text-green-800' },
      'cancelled': { text: 'ยกเลิก', class: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };
  
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
              <p className="text-sm text-yellow-700">ไม่พบข้อมูลคำสั่งซื้อ</p>
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
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">รายละเอียดคำสั่งซื้อ</h1>
        <div className="flex space-x-2">
          <Link 
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            กลับไปหน้า Dashboard
          </Link>
          
          {order.OrderStatus === 'processing' && (
            <Link 
              href={`/admin/dashboard/${orderId}/add-result`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              เพิ่มผลตรวจสอบ
            </Link>
          )}
        </div>
      </div>
      
      {/* Order Information */}
      <div className="bg-white shadow-md rounded-lg mb-6">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">ข้อมูลคำสั่งซื้อ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">รหัสคำสั่งซื้อ</p>
              <p className="font-medium">{order.TrackingNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">วันที่สร้าง</p>
              <p className="font-medium">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">สถานะ</p>
              <p className="font-medium">{getStatusBadge(order.OrderStatus)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ประเภท</p>
              <p className="font-medium">{order.OrderType === 'personal' ? 'บุคคล' : 'บริษัท'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ราคารวม</p>
              <p className="font-medium">{order.TotalPrice.toLocaleString()} บาท</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ราคาก่อนภาษี</p>
              <p className="font-medium">{order.SubTotalPrice.toLocaleString()} บาท</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* User Information */}
      {order.user && (
        <div className="bg-white shadow-md rounded-lg mb-6">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">ข้อมูลลูกค้า</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">ชื่อผู้ใช้</p>
                <p className="font-medium">{order.user.username || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">อีเมล</p>
                <p className="font-medium">{order.user.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                <p className="font-medium">{order.user.phoneNumber || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ชื่อบริษัท</p>
                <p className="font-medium">{order.user.companyName || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Candidates Information */}
      <div className="bg-white shadow-md rounded-lg mb-6">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">ข้อมูลผู้สมัคร</h2>
          
          {order.candidates && order.candidates.length > 0 ? (
            <div className="space-y-6">
              {order.candidates.map((candidate, index) => (
                <div key={candidate._id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-semibold">ผู้สมัครที่ {index + 1}: {candidate.C_FullName}</h3>
                    
                    {/* Show result status if exists */}
                    {candidate.result && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        candidate.result.resultStatus === 'pass' ? 'bg-green-100 text-green-800' :
                        candidate.result.resultStatus === 'fail' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {candidate.result.resultStatus === 'pass' ? 'ผ่าน' : 
                         candidate.result.resultStatus === 'fail' ? 'ไม่ผ่าน' : 'รอผล'}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">ชื่อเต็ม</p>
                      <p className="font-medium">{candidate.C_FullName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">อีเมล</p>
                      <p className="font-medium">{candidate.C_Email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">บริษัท</p>
                      <p className="font-medium">{candidate.C_Company_Name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">วันที่สร้าง</p>
                      <p className="font-medium">{formatDate(candidate.createdAt)}</p>
                    </div>
                  </div>
                  
                  {/* Services */}
                  {candidate.services && candidate.services.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">บริการที่สมัคร</p>
                      <div className="flex flex-wrap gap-2">
                        {candidate.services.map((service, serviceIndex) => (
                          <span 
                            key={serviceIndex} 
                            className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                          >
                            {service.name || service.id || 'บริการ'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Result File (if exists) */}
                  {candidate.result && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="mr-4 bg-yellow-100 p-3 rounded-full">
                          <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-grow">
                          <p className="font-medium">{candidate.result.resultFileName || 'ผลการตรวจสอบ'}</p>
                          <p className="text-sm text-gray-500">
                            อัปโหลดเมื่อ {formatDate(candidate.result.resultAddedAt)}
                          </p>
                          {candidate.result.resultNotes && (
                            <p className="text-sm text-gray-600 mt-1">{candidate.result.resultNotes}</p>
                          )}
                        </div>
                        <a 
                          href={candidate.result.resultFile} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition duration-300"
                        >
                          ดาวน์โหลด
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">ไม่พบข้อมูลผู้สมัคร</p>
          )}
        </div>
      </div>
      
      {/* Services Information */}
      <div className="bg-white shadow-md rounded-lg mb-6">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">รายการบริการที่สั่งซื้อ</h2>
          
          {order.services && order.services.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลำดับ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บริการ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ราคาต่อหน่วย</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ราคารวม</th>
                  </tr>
                </thead>
                <tbody>
                  {order.services.map((service, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{service.title || 'ไม่ระบุ'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{service.quantity || 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{service.price?.toLocaleString() || 0} บาท</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{(service.price * service.quantity)?.toLocaleString() || 0} บาท</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan="4" className="px-6 py-3 text-right text-sm font-medium">ราคารวม:</td>
                    <td className="px-6 py-3 text-sm font-medium">{order.TotalPrice?.toLocaleString() || 0} บาท</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">ไม่พบข้อมูลบริการ</p>
          )}
        </div>
      </div>
      
      {/* Payment Information */}
      {order.payment && (
        <div className="bg-white shadow-md rounded-lg mb-6">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">ข้อมูลการชำระเงิน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">รหัสการชำระเงิน</p>
                <p className="font-medium">{order.payment.Payment_ID || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">วิธีการชำระเงิน</p>
                <p className="font-medium">
                  {order.payment.paymentMethod === 'qr_payment' ? 'QR Payment' : 
                   order.payment.paymentMethod || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">วันที่ชำระเงิน</p>
                <p className="font-medium">{formatDate(order.payment.paymentDate) || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">จำนวนเงิน</p>
                <p className="font-medium">{order.payment.amount?.toLocaleString() || '-'} บาท</p>
              </div>
            </div>
            
            {/* Payment Slip */}
            {order.payment.slipFile && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">หลักฐานการชำระเงิน</p>
                <div className="mt-2">
                  <a 
                    href={order.payment.slipFile} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <img 
                      src={order.payment.slipFile} 
                      alt="Payment Slip" 
                      className="max-h-60 max-w-full rounded-lg border border-gray-200" 
                    />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}