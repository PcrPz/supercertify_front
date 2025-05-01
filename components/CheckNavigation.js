'use client';
// components/CheckNavigation.jsx

import { usePathname, useRouter } from 'next/navigation';
import { useCheck } from '@/context/CheckContext';

export default function CheckNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { checkMode, cart } = useCheck();

  // กำหนดขั้นตอนการทำงานและเส้นทางที่เกี่ยวข้อง
  const steps = [
    { id: 'mode', label: 'เลือกโหมด', path: '/background-check' },
    { id: 'services', label: 'เลือกบริการ', path: '/background-check/select-services' },
    { id: 'packages', label: 'แพ็คเกจ', path: '/background-check/packages' },
    { id: 'form', label: 'ข้อมูลผู้สมัคร', path: '/background-check/applicant-form' },
  ];

  // ตรวจสอบขั้นตอนปัจจุบัน
  const getCurrentStep = () => {
    const currentStep = steps.findIndex(step => step.path === pathname);
    return currentStep >= 0 ? currentStep : 0;
  };

  // ไปยังขั้นตอนที่เลือก (ถ้าสามารถเข้าถึงได้)
  const goToStep = (stepIndex) => {
    const currentStep = getCurrentStep();
    
    // ตรวจสอบว่าสามารถไปยังขั้นตอนนั้นได้หรือไม่
    // ไม่สามารถข้ามไปยังขั้นตอนที่มากกว่า 1 ขั้นได้
    if (stepIndex > currentStep + 1) {
      return;
    }
    
    // ถ้าเป็นขั้นตอนกรอกข้อมูล ตรวจสอบว่ามีสินค้าในตะกร้าหรือไม่
    if (stepIndex === 3 && cart.length === 0) {
      alert('กรุณาเลือกบริการอย่างน้อย 1 รายการก่อนไปยังขั้นตอนถัดไป');
      return;
    }
    
    router.push(steps[stepIndex].path);
  };

  return (
    <div className="mb-8">
      <div className="max-w-3xl mx-auto flex items-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* ขั้นตอน */}
            <div 
              className={`flex items-center justify-center rounded-full w-8 h-8 text-sm ${
                index <= getCurrentStep() 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              } cursor-pointer`}
              onClick={() => goToStep(index)}
            >
              {index + 1}
            </div>
            
            {/* ชื่อขั้นตอน */}
            <div 
              className={`ml-2 mr-8 text-sm ${
                index <= getCurrentStep() ? 'text-gray-800' : 'text-gray-500'
              } hidden sm:block cursor-pointer`}
              onClick={() => goToStep(index)}
            >
              {step.label}
            </div>
            
            {/* เส้นเชื่อม (ยกเว้นขั้นตอนสุดท้าย) */}
            {index < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${
                index < getCurrentStep() ? 'bg-indigo-600' : 'bg-gray-300'
              }`}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}