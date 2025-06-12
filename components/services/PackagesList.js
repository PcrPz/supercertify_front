// แก้ไขไฟล์ components/services/PackagesList.js
import { useState, useEffect, useCallback } from 'react'; // เพิ่ม useCallback
import { useCheck } from '@/context/CheckContext';
import { getPackages } from '@/services/apiService';
import useToast from '@/hooks/useToast';

export default function PackagesList() {
  const { checkMode, addService } = useCheck();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  
  // ใช้ useCallback
  const handleAddPackage = useCallback((pkg) => {
    addService(pkg);
    toast.success(`เพิ่มแพ็กเกจ "${pkg.title}" ลงในตะกร้าแล้ว`, {
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  }, [addService, toast]);
  
  useEffect(() => {
    async function loadPackages() {
      try {
        setLoading(true);
        const data = await getPackages();
        
        // แปลงข้อมูล...
        const formattedData = data.map(pkg => ({
          id: pkg._id,
          title: pkg.Package_Title,
          description: pkg.Package_Desc,
          price: pkg.Price,
          category: 'packages',
          services: pkg.services.map(service => ({
            id: service._id || service,
            title: service.Service_Title || ''
          }))
        }));
        
        setPackages(formattedData);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลแพ็คเกจได้');
        console.error(err);
        
        // ย้ายการแสดง toast ที่ error
        toast.error('ไม่สามารถโหลดข้อมูลแพ็คเกจได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    }
    
    loadPackages();
  }, []); // เพิ่ม toast ใน dependencies
  
  // แก้ไขการกรองข้อมูล
  const filteredPackages = packages.filter(pkg => pkg && (typeof pkg === 'object'));

  // Year Package ที่มี QR Code LINE
  const yearPackage = {
    id: 'year-package',
    title: 'Credit-Collect/Year',
    description: 'แพ็คเกจพิเศษรายปี สำหรับองค์กรที่ต้องการการตรวจสอบประวัติพนักงานในราคาพิเศษ',
    category: 'packages',
    isYearPackage: true,
    lineUrl: 'https://lin.ee/ksnDDxo',
    services: []
  };

  // แสดงข้อความโหลดหรือข้อผิดพลาด
  if (loading) return <div className="text-center py-8">กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;

  return (
    <div>
      <h2 className="text-xl text-center mb-8">เลือกแพ็คเกจบริการ</h2>
      
      {/* แสดงแพ็กเกจบริการทั้งหมด */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto mb-12">
        {/* Year Package ที่มีรูป QR Code (แสดงเป็นการ์ดแรก) */}
        <YearPackageCard package={yearPackage} />
        
        {/* แพ็คเกจอื่นๆ จากระบบ */}
        {filteredPackages.map(pkg => (
          <PackageCard 
            key={pkg.id} 
            package={pkg} 
            onAddPackage={handleAddPackage} // เปลี่ยนเป็น handleAddPackage
          />
        ))}
      </div>
      
      {filteredPackages.length === 0 && !yearPackage && (
        <div className="text-center text-gray-500 py-8">
          ไม่พบแพ็คเกจในหมวดหมู่นี้
        </div>
      )}
    </div>
  );
}

// ไม่ต้องแก้ไข YearPackageCard
function YearPackageCard({ package: pkg }) {
  return (
    <div className="bg-white rounded-lg border-2 border-[#444DDA] overflow-hidden shadow-lg relative h-full flex flex-col">
      <div className="absolute top-0 right-0 bg-[#444DDA] text-white font-medium px-3 py-1 text-sm rounded-bl-lg">
        พิเศษ
      </div>
      
      <div className="p-4 border-b border-gray-200 text-center">
        <h2 className="text-lg font-bold mb-2">{pkg.title}</h2>
      </div>
      
      <div className="p-4 flex flex-col items-center flex-grow">
        {pkg.description && (
          <p className="text-gray-600 text-[14px] mb-4 text-center">{pkg.description}</p>
        )}
        
        {/* รูปภาพ QR Code LINE ที่ขยายใหญ่ขึ้น */}
        <div className="my-4 flex justify-center">
          <img 
            src="/QrCodeLine.png" 
            alt="LINE QR Code" 
            className="w-45 h-45 mx-auto rounded-lg border border-gray-200"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f1f1f1'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%23333'%3ELINE QR CODE%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>
        
        <div className="mb-3 text-center">
          <div className="font-medium text-base">LINE</div>
          <div className="text-[14px] text-gray-600 mb-4">ติดต่อเจ้าหน้าที่เพื่อขอรายละเอียดเพิ่มเติม</div>
        </div>
        
        <div className="mt-auto w-full">
          <a 
            href={pkg.lineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-2.5 px-3 rounded-md font-medium transition-colors flex items-center justify-center text-[14px]"
          >
            <span>ติดต่อเข้าบริการ</span>
          </a>
        </div>
      </div>
    </div>
  );
}

// แก้ไข PackageCard เพื่อใช้ onAddPackage
function PackageCard({ package: pkg, onAddPackage }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 text-center">
        <h2 className="text-lg font-medium mb-2">{pkg.title}</h2>
        <div className="text-2xl font-bold mb-1">{pkg.price.toLocaleString()} บาท</div>
        <div className="text-gray-500 text-[14px] mb-2">ต่อคน</div>
        <button
          onClick={() => onAddPackage(pkg)}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors text-[15px]"
        >
          เพิ่ม
        </button>
      </div>
      
      <div className="p-4 flex-grow">
        {pkg.description && (
          <p className="text-gray-600 text-[14px] mb-3">{pkg.description}</p>
        )}
        
        <h3 className="text-[14px] font-medium mb-2">บริการที่รวมอยู่ในแพ็กเกจ:</h3>
        <ul className="space-y-1">
          {pkg.services.map((service, index) => (
            <li key={index} className="flex items-start">
              <svg className="w-4 h-4 text-green-500 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[13px] text-gray-600">{service.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}