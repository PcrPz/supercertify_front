// components/tracking/TrackingSteps.js
import React from 'react';

const TrackingSteps = ({ 
  currentStep, 
  orderCreatedAt,      // เวลาสร้าง Order (Step 1)
  paymentCreatedAt,    // เวลาสร้างการชำระเงิน (Step 2)
  paymentUpdatedAt,    // เวลาอัปเดตการชำระเงิน/ยืนยันการชำระเงิน (Step 3)
  processingStartedAt, // เวลาเริ่มดำเนินการ (Step 4)
  completedAt          // เวลาเสร็จสิ้น (Step 5)
}) => {
  // กำหนดวันที่ของขั้นตอน
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('th-TH');
  };

  // คำนวณวันที่คาดว่าจะเสร็จ (5 วันจากวันที่เริ่มกระบวนการ)
  const getEstimatedDate = () => {
    if (processingStartedAt) {
      const estimatedDate = new Date(processingStartedAt);
      estimatedDate.setDate(estimatedDate.getDate() + 5);
      return `in 5 days`;
    }
    return '-';
  };

  // ตรวจสอบว่าขั้นตอนไหนเสร็จแล้วบ้าง
  const isStepCompleted = (step) => {
    return currentStep >= step;
  };

  // ตรวจสอบว่าขั้นตอนไหนเป็นขั้นตอนปัจจุบัน
  const isCurrentStep = (step) => {
    return currentStep === step;
  };

  return (
    <div className="w-full px-6 md:px-10 py-8 md:py-12">
      {/* Container ที่มีความกว้างเท่ากัน */}
      <div className="grid grid-cols-5 gap-0 relative">
        {/* เส้นเชื่อมพื้นหลังที่เริ่มจากกลางของ Step 1 และจบที่กลางของ Step 5 */}
        <div className="absolute top-4 h-0.5 bg-gray-200" 
             style={{ left: 'calc(10% + 4px)', right: 'calc(10% + 4px)', width: 'calc(80% - 8px)' }}>
        </div>
        
        {/* Step 1: สร้างคำสั่งซื้อเรียบร้อย */}
        <div className="flex flex-col items-center">
          <div className={`z-10 flex items-center justify-center w-8 h-8 rounded-full ${
            isStepCompleted(1) ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {isStepCompleted(1) ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : "1"}
          </div>
          <p className="mt-2 text-sm font-medium text-center">สร้างคำสั่งซื้อเรียบร้อย</p>
          <p className="text-xs text-gray-500 text-center">{formatDate(orderCreatedAt)}</p>
        </div>
        
        {/* Step 2: รอตรวจสอบการชำระเงิน */}
        <div className="flex flex-col items-center">
          <div className={`z-10 flex items-center justify-center w-8 h-8 rounded-full ${
            isCurrentStep(2) ? 'bg-yellow-500 text-white' : 
            isStepCompleted(2) ? 'bg-yellow-500 text-white' : 
            'bg-gray-200 text-gray-600'
          }`}>
            {isStepCompleted(2) ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : "2"}
          </div>
          <p className="mt-2 text-sm font-medium text-center">รอตรวจสอบการชำระเงิน</p>
          <p className="text-xs text-gray-500 text-center">{isStepCompleted(2) ? formatDate(paymentCreatedAt) : '-'}</p>
        </div>
        
        {/* Step 3: ชำระเงินเสร็จและรอการใส่เอกสาร */}
        <div className="flex flex-col items-center">
          <div className={`z-10 flex items-center justify-center w-8 h-8 rounded-full ${
            isCurrentStep(3) ? 'bg-yellow-500 text-white' : 
            isStepCompleted(3) ? 'bg-yellow-500 text-white' : 
            'bg-gray-200 text-gray-600'
          }`}>
            {isStepCompleted(3) ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : "3"}
          </div>
          <p className="mt-2 text-sm font-medium text-center">ชำระเงินเสร็จและรอการใส่เอกสาร</p>
          <p className="text-xs text-gray-500 text-center">{isStepCompleted(3) ? formatDate(paymentUpdatedAt) : '-'}</p>
        </div>
        
        {/* Step 4: รอดำเนินการ - เปลี่ยนสีจาก indigo-600 เป็น yellow-500 เมื่อได้ถึง step 5 แล้ว */}
        <div className="flex flex-col items-center">
          <div className={`z-10 flex items-center justify-center w-8 h-8 rounded-full ${
            isCurrentStep(4) ? 'bg-yellow-500 text-white' : 
            isStepCompleted(4) ? 'bg-yellow-500 text-white' : // เปลี่ยนจาก indigo-600 เป็น yellow-500
            'bg-gray-200 text-gray-600'
          }`}>
            {isStepCompleted(4) ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : "4"}
          </div>
          <p className="mt-2 text-sm font-medium text-center">รอดำเนินการ</p>
          <p className="text-xs text-gray-500 text-center">
            {isStepCompleted(4) || isCurrentStep(4) ? getEstimatedDate() : '-'}
          </p>
        </div>
        
        {/* Step 5: สำเร็จ */}
        <div className="flex flex-col items-center">
          <div className={`z-10 flex items-center justify-center w-8 h-8 rounded-full ${
            isStepCompleted(5) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {isStepCompleted(5) ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : "5"}
          </div>
          <p className="mt-2 text-sm font-medium text-center">สำเร็จ</p>
          <p className="text-xs text-gray-500 text-center">{isStepCompleted(5) ? formatDate(completedAt) : '-'}</p>
        </div>
      </div>
    </div>
  );
};

export default TrackingSteps;