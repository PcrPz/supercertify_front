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
     <h1 className="text-3xl font-medium text-center mb-12">เลือกจำนวนคนที่ต้องการ</h1>
     
     {/* ปุ่มเลือกโหมด */}
     <div className="max-w-md mx-auto relative bg-white rounded-full p-1.5 flex mb-12 border-2 border-black">
       <button 
         className={`relative z-10 flex-1 py-3 rounded-full text-center transition-colors duration-300 ${
           checkMode === 'company' 
             ? 'bg-[#444DDA] text-white' 
             : 'text-black'
         }`}
         onClick={() => setCheckMode('company')}
       >
         บริษัท
       </button>
       <button 
         className={`relative z-10 flex-1 py-3 rounded-full text-center transition-colors duration-300 ${
           checkMode === 'personal' 
             ? 'bg-[#444DDA] text-white' 
             : 'text-black'
         }`}
         onClick={() => setCheckMode('personal')}
       >
         ส่วนตัว
       </button>
     </div>
     
     <h2 className="text-xl text-center mb-10">
       เลือกประเภทจำนวนคนที่คุณต้องการตรวจสอบ
     </h2>
     
     {/* การ์ดเลือกประเภทการตรวจสอบ */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
       {/* การตรวจสอบแบบบริษัท */}
       <div 
         onClick={() => setCheckMode('company')}
         className={`
           relative overflow-hidden cursor-pointer
           rounded-2xl p-6 flex flex-col items-center 
           transition-all duration-500 ease-in-out
           shadow-xl
           ${checkMode === 'company' 
             ? 'bg-gradient-to-br from-[#444DDA] to-[#444DDA] text-white scale-105' 
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
             ? 'bg-gradient-to-br from-[#444DDA] to-[#444DDA] text-white scale-105' 
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
     
     {/* ปุ่มดำเนินการต่อ */}
     <div className="text-center">
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