import React, { useEffect, useState } from 'react';
import { checkAuthStatus } from '@/services/auth';

const ProcessingContent = ({ order }) => {
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
  
  // รับค่า user และข้อมูลอื่นๆ จาก prop order
  const orderUser = order?.user;
  const services = order?.services || [];
  const candidates = order?.candidates || [];
  const payment = order?.payment || {};
  
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
                  <p className="font-medium">{payment?.Payment_ID}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">วิธีการชำระเงิน</p>
                  <p className="font-medium">{payment?.paymentMethod === "qr_payment" ? "QR Payment" : payment?.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">ราคารวม</p>
                  <p className="font-medium">{order?.TotalPrice && `${order.TotalPrice.toLocaleString()} บาท`}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">สถานะ</p>
                  <p className="font-medium">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                      ${payment?.paymentStatus === "completed" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                      {payment?.paymentStatus === "completed" ? "จ่ายเรียบร้อย" : "ยังไม่จ่าย"}
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

          {/* แสดงข้อความแจ้งสถานะการประมวลผล */}
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="flex justify-center mb-4">
              <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">กำลังดำเนินการตรวจสอบประวัติ</h4>
            <p className="text-gray-600">
              ระบบกำลังประมวลผลข้อมูลการตรวจสอบประวัติของคุณ กรุณารอการอัปเดตจากทีมงาน
            </p>
            <p className="text-gray-500 text-sm mt-2">
              คุณจะได้รับการแจ้งเตือนทางอีเมลเมื่อการตรวจสอบประวัติเสร็จสมบูรณ์
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingContent;