'use client';

import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'awaiting_payment':
        return { 
          label: 'รอการชำระเงิน', 
          bgColor: 'bg-orange-100', 
          textColor: 'text-orange-800',
          borderColor: 'border-orange-200' 
        };
      case 'pending_verification':
        return { 
          label: 'รอการตรวจสอบการชำระเงิน', 
          bgColor: 'bg-blue-100', 
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200' 
        };
      case 'payment_verified':
        return { 
          label: 'ยืนยันการชำระเงินแล้ว', 
          bgColor: 'bg-cyan-100', 
          textColor: 'text-cyan-800',
          borderColor: 'border-cyan-200' 
        };
      case 'processing':
        return { 
          label: 'กำลังดำเนินการ', 
          bgColor: 'bg-amber-100', 
          textColor: 'text-amber-800',
          borderColor: 'border-amber-200' 
        };
      case 'completed':
        return { 
          label: 'เสร็จสิ้น', 
          bgColor: 'bg-green-100', 
          textColor: 'text-green-800',
          borderColor: 'border-green-200' 
        };
      case 'cancelled':
        return { 
          label: 'ยกเลิก', 
          bgColor: 'bg-red-100', 
          textColor: 'text-red-800',
          borderColor: 'border-red-200' 
        };
      default:
        return { 
          label: 'ไม่ระบุสถานะ', 
          bgColor: 'bg-gray-100', 
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200' 
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;