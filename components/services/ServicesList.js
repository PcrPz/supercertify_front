'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useCheck } from '@/context/CheckContext';
import { getServices } from '@/services/apiService';

export default function ServicesList() {
 const { checkMode, addService } = useCheck();
 const [services, setServices] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 
 useEffect(() => {
   let isMounted = true;
   
   async function loadServices() {
     try {
       setLoading(true);
       const data = await getServices();
       console.log("Loaded services:", data);
       
       if (isMounted) {
         setServices(data);
       }
     } catch (err) {
       if (isMounted) {
         setError('ไม่สามารถโหลดข้อมูลบริการได้');
         console.error(err);
       }
     } finally {
       if (isMounted) {
         setLoading(false);
       }
     }
   }
   
   loadServices();
   
   return () => {
     isMounted = false;
   };
 }, []);
 
 // แก้ไขการกรองข้อมูล
 const filteredServices = services
   .filter(service => service && (typeof service === 'object')); // กรองเฉพาะข้อมูลที่ถูกต้อง

 if (loading) return <div className="text-center py-8">กำลังโหลดข้อมูล...</div>;
 if (error) return <div className="text-center text-red-500 py-8">{error}</div>;
 
 return (
   <div>
     <h2 className="text-xl text-center mb-8">เลือกบริการที่ต้องการตรวจสอบ</h2>
     
     {/* แสดงรายการบริการ */}
     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
       {filteredServices.map(service => (
         <ServiceCard key={service.id} service={service} onAddService={addService} />
       ))}
     </div>
     
     {filteredServices.length === 0 && (
       <div className="text-center text-gray-500 py-8">
         ไม่พบบริการ
       </div>
     )}
   </div>
 );
}

function ServiceCard({ service, onAddService }) {
 return (
   <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
     <div className="p-6 flex flex-col h-full">
       <div className="relative h-48 w-full mb-6 flex-shrink-0">
         <Image 
           src={service.image || `/images/services/${service.id}.png`} 
           alt={service.title}
           fill
           style={{ 
             objectFit: 'contain', 
             objectPosition: 'center'
           }}
           className="transition-transform duration-300 group-hover:scale-110"
         />
       </div>
       
       <div className="flex-grow">
         <h3 className="text-lg font-semibold mb-3 text-gray-800">{service.title}</h3>
         {service.description && (
           <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
         )}
       </div>
       
       <div className="flex items-center justify-between mt-auto">
         <div className="font-medium text-gray-900">{service.price.toLocaleString()} บาท/คน</div>
         <button 
           onClick={() => onAddService(service)}
           className="bg-[#444DDA] text-white px-5 py-2 rounded-full text-sm hover:bg-opacity-90 transition-colors"
         >
           เพิ่ม
         </button>
       </div>
     </div>
   </div>
 );
}