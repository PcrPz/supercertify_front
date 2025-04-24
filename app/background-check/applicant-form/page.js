'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCheck } from '@/context/CheckContext';
import { createOrder } from '@/services/apiService';

export default function ApplicantForm() {
  const router = useRouter();
  const { 
    checkMode, 
    cart, 
    getTotalPrice, 
    applicants, 
    addApplicant, 
    updateApplicant, 
    removeApplicant,
    addServiceToApplicant,
    removeServiceFromApplicant,
    getAvailableServicesForApplicant,
    areAllServicesFullyAssigned
  } = useCheck();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ฟังก์ชันกลับไปยังหน้าเลือกบริการ
  const handleBackToServices = () => {
    router.push('/background-check/services');
  };

  // ฟังก์ชันส่งข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบข้อมูลว่าครบถ้วนหรือไม่
    const isValid = applicants.every(applicant => 
      applicant.name.trim() !== '' && 
      applicant.email.trim() !== '' && 
      (checkMode !== 'company' || applicant.company.trim() !== '')
    );
    
    if (!isValid) {
      alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    
    // ตรวจสอบว่าทุกบริการถูกกำหนดให้ผู้สมัครครบหรือไม่
    if (!areAllServicesFullyAssigned()) {
      alert('กรุณากำหนดบริการให้ผู้สมัครให้ครบทุกรายการ');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // สร้างข้อมูลสำหรับส่งไป API
      const orderData = {
        mode: checkMode,
        services: cart.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price
        })),
        totalPrice: getTotalPrice(),
        applicants: applicants.map(app => {
          // หาบริการที่กำหนดให้ผู้สมัครคนนี้
          const applicantServices = app.services.map(serviceId => {
            const service = cart.find(item => item.id === serviceId);
            return {
              id: serviceId,
              title: service?.title || '',
              price: service?.price || 0
            };
          });
          
          return {
            name: app.name,
            email: app.email,
            company: app.company || null,
            services: applicantServices
          };
        })
      };
      
      // ส่งข้อมูลไป API
      const result = await createOrder(orderData);
      
      if (result.success) {
        alert('ส่งข้อมูลเรียบร้อยแล้ว! ขอบคุณสำหรับการใช้บริการ');
        // router.push(`/background-check/thank-you?orderId=${result.orderId}`);
      } else {
        throw new Error(result.message || 'การสั่งซื้อล้มเหลว');
      }
      
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(`เกิดข้อผิดพลาดในการส่งข้อมูล: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-medium text-center mb-8">แบบฟอร์มข้อมูลผู้สมัคร</h1>
      
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-full p-1.5 flex">
          <div className={`py-2 px-6 rounded-full text-center bg-indigo-600 text-white`}>
            ผู้สมัคร
          </div>
          <div className={`py-2 px-6 rounded-full text-center text-gray-600`}>
            ส่วนตัว
          </div>
        </div>
      </div>
      
      <p className="text-center text-gray-600 max-w-3xl mx-auto mb-12">
        เราจะส่งแบบฟอร์มยินยอมนี้ถึงผู้สมัครของคุณเพื่อให้พวกเขาสามารถกรอกแบบฟอร์มยินยอมได้อย่างง่ายดาย
        เราขอแนะนำให้คุณให้ข้อมูลสมัครครบถ้วนเพื่อความสะดวกรวดเร็วจาก SuperCertify
      </p>
      
      <form onSubmit={handleSubmit}>
        {applicants.map((applicant, index) => (
          <div key={applicant.id} className="max-w-3xl mx-auto bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium">
                {checkMode === 'company' 
                  ? `ผู้สมัครหมายเลข ${index + 1}` 
                  : 'ข้อมูลส่วนตัว'}
              </h3>
              {/* แสดงปุ่มลบเฉพาะในโหมด company หรือถ้าเป็น personal แต่มีผู้สมัครมากกว่า 1 คน */}
              {(checkMode === 'company' && applicants.length > 1) && (
                <button 
                  type="button"
                  onClick={() => removeApplicant(applicant.id)}
                  className="text-red-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor={`name-${applicant.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อเต็ม
                </label>
                <input
                  id={`name-${applicant.id}`}
                  type="text"
                  value={applicant.name}
                  onChange={(e) => updateApplicant(applicant.id, 'name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              {checkMode === 'company' && (
                <div>
                  <label htmlFor={`company-${applicant.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อบริษัท
                  </label>
                  <input
                    id={`company-${applicant.id}`}
                    type="text"
                    value={applicant.company}
                    onChange={(e) => updateApplicant(applicant.id, 'company', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              )}
              
              <div>
                <label htmlFor={`email-${applicant.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                  อีเมล
                </label>
                <input
                  id={`email-${applicant.id}`}
                  type="email"
                  value={applicant.email}
                  onChange={(e) => updateApplicant(applicant.id, 'email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              {/* ส่วนการกำหนดบริการ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  บริการที่ต้องการตรวจสอบ
                </label>
                
                {/* แสดงบริการที่เลือกไว้แล้ว */}
                {applicant.services.length > 0 ? (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">บริการที่เลือกแล้ว:</h4>
                    <div className="space-y-2">
                      {applicant.services.map(serviceId => {
                        const service = cart.find(item => item.id === serviceId);
                        return service ? (
                          <div key={serviceId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span>{service.title}</span>
                            <button
                              type="button"
                              onClick={() => removeServiceFromApplicant(applicant.id, serviceId)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">ยังไม่ได้เลือกบริการ</p>
                )}
                
                {/* เลือกบริการเพิ่ม */}
                <div>
                  <h4 className="text-sm font-medium mb-2">เพิ่มบริการ:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getAvailableServicesForApplicant(applicant.id).map(service => (
                      <div 
                        key={service.id}
                        className="bg-white border border-gray-200 rounded p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => addServiceToApplicant(applicant.id, service.id)}
                      >
                        <h5 className="font-medium text-sm">{service.title}</h5>
                        <p className="text-xs text-gray-500">
                          {service.price.toLocaleString()} บาท
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  {getAvailableServicesForApplicant(applicant.id).length === 0 && (
                    <p className="text-sm text-gray-500">
                      ไม่มีบริการที่สามารถเพิ่มเติมได้
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* ปุ่มเพิ่มผู้สมัคร - แสดงเฉพาะในโหมด company */}
        {checkMode === 'company' && (
          <div className="max-w-3xl mx-auto mb-12">
            <button 
              type="button"
              onClick={addApplicant}
              className="w-full bg-yellow-400 text-gray-900 py-3 rounded-md font-medium flex items-center justify-center hover:bg-yellow-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              เพิ่มผู้สมัคร
            </button>
          </div>
        )}
        
        {/* แสดงคำแนะนำสำหรับโหมด personal */}
        {checkMode === 'personal' && (
          <div className="max-w-3xl mx-auto mb-12 text-center text-gray-500 italic">
            โหมดส่วนตัวสามารถกรอกข้อมูลได้เพียง 1 คนเท่านั้น
          </div>
        )}
        
        {/* สรุปรายการและราคา */}
        <div className="max-w-3xl mx-auto bg-white rounded-lg border border-gray-200 overflow-hidden mb-12">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium">สรุปรายการ</h3>
          </div>
          
          <div>
            {cart.map((item, index) => (
              <div key={index} className="px-6 py-4 border-b border-gray-200 last:border-b-0 flex justify-between">
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <div className="text-gray-600 text-sm">{item.price.toLocaleString()} บาท x {item.quantity} คน</div>
                </div>
                
                <div className="font-medium">
                  {(item.price * item.quantity).toLocaleString()} บาท
                </div>
              </div>
            ))}
            
            <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
              <div className="font-medium">ราคารวมทั้งหมด:</div>
              <div className="font-bold text-lg">{getTotalPrice().toLocaleString()} บาท</div>
            </div>
          </div>
        </div>
        
        {/* ปุ่มดำเนินการต่อและกลับ */}
        <div className="max-w-3xl mx-auto flex justify-between">
          <button 
            type="button"
            onClick={handleBackToServices}
            className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-md font-medium hover:bg-indigo-50 transition-colors"
            disabled={isSubmitting}
          >
            กลับไปเลือกบริการ
          </button>
          
          <button 
            type="submit"
            className="bg-indigo-600 text-white px-8 py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่ง'}
          </button>
        </div>
      </form>
    </div>
  );
}