import React, { useEffect, useState } from 'react';
import { checkAuthStatus } from '@/services/auth';

const CompletedContent = ({ order }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isBrowser, setIsBrowser] = useState(false);
  
  // ตรวจสอบว่าอยู่ในฝั่ง browser แล้วหรือยัง
  useEffect(() => {
    setIsBrowser(true);
  }, []);
  
  // ตรวจสอบสถานะการเข้าสู่ระบบ
  useEffect(() => {
    if (!isBrowser) return;
    
    const checkAuth = async () => {
      try {
        const { authenticated, user } = await checkAuthStatus();
        setIsLoggedIn(authenticated);
        setUser(user);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, [isBrowser]);
  
  if (!order) {
    return <div className="p-6 text-center">ไม่พบข้อมูลคำสั่ง</div>;
  }
  
  // รับค่า user และข้อมูลอื่นๆ จาก prop order
  const orderUser = order.user || {};
  const services = order.services || [];
  const candidates = order.candidates || [];
  const payment = order.payment;
  
  // ฟังก์ชันสำหรับดาวน์โหลดไฟล์
  const handleDownload = (fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };
  
  // รูปแบบวันที่และเวลาให้สวยงาม
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // แสดงผลลัพธ์ของ candidate
  const renderCandidateResults = () => {
    return candidates.map((candidate, index) => {
      if (!candidate.result) return null;
      
      const result = candidate.result;
      return (
        <div key={index}>
          <p className="mb-2 font-medium">{candidate.C_FullName}, {candidate.C_Email}</p>
          <div className="border border-gray-200 rounded-2xl overflow-hidden mb-6">
            <div className="flex items-center p-4">
              <div className="mr-4 bg-yellow-100 p-3 rounded-full">
                <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-grow">
                <p className="font-medium">{result.resultFileName}</p>
                <p className="text-sm text-gray-500">
                  {result.resultFileType.split('/')[1].toUpperCase()} · {formatFileSize(result.resultFileSize)}
                </p>
              </div>
              <button
                onClick={() => handleDownload(result.resultFile)}
                className="ml-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                ดาวน์โหลด
              </button>
            </div>
          </div>
        </div>
      );
    }).filter(Boolean);
  };
  
  // ฟังก์ชันแปลงขนาดไฟล์ให้อ่านง่าย
  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[40px] border border-gray-200 overflow-hidden p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* ข้อมูลบริษัท */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">ข้อมูลบริษัท</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm">ชื่อเต็ม</p>
                  <p className="font-medium">{orderUser.username || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">ชื่อบริษัท</p>
                  <p className="font-medium">{orderUser.companyName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">ที่อยู่อีเมล</p>
                  <p className="font-medium">{orderUser.email || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">หมายเลขโทรศัพท์</p>
                  <p className="font-medium">{orderUser.phoneNumber || '-'}</p>
                </div>
              </div>
            </div>
            
            {/* ข้อมูลการชำระเงิน */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">ข้อมูลการชำระเงิน</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm">รหัสการชำระเงิน</p>
                  <p className="font-medium">{payment?.Payment_ID || 'PM' + order.TrackingNumber.substring(3, 11)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">วิธีการชำระเงิน</p>
                  <p className="font-medium">
                    {payment?.paymentMethod ? 
                      (payment.paymentMethod === "qr_payment" ? "QR Payment" : payment.paymentMethod) : 
                      'ใบเรียกเก็บเงิน'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">ราคารวม</p>
                  <p className="font-medium">{order.TotalPrice.toLocaleString()} บาท</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">สถานะ</p>
                  <p className="font-medium">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {payment ? 'จ่ายเรียบร้อย' : 'ยังไม่จ่าย'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* รายการการตรวจสอบประวัติ */}
          <div className="mt-10">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">รายการการตรวจสอบประวัติ</h3>
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      หมายเลข
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      ประเภทการตรวจสอบประวัติ
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      จำนวนคน
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                      ผู้สมัคร
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {services.map((service, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {service.title || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {service.quantity || 1}
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
        </div>
        
        {/* รายงานผลลัพธ์ */}
        <div className="bg-white rounded-[40px] border border-gray-200 overflow-hidden p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">รายงานผลลัพธ์</h3>
            {isBrowser && isLoggedIn && candidates.some(c => c.result) && (
              <button
                onClick={() => {
                  // ดาวน์โหลดทุกไฟล์ที่มีผลการตรวจสอบ
                  candidates.forEach(candidate => {
                    if (candidate.result && candidate.result.resultFile) {
                      window.open(candidate.result.resultFile, '_blank');
                    }
                  });
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                ดาวน์โหลดทั้งหมด
              </button>
            )}
          </div>
          
          {/* แสดงผลลัพธ์ตามข้อมูลจริง */}
          <div className="space-y-8">
            {candidates.some(c => c.result) ? (
              renderCandidateResults()
            ) : (
              <div className="p-6 text-center border border-gray-200 rounded-lg">
                <p className="text-gray-500">ยังไม่มีผลลัพธ์การตรวจสอบ</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletedContent;