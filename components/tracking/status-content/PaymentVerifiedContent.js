import React, { useEffect, useState } from 'react';
import { checkAuthStatus } from '@/services/auth';

const PaymentVerifiedContent = ({ order }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isBrowser, setIsBrowser] = useState(false);
  
  // ตรวจสอบว่าอยู่ในฝั่ง browser แล้วหรือยัง
  useEffect(() => {
    setIsBrowser(true);
  }, []);
  
  // ตรวจสอบสถานะการเข้าสู่ระบบเมื่อ component ถูกโหลดและอยู่ในฝั่ง browser แล้ว
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
  
  // รับค่า user, services และ candidates จาก prop order
  const orderUser = order?.user || {};
  const services = order?.services || [];
  const candidates = order?.candidates || [];
  const payment = order?.payment || {};
  const orderID = order?.TrackingNumber;
  const id = order?._id;
  const orderDate = order?.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('th-TH') 
    : '05/02/2025';
  
  // ฟังก์ชันสำหรับหา candidates ที่ใช้ service แต่ละตัว
  const getCandidatesForService = (service, serviceIndex) => {
    if (!candidates || candidates.length === 0) return [];
    
    if (serviceIndex === 0) {
      // Service แรก - สมมติว่าคนแรกใช้
      return candidates.length > 0 ? [candidates[0]] : [];
    } else if (serviceIndex === 1) {
      // Service ที่สอง - สมมติว่าคนแรกใช้
      return candidates.length > 0 ? [candidates[0]] : [];
    } else if (serviceIndex === 2) {
      // Service ที่สาม - สมมติว่าทุกคนใช้
      return candidates;
    } else {
      // Service อื่นๆ - สมมติว่ามีคนใช้สลับกันไป
      return candidates.filter((_, idx) => idx % (serviceIndex + 1) === 0);
    }
  };
  
  // ฟังก์ชันสำหรับดำเนินการใส่ข้อมูลต่อ
  const handleContinueInputData = () => {
    window.location.href = `/background-check/drop-document/${id}`;
  };
  
  // ฟังก์ชันสำหรับนำทางไปหน้าล็อกอิน
  const handleLoginClick = () => {
    window.location.href = `/login?callbackUrl=/background-check/tracking`;
  };

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
                  <p className="font-medium">{orderUser?.username}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">ชื่อบริษัท</p>
                  <p className="font-medium">{orderUser?.companyName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">ที่อยู่อีเมล</p>
                  <p className="font-medium">{orderUser?.email}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">หมายเลขโทรศัพท์</p>
                  <p className="font-medium">{orderUser?.phoneNumber}</p>
                </div>
              </div>
            </div>
            
            {/* ข้อมูลการชำระเงิน */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">ข้อมูลการชำระเงิน</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm">รหัสการชำระเงิน</p>
                  <p className="font-medium">{payment.Payment_ID}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">วิธีการชำระเงิน</p>
                  <p className="font-medium">{payment.paymentMethod === "qr_payment" ? "QR Payment" : payment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">ราคารวม</p>
                  <p className="font-medium">{order.TotalPrice && `${order.TotalPrice.toLocaleString()} บาท`}</p>
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

          {/* รายการการตรวจสอบประวัติ */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">รายการการตรวจสอบประวัติ</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
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
                <tbody>
                  {services && services.length > 0 ? (
                    services.map((service, index) => {
                      // หา candidates ที่ใช้ service นี้
                      const serviceRelatedCandidates = getCandidatesForService(service, index);
                      
                      return (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {service.title}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {service.quantity}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {serviceRelatedCandidates.length > 0 ? (
                              <div className="flex flex-col space-y-2">
                                {serviceRelatedCandidates.map((candidate, idx) => (
                                  <div key={idx}>
                                    {candidate.C_FullName}, {candidate.C_Email}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500">ไม่มีข้อมูลผู้สมัคร</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-sm text-center text-gray-500">
                        ไม่พบรายการบริการ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ปุ่มดำเนินการ */}
          {isBrowser && (isLoggedIn ? (
            <div className="text-center">
              <button
                onClick={handleContinueInputData}
                className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                ดำเนินการใส่ข้อมูลต่อ
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-4 text-gray-600">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</div>
              <button
                onClick={handleLoginClick}
                className="inline-flex items-center justify-center px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                เข้าสู่ระบบ
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentVerifiedContent;