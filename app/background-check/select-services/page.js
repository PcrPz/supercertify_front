// ใน ServicesPage.js - ปรับให้เข้ากับธีมเดิมมากขึ้น
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCheck } from '@/context/CheckContext';
import ServicesList from '@/components/services/ServicesList';
import PackagesList from '@/components/services/PackagesList';
import CartList from '@/components/services/CartList';

export default function ServicesPage() {
  const router = useRouter();
  const { cart, checkMode } = useCheck();
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
      
      {/* แสดงโหมดที่เลือก - แบบเรียบง่าย */}
      <div className="max-w-md mx-auto mb-8 bg-[#444DDA]/10 border border-[#444DDA]/20 rounded-xl p-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-[#444DDA] flex items-center justify-center mr-4">
            {checkMode === 'company' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-800">โหมดที่เลือก: <span className="text-[#444DDA] font-bold">{checkMode === 'company' ? 'บริษัท' : 'ส่วนตัว'}</span></h3>
            <p className="text-sm text-gray-600 mt-1">
              {checkMode === 'company' 
                ? 'คุณสามารถเพิ่มผู้สมัครได้หลายคน' 
                : 'จำกัดผู้สมัคร 1 คนเท่านั้น'}
            </p>
          </div>
        </div>
      </div>
      
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