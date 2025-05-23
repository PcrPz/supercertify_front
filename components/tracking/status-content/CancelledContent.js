'use client';

import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const CancelledContent = ({ order }) => {
  if (!order) return null;
  
  // รับค่า user และ payment จาก prop order
  const payment = order.payment || {};
  const formattedPrice = order.TotalPrice?.toLocaleString() || '0';
  
  // จัดรูปแบบวันที่
  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่มีข้อมูล';
    
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')} ${
      ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][date.getMonth()]
    } ${date.getFullYear() + 543}`;
  };

  // ข้อมูลการยกเลิก
  const cancelDate = formatDate(order.updatedAt);
  const cancelReason = order.cancelReason || 'ไม่ระบุเหตุผล';

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="text-center p-6 border-b border-gray-200 bg-gray-50">
            <div className="bg-red-100 text-red-800 inline-flex items-center px-4 py-2 rounded-full mb-4">
              <XCircleIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">ยกเลิก</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">การตรวจสอบประวัตินี้ถูกยกเลิกแล้ว</h2>
            <p className="text-gray-600">
              รายการนี้ถูกยกเลิกเมื่อ {cancelDate}
            </p>
          </div>
          
          {/* รายละเอียดการยกเลิก */}
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-red-800 mb-2">สาเหตุการยกเลิก</h3>
              <p className="text-red-700">{cancelReason}</p>
            </div>
            
            {payment && payment.paymentStatus === 'completed' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <CheckCircleIcon className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">การชำระเงิน</h4>
                    <p className="text-yellow-700 text-sm">
                      พบการชำระเงินสำหรับรายการนี้ กรุณาติดต่อเจ้าหน้าที่เพื่อขอข้อมูลเพิ่มเติมเกี่ยวกับการคืนเงิน
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium mb-3">คำแนะนำ</h3>
              <p className="text-gray-600 mb-2">
                หากคุณต้องการตรวจสอบประวัติใหม่ กรุณาสร้างคำขอตรวจสอบประวัติใหม่
              </p>
              <p className="text-gray-600 mb-2">
                หากมีข้อสงสัยเกี่ยวกับการยกเลิกหรือต้องการข้อมูลเพิ่มเติม กรุณาติดต่อฝ่ายบริการลูกค้า
              </p>
              <div className="mt-3">
                <p className="text-gray-600 text-sm">อีเมล: support@example.com</p>
                <p className="text-gray-600 text-sm">โทรศัพท์: 02-123-4567</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelledContent;