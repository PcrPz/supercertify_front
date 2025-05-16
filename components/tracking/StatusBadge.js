// components/tracking/StatusBadge.js
import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'awaiting_payment':
        return { label: 'รอการชำระเงิน', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
      case 'pending_verification':
        return { label: 'รอการตรวจสอบการชำระเงิน', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
      case 'payment_verified':
        return { label: 'ยืนยันการชำระเงินแล้ว', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
      case 'processing':
        return { label: 'กำลังดำเนินการ', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
      case 'completed':
        return { label: 'เสร็จสิ้น', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      case 'cancelled':
        return { label: 'ยกเลิก', bgColor: 'bg-red-100', textColor: 'text-red-800' };
      default:
        return { label: 'ยังไม่จ่าย', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;