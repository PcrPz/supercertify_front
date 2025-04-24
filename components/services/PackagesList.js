'use client';

import { useState, useEffect } from 'react';
import { useCheck } from '@/context/CheckContext';
import { getPackages } from '@/services/apiService';

export default function PackagesList() {
  const { checkMode, addService } = useCheck();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function loadPackages() {
      try {
        setLoading(true);
        const data = await getPackages();
        setPackages(data);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลแพ็คเกจได้');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    loadPackages();
  }, []);
  
  // แก้ไขการกรองข้อมูล
  const filteredPackages = packages.filter(pkg => pkg && (typeof pkg === 'object'));

  // แสดงข้อความโหลดหรือข้อผิดพลาด
  if (loading) return <div className="text-center py-8">กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div>
      <h2 className="text-xl text-center mb-8">เลือกแพ็คเกจบริการ</h2>
      
      {/* แสดงแพ็กเกจบริการ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
        {filteredPackages.map(pkg => (
          <PackageCard key={pkg.id} package={pkg} onAddPackage={addService} />
        ))}
      </div>
      
      {filteredPackages.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          ไม่พบแพ็คเกจในหมวดหมู่นี้
        </div>
      )}
    </div>
  );
}

// Component แสดงการ์ดแพ็คเกจ
function PackageCard({ package: pkg, onAddPackage }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-lg">
      <div className="p-6 border-b border-gray-200 text-center">
        <h2 className="text-xl font-medium mb-2">{pkg.title}</h2>
        <div className="text-3xl font-bold mb-1">{pkg.price.toLocaleString()} บาท</div>
        <div className="text-gray-500 text-sm mb-4">ต่อคน</div>
        <button
          onClick={() => onAddPackage(pkg)}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          เพิ่ม
        </button>
      </div>
      
      <div className="p-6">
        {pkg.description && (
          <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
        )}
        
        <h3 className="text-sm font-medium mb-4">บริการที่รวมอยู่ในแพ็กเกจ:</h3>
        <ul className="space-y-2">
          {pkg.services.map((service, index) => (
            <li key={index} className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gray-600">{service.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}