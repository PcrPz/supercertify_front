'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCheck } from '@/context/CheckContext';
import ServicesList from '@/components/services/ServicesList';
import PackagesList from '@/components/services/PackagesList';
import CartList from '@/components/services/CartList';

export default function ServicesPage() {
  const router = useRouter();
  const { cart } = useCheck();
  const [activeView, setActiveView] = useState('services'); // 'services' หรือ 'packages'
  
  // ฟังก์ชันเปลี่ยนไปยังหน้ากรอกข้อมูล
  const handleContinue = () => {
    if (cart.length > 0) {
      router.push('/background-check/applicant-form');
    } else {
      alert('กรุณาเลือกบริการอย่างน้อย 1 รายการ');
    }
  };

  // ฟังก์ชันกลับไปหน้าเดิม
  const handleBack = () => {
    router.push('/background-check');
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-medium text-center mb-8">บริการที่ต้องการตรวจสอบ</h1>
      
      {/* สลับระหว่างรายการบริการและแพ็คเกจ */}
      <div className="max-w-md mx-auto relative bg-white rounded-full p-1.5 flex mb-12 border-2 border-black">
        <button 
          className={`relative z-10 flex-1 py-3 rounded-full text-center transition-colors duration-300 ${
            activeView === 'services' 
              ? 'bg-[#444DDA] text-white' 
              : 'text-black'
          }`}
          onClick={() => setActiveView('services')}
        >
          ประเภทของบริการ
        </button>
        <button 
          className={`relative z-10 flex-1 py-3 rounded-full text-center transition-colors duration-300 ${
            activeView === 'packages' 
              ? 'bg-[#444DDA] text-white' 
              : 'text-black'
          }`}
          onClick={() => setActiveView('packages')}
        >
          แพ็คเกจ
        </button>
      </div>
      
      {/* แสดง Component ตาม View ที่เลือก */}
      {activeView === 'services' ? <ServicesList /> : <PackagesList />}
      
      {/* ตะกร้าบริการที่เลือก */}
      <CartList />
      
      {/* ปุ่มดำเนินการต่อและย้อนกลับ */}
      <div className="flex justify-center items-center space-x-4 mt-6">
        <button 
          onClick={handleBack}
          className="bg-gray-200 text-gray-900 px-8 py-3 rounded-md font-medium hover:bg-gray-300 transition-colors"
        >
          ย้อนกลับ
        </button>
        <button 
          onClick={handleContinue}
          className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-md font-medium hover:bg-yellow-500 transition-colors"
        >
          ดำเนินการต่อ
        </button>
      </div>
    </div>
  );
}