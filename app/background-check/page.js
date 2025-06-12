// ใน BackgroundCheckMode.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCheck } from '@/context/CheckContext';

export default function BackgroundCheckMode() {
  const router = useRouter();
  const { checkMode, setCheckMode } = useCheck();
  
  const handleContinue = () => {
    router.push('/background-check/select-services');
  };
  
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-medium text-center mb-8">เลือกจำนวนคนที่ต้องการ</h1>
      
      {/* ปุ่มเลือกโหมด - คงเดิม แต่เพิ่มไอคอน */}
      <div className="max-w-md mx-auto relative bg-white rounded-full p-1.5 flex mb-12 border-2 border-black">
        <button 
          className={`relative z-10 flex-1 py-3 rounded-full text-center transition-colors duration-300 ${
            checkMode === 'company' 
              ? 'bg-[#444DDA] text-white' 
              : 'text-black'
          }`}
          onClick={() => setCheckMode('company')}
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            บริษัท
          </div>
        </button>
        <button 
          className={`relative z-10 flex-1 py-3 rounded-full text-center transition-colors duration-300 ${
            checkMode === 'personal' 
              ? 'bg-[#444DDA] text-white' 
              : 'text-black'
          }`}
          onClick={() => setCheckMode('personal')}
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            ส่วนตัว
          </div>
        </button>
      </div>
      
      <h2 className="text-xl text-center mb-10">
        เลือกประเภทจำนวนคนที่คุณต้องการตรวจสอบ
      </h2>
      
      {/* การ์ดเลือกประเภทการตรวจสอบ - ตัดแบดจ์ "เลือกแล้ว" ออก */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
        {/* การตรวจสอบแบบบริษัท */}
        <div 
          onClick={() => setCheckMode('company')}
          className={`
            relative overflow-hidden cursor-pointer
            rounded-2xl p-6 flex flex-col items-center 
            transition-all duration-500 ease-in-out
            shadow-xl
            ${checkMode === 'company' 
              ? 'bg-gradient-to-br from-[#444DDA] to-[#444DDA] text-white scale-105 ring-4 ring-[#444DDA]/30' 
              : 'bg-white text-gray-700 border border-gray-200 opacity-70 scale-95'}
          `}
        >
          <h3 className="text-xl font-medium mb-6 relative z-10">การตรวจสอบแบบบริษัท</h3>
          
          <div className="relative h-64 w-full mb-6 z-10">
            <Image 
              src="/Company.svg" 
              alt="การตรวจสอบแบบบริษัท"
              fill
              style={{ 
                objectFit: 'contain', 
                opacity: checkMode === 'company' ? 1 : 0.5 
              }}
            />
          </div>
          
          <p className="text-center mb-6 relative z-10">
            ตรวจสอบประวัติพนักงานใหม่หรือพนักงานปัจจุบันขององค์กรของคุณ
            ครอบคลุมทุกด้านทั้งด้านการเงิน ประวัติการศึกษา ประวัติอาชญากรรม และอื่นๆ
          </p>
        </div>
        
        {/* การตรวจสอบส่วนตัว */}
        <div 
          onClick={() => setCheckMode('personal')}
          className={`
            relative overflow-hidden cursor-pointer
            rounded-2xl p-6 flex flex-col items-center 
            transition-all duration-500 ease-in-out
            shadow-xl
            ${checkMode === 'personal' 
              ? 'bg-gradient-to-br from-[#444DDA] to-[#444DDA] text-white scale-105 ring-4 ring-[#444DDA]/30' 
              : 'bg-white text-gray-700 border border-gray-200 opacity-70 scale-95'}
          `}
        >
          <h3 className="text-xl font-medium mb-6 relative z-10">การตรวจสอบส่วนตัว</h3>
          
          <div className="relative h-64 w-full mb-6 z-10">
            <Image 
              src="/Personal.svg" 
              alt="การตรวจสอบส่วนตัว"
              fill
              style={{ 
                objectFit: 'contain', 
                opacity: checkMode === 'personal' ? 1 : 0.5 
              }}
            />
          </div>
          
          <p className="text-center mb-6 relative z-10">
            ตรวจสอบประวัติส่วนบุคคลสำหรับการสมัครงาน การเช่าบ้าน หรือเพื่อความปลอดภัยส่วนบุคคล
            รับรายงานที่ครอบคลุมและเป็นความลับ
          </p>
        </div>
      </div>
      
      {/* ข้อความอธิบายโหมดที่เลือก - แบบสวยงามตามธีม */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className={`p-5 rounded-xl shadow-md transition-all duration-300 ${
          checkMode === 'company' 
            ? 'bg-gradient-to-r from-[#444DDA]/10 to-[#5B63E8]/10 border border-[#444DDA]/20' 
            : 'bg-gradient-to-r from-[#444DDA]/10 to-[#5B63E8]/10 border border-[#444DDA]/20'
        }`}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${
              checkMode === 'company' 
                ? 'bg-[#444DDA]' 
                : 'bg-[#444DDA]'
            } flex items-center justify-center text-white mr-4`}>
              {checkMode === 'company' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#444DDA]">
                โหมด{checkMode === 'company' ? 'บริษัท' : 'ส่วนตัว'}
              </h3>
              <p className="text-gray-600 mt-1">
                {checkMode === 'company' 
                  ? 'คุณสามารถตรวจสอบประวัติพนักงานได้หลายคนในคราวเดียว เหมาะสำหรับองค์กรที่ต้องการตรวจสอบพนักงานหลายคน' 
                  : 'คุณสามารถตรวจสอบประวัติได้ 1 คนเท่านั้น เหมาะสำหรับการตรวจสอบประวัติส่วนบุคคล'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* ปุ่มดำเนินการต่อ */}
      <div className="text-center">
        <button 
          onClick={handleContinue}
          className="bg-yellow-400 text-gray-900 px-10 py-3 rounded-xl font-medium hover:bg-yellow-500 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
        >
          ดำเนินการต่อ
        </button>
      </div>
    </div>
  );
}