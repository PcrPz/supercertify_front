import Image from 'next/image';
import Link from 'next/link';

const ThreeSteps = () => {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center text-2xl font-semibold text-gray-800 mb-4">
        วิธีการใช้บริการการตรวจสอบประวัติของเรา
        </h2>
        
        <h1 className="text-center text-4xl md:text-[35px] font-bold text-gray-900 mb-12">
         เพียงสามขั้นตอนในการตรวจสอบประวัติ
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-48 h-48 mb-8 relative">
              <Image 
                src="/1.png" 
                alt="Select background check" 
                width={200} 
                height={200}
                className="object-contain"
              />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">1</h2>
            <p className="font-bold text-[19px]">
            เลือกบริการตรวจสอบประเภทที่ท่านต้องการ<br />
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-48 h-48 mb-8 relative">
              <Image 
                src="/2.png" 
                alt="Enter information" 
                width={200} 
                height={200}
                className="object-contain"
              />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">2</h2>
            <p className="font-bold text-[19px]">
             ใส่ชื่อและนามสกุลพร้อมอีเมลของบุคคล<br />
             ที่ท่านต้องการตรวจสอบหรือตัวท่านเอง<br />
             และส่งแบบตรวจสอบ
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="w-48 h-48 mb-8 relative ">
              <Image 
                src="/3.png" 
                alt="Import information" 
                width={200} 
                height={200}
                className="object-contain"
              />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">3</h2>
            <p className="font-bold text-[19px]">
            แนบเอกสารที่ต้องใช้ในประเภท <br/>
            การตรวจสอบที่ท่านเลือก
            </p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Link 
             href="/background-check" 
             className="inline-block mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105"
           >
             เริ่มต้นการใช้งาน
           </Link>
        </div>
      </div>
    </section>
  );
};

export default ThreeSteps;