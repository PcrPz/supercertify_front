"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCheck } from '@/context/CheckContext';
import { createOrder } from '@/services/apiService';

export default function ApplicantForm() {
  const router = useRouter();
  const { 
    checkMode, 
    cart, 
    getSubtotalPrice,
    getDiscountRate,
    getDiscountAmount,
    getTotalPrice,
    getTotalServiceCount,
    isPackage,
    countPackageServices,
    applicants, 
    addApplicant, 
    updateApplicant, 
    removeApplicant,
    addServiceToApplicant,
    removeServiceFromApplicant,
    getAvailableServicesForApplicant,
    areAllServicesFullyAssigned,
    resetState
  } = useCheck();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountInfo, setDiscountInfo] = useState({
    hasDiscount: false,
    rate: 0,
    amount: 0,
    totalPrice: 0,
    serviceCount: 0
  });
  
  // เพิ่ม state สำหรับเก็บข้อผิดพลาดของอีเมล
  const [emailErrors, setEmailErrors] = useState({});
  
  // อัพเดทข้อมูลส่วนลดเมื่อ cart เปลี่ยนแปลง
  useEffect(() => {
    const serviceCount = getTotalServiceCount();
    const discountRate = getDiscountRate();
    const discountAmount = getDiscountAmount();
    const totalPrice = getTotalPrice();
    
    setDiscountInfo({
      hasDiscount: discountRate > 0,
      rate: discountRate,
      amount: discountAmount,
      totalPrice: totalPrice,
      serviceCount: serviceCount
    });
  }, [cart, getTotalServiceCount, getDiscountRate, getDiscountAmount, getTotalPrice]);
  
  // ฟังก์ชันตรวจสอบรูปแบบอีเมล
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // ฟังก์ชันสำหรับการอัพเดทอีเมล
  const handleEmailChange = (applicantId, email) => {
    updateApplicant(applicantId, 'email', email);
    
    // ถ้าอีเมลว่างหรือถูกต้อง ลบข้อความเตือน
    if (email.trim() === '' || validateEmail(email)) {
      setEmailErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[applicantId];
        return newErrors;
      });
    } else {
      // ถ้าอีเมลไม่ถูกต้อง เพิ่มข้อความเตือน
      setEmailErrors(prev => ({
        ...prev,
        [applicantId]: 'รูปแบบอีเมลไม่ถูกต้อง'
      }));
    }
  };
  
  // ฟังก์ชันตรวจสอบเมื่อกดออกจากช่องอีเมล (blur event)
  const handleEmailBlur = (applicantId, email) => {
    if (email.trim() !== '' && !validateEmail(email)) {
      setEmailErrors(prev => ({
        ...prev,
        [applicantId]: 'รูปแบบอีเมลไม่ถูกต้อง'
      }));
    }
  };
  
  const handleBackToServices = () => {
    router.push('/background-check/select-services');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ตรวจสอบความถูกต้องของอีเมลทุกคน
    let hasEmailError = false;
    const newEmailErrors = {};
    
    applicants.forEach(applicant => {
      if (applicant.email.trim() !== '' && !validateEmail(applicant.email)) {
        newEmailErrors[applicant.id] = 'รูปแบบอีเมลไม่ถูกต้อง';
        hasEmailError = true;
      }
    });
    
    // อัพเดท state เก็บข้อความเตือน
    setEmailErrors(newEmailErrors);
    
    // ถ้ามีความผิดพลาดของอีเมล ยกเลิกการส่งฟอร์ม
    if (hasEmailError) {
      alert('กรุณาตรวจสอบรูปแบบอีเมลให้ถูกต้อง');
      return;
    }
    
    // ตรวจสอบว่ากรอกข้อมูลครบทุกช่องที่จำเป็น
    const isValid = applicants.every(applicant => 
      applicant.name.trim() !== '' && 
      applicant.email.trim() !== '' && 
      (checkMode !== 'company' || applicant.company.trim() !== '')
    );
    
    if (!isValid) {
      alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    
    // ตรวจสอบว่าผู้สมัครทุกคนมีอย่างน้อย 1 บริการ
    const allApplicantsHaveServices = applicants.every(applicant => 
      applicant.services.length > 0
    );
    
    if (!allApplicantsHaveServices) {
      alert('กรุณากำหนดบริการให้ผู้สมัครทุกคนอย่างน้อย 1 บริการ');
      return;
    }
    
    if (!areAllServicesFullyAssigned()) {
      alert('กรุณากำหนดบริการให้ผู้สมัครให้ครบทุกรายการ');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // สร้างรายการบริการตามรูปแบบที่กำหนด
      const services = cart.map(item => ({
        service: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      }));
    
      // Object เก็บ mapping ระหว่าง package ID และ service IDs ย่อย
      const packageToServicesMap = {};
      
      // วนลูปเพื่อสร้าง mapping
      cart.forEach(item => {
        if (isPackage(item)) {
          // ถ้าเป็น Package ให้แตกออกเป็น Service ย่อยๆ
          let subServices = [];
          
          // ตรวจสอบและดึงบริการย่อยจากโครงสร้างข้อมูลที่เป็นไปได้
          if (item.subServices && Array.isArray(item.subServices)) {
            subServices = item.subServices.map(s => s.id || `${item.id}_sub_${subServices.length}`);
          } else if (item.packageItems && Array.isArray(item.packageItems)) {
            subServices = item.packageItems.map(s => s.id || `${item.id}_sub_${subServices.length}`);
          } else if (item.services && Array.isArray(item.services)) {
            subServices = item.services.map(s => s.id || `${item.id}_sub_${subServices.length}`);
          } else {
            // ถ้าไม่มีข้อมูลบริการย่อยที่ชัดเจน ให้สร้างข้อมูลจำลองขึ้นมา
            const serviceCount = countPackageServices(item);
            subServices = Array.from({ length: serviceCount }, (_, i) => `${item.id}_sub_${i + 1}`);
          }
          
          // เก็บ mapping
          packageToServicesMap[item.id] = subServices;
        } else {
          // ถ้าเป็นบริการเดี่ยว เก็บเป็น array ที่มีแค่ตัวเอง
          packageToServicesMap[item.id] = [item.id];
        }
      });
      
      // สร้างรายการผู้สมัครตามรูปแบบที่กำหนด พร้อมแตก Package
      const candidates = applicants.map(app => {
        // แตก Package เป็น Service ย่อยๆ
        const flattenedServices = [];
        
        app.services.forEach(serviceId => {
          // ตรวจสอบว่ามี mapping หรือไม่
          const serviceIds = packageToServicesMap[serviceId];
          if (serviceIds) {
            // เพิ่ม service IDs ที่แตกออกมาแล้ว
            flattenedServices.push(...serviceIds);
          } else {
            // ถ้าไม่มี mapping ใช้ ID เดิม
            flattenedServices.push(serviceId);
          }
        });
        
        return {
          C_FullName: app.name,
          C_Email: app.email,
          C_Company_Name: app.company || "",
          services: flattenedServices  // Service IDs ที่แตกออกมาแล้ว
        };
      });
      
      // สร้างข้อมูล Order ตามรูปแบบที่กำหนด
      const orderData = {
        OrderType: checkMode,
        services: services,
        subtotalPrice: getSubtotalPrice(), // ราคาก่อนหักส่วนลด
        totalPrice: getTotalPrice(),       // ราคาสุทธิหลังหักส่วนลด
        candidates: candidates             // รายการผู้สมัครพร้อมบริการที่แตกออกแล้ว
      };
      
      console.log("Sending order with flattened package services:", orderData);
      
      const result = await createOrder(orderData);
      
      if (result.success) {
        // เรียกใช้ resetState เพื่อล้างข้อมูลทั้งหมดก่อนนำทางไปยังหน้ายืนยันคำสั่งซื้อ
        resetState();
        router.push(`/background-check/order-confirmation/${result.orderId}`);
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
    <div className="container max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-6">แบบฟอร์มข้อมูลผู้สมัคร</h1>
      
      <div className="max-w-xl mx-auto relative bg-white rounded-full p-1.5 flex mb-8 border-2 border-black shadow-lg">
        <div 
          className={`relative z-10 flex-1 py-3 rounded-full text-center transition-colors duration-300 ${
            checkMode === 'company' 
              ? 'bg-[#444DDA] text-white' 
              : 'text-gray-400'
          }`}
        >
          บริษัท
        </div>
        <div 
          className={`relative z-10 flex-1 py-3 rounded-full text-center transition-colors duration-300 ${
            checkMode === 'personal' 
              ? 'bg-[#444DDA] text-white' 
              : 'text-gray-400'
          }`}
        >
          บุคคลธรรมดา
        </div>
      </div>
      
      <p className="text-center text-gray-600 text-sm mb-8">
        เราจะส่งแบบฟอร์มยินยอมนี้ถึงผู้สมัครของคุณเพื่อให้พวกเขาสามารถกรอกแบบฟอร์มยินยอมได้อย่างง่ายดาย
        เราขอแนะนำให้คุณให้ข้อมูลสมัครครบถ้วนเพื่อความสะดวกรวดเร็วจาก SuperCertify
      </p>
      
      <div className="border-2 border-black rounded-3xl shadow-xl">
        <form onSubmit={handleSubmit}>
          {applicants.map((applicant, index) => (
            <div key={applicant.id}>
              {index > 0 && (
                <div className="border-t-2 border-gray-300"></div>
              )}
              
              <div className="p-8 relative">
                {(checkMode === 'company' && applicants.length > 1) && (
                  <button 
                    type="button"
                    onClick={() => removeApplicant(applicant.id)}
                    className="absolute top-6 right-6 bg-red-100 text-red-600 rounded-full w-10 h-10 flex items-center justify-center hover:bg-red-200 transition-colors shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
                
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-gray-700 bg-gray-100 inline-block px-3 py-1 rounded-full">
                    {checkMode === 'company' 
                      ? `ผู้สมัครหมายเลข ${index + 1}` 
                      : 'ข้อมูลส่วนตัว'}
                  </h3>
                </div>
                
                <input
                  type="text"
                  placeholder="ชื่อเต็ม"
                  value={applicant.name}
                  onChange={(e) => updateApplicant(applicant.id, 'name', e.target.value)}
                  className="w-full px-5 py-4 border border-gray-300 rounded-2xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                
                {checkMode === 'company' && (
                  <input
                    type="text"
                    placeholder="ชื่อบริษัท"
                    value={applicant.company}
                    onChange={(e) => updateApplicant(applicant.id, 'company', e.target.value)}
                    className="w-full px-5 py-4 border border-gray-300 rounded-2xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                )}
                
                <div className="mb-4">
                  <input
                    type="email"
                    placeholder="อีเมล"
                    value={applicant.email}
                    onChange={(e) => handleEmailChange(applicant.id, e.target.value)}
                    onBlur={(e) => handleEmailBlur(applicant.id, e.target.value)}
                    className={`w-full px-5 py-4 border ${emailErrors[applicant.id] ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-2xl focus:outline-none focus:ring-2 ${emailErrors[applicant.id] ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                    required
                  />
                  {emailErrors[applicant.id] && (
                    <p className="text-red-500 text-sm mt-1 ml-2">{emailErrors[applicant.id]}</p>
                  )}
                </div>
                
                {/* Services section */}
                <div className="mt-6">
                  {applicant.services.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-3">บริการที่เลือกแล้ว:</h4>
                      <div className="space-y-3">
                        {applicant.services.map(serviceId => {
                          const service = cart.find(item => item.id === serviceId);
                          if (!service) return null;
                          
                          // หาจำนวนครั้งที่บริการนี้ถูกใช้โดยทุกผู้สมัคร
                          const allAssignedCount = applicants.reduce((count, app) => {
                            return count + app.services.filter(id => id === service.id).length;
                          }, 0);
                          
                          return (
                            <div key={serviceId} className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-200">
                              <div>
                                <span className="font-medium">{service.title}</span>
                                {isPackage(service) && (
                                  <span className="ml-2 text-sm text-blue-600 font-medium">
                                    ({countPackageServices(service)} บริการ)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-600">
                                  {allAssignedCount}/{service.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeServiceFromApplicant(applicant.id, serviceId)}
                                  className="ml-3 bg-red-100 hover:bg-red-200 text-red-600 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      เพิ่มบริการ
                    </h4>
                    <div className="space-y-3">
                      {getAvailableServicesForApplicant(applicant.id).map(service => {
                        // หาจำนวนครั้งที่บริการนี้ถูกใช้โดยทุกผู้สมัคร
                        const allAssignedCount = applicants.reduce((count, app) => {
                          return count + app.services.filter(id => id === service.id).length;
                        }, 0);
                        
                        return (
                          <div 
                            key={service.id}
                            onClick={() => addServiceToApplicant(applicant.id, service.id)}
                            className="flex justify-between items-center p-4 rounded-xl cursor-pointer transition-all bg-gray-50 border border-gray-200 hover:bg-gray-100"
                          >
                            <div>
                              <h5 className="font-medium">{service.title}</h5>
                              {isPackage(service) && (
                                <span className="text-xs text-blue-600 font-medium">
                                  แพ็คเกจ {countPackageServices(service)} บริการ
                                </span>
                              )}
                            </div>
                            <span className="text-sm px-3 py-1 rounded-full font-medium bg-blue-50 text-blue-600">
                              {allAssignedCount}/{service.quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </form>
        
        {checkMode === 'company' && (
          <div className="p-8 border-t-2 border-gray-300">
            <button 
              type="button"
              onClick={addApplicant}
              className="w-full bg-yellow-500 text-white py-4 rounded-2xl font-medium hover:bg-yellow-600 transition-colors shadow-md"
            >
              + เพิ่มผู้สมัคร
            </button>
          </div>
        )}
        
        {checkMode === 'personal' && (
          <div className="p-8 text-center text-gray-500 italic">
            โหมดส่วนตัวสามารถกรอกข้อมูลได้เพียง 1 คนเท่านั้น
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-3xl border-2 border-black shadow-xl mt-8">
        <div className="px-8 py-6 border-b-2 border-gray-300">
          <h3 className="font-medium">สรุปรายการ</h3>
        </div>
        
        <div>
          {cart.map((item, index) => (
            <div key={index} className="px-8 py-6 border-b border-gray-300 last:border-b-0 flex justify-between items-center">
              <div>
                <h4 className="font-medium">{item.title}</h4>
                <div className="text-gray-600 text-sm">
                  {item.price.toLocaleString()} บาท x {item.quantity} คน
                  {isPackage(item) && (
                    <span className="ml-2 text-blue-600 font-medium">
                      (แพ็คเกจ {countPackageServices(item)} บริการ)
                    </span>
                  )}
                </div>
              </div>
              
              <div className="font-medium">
                {(item.price * item.quantity).toLocaleString()} บาท
              </div>
            </div>
          ))}
          
          {/* แสดงจำนวนบริการทั้งหมด */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div>จำนวนบริการทั้งหมด (รวมบริการย่อยในแพ็คเกจ):</div>
              <div className="font-medium">{discountInfo.serviceCount} บริการ</div>
            </div>
          </div>
          <div className="px-8 py-6 flex justify-between items-center border-b border-gray-200">
            <div className="font-medium">ราคารวม:</div>
            <div className="font-bold text-lg">{getSubtotalPrice().toLocaleString()} บาท</div>
          </div>
          
          {/* ส่วนแสดงโปรโมชั่นและราคาสุทธิ */}
          {discountInfo.hasDiscount && (
            <div>
              <div className="px-8 py-4 bg-green-50 border-t border-green-100">
                <div className="flex justify-between items-center">
                  <div className="font-medium text-green-700">
                    ส่วนลด {discountInfo.rate === 0.10 ? '10%' : '5%'}: ({discountInfo.serviceCount} บริการ {discountInfo.rate === 0.10 ? '≥ 5 บริการ' : '≥ 3 บริการ'})
                  </div>
                  <div className="font-bold text-green-700">
                    -{discountInfo.amount.toLocaleString()} บาท
                  </div>
                </div>
              </div>
              <div className="px-8 py-4 flex justify-between items-center border-t border-gray-200">
                <div className="font-medium text-lg">ราคาสุทธิ:</div>
                <div className="font-bold text-lg text-green-700">
                  {discountInfo.totalPrice.toLocaleString()} บาท
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between mt-8">
        <button 
          type="button"
          onClick={handleBackToServices}
          className="border-2 border-blue-600 text-blue-600 px-10 py-4 rounded-2xl font-medium hover:bg-blue-50 transition-colors"
          disabled={isSubmitting}
        >
          กลับไปเลือกบริการ
        </button>
        
        <button 
          type="submit"
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-medium hover:bg-blue-700 transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่ง'}
        </button>
      </div>
    </div>
  );
}