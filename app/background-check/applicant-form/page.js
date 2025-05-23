'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCheck } from '@/context/CheckContext';
import { createOrder, checkCoupon, getUserCoupons} from '@/services/apiService';

export default function ApplicantForm() {
  const router = useRouter();
  const { 
    checkMode, 
    cart, 
    getSubtotalPrice,
    getDiscountRate,
    getDiscountAmount,
    getTotalPrice,
    getAfterPromotionPrice, // ✅ เพิ่มฟังก์ชันใหม่
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
    resetState,
    // เพิ่มฟังก์ชันคูปอง
    checkCouponCode,
    applyCoupon: applyCouponToContext,
    removeCoupon: removeCouponFromContext
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

  // เพิ่ม state สำหรับระบบคูปอง
  const [couponCode, setCouponCode] = useState('');
  const [couponInfo, setCouponInfo] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  
  // เพิ่ม state สำหรับรายการคูปองของผู้ใช้
  const [userCoupons, setUserCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponList, setShowCouponList] = useState(false);
  
  // โหลดคูปองของผู้ใช้เมื่อ component mount
  useEffect(() => {
    loadUserCoupons();
  }, []);
  
  // ฟังก์ชันโหลดคูปองของผู้ใช้
  const loadUserCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const result = await getUserCoupons(false);
      
      if (result.success) {
        setUserCoupons(result.coupons || []);
      } else {
        console.error('Error loading user coupons:', result.message);
        setUserCoupons([]);
      }
    } catch (error) {
      console.error('Error loading user coupons:', error);
      setUserCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };
  
// แก้ไข useEffect สำหรับคำนวณราคา
useEffect(() => {
  const serviceCount = getTotalServiceCount();
  const discountRate = getDiscountRate();
  const promotionDiscountAmount = getDiscountAmount();
  
  // คำนวณราคาสุทธิโดยใช้ logic ที่ถูกต้อง
  const subtotal = getSubtotalPrice();
  const afterPromotionPrice = subtotal - promotionDiscountAmount;
  const couponDiscountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPrice = afterPromotionPrice - couponDiscountAmount;
  
  setDiscountInfo({
    hasDiscount: discountRate > 0 || couponDiscountAmount > 0,
    rate: discountRate,
    amount: promotionDiscountAmount,
    couponDiscount: couponDiscountAmount,
    totalPrice: finalPrice, // ✅ ใช้ราคาที่คำนวณใหม่
    serviceCount: serviceCount
  });
}, [cart, appliedCoupon, getTotalServiceCount, getDiscountRate, getDiscountAmount, getSubtotalPrice]);

  
  // ฟังก์ชันตรวจสอบรูปแบบอีเมล
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // ฟังก์ชันจัดการการเปลี่ยนแปลงอีเมล
  const handleEmailChange = (applicantId, value) => {
    updateApplicant(applicantId, 'email', value);
    
    // ลบข้อความเตือนถ้ามีการแก้ไขอีเมล
    if (emailErrors[applicantId]) {
      setEmailErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[applicantId];
        return newErrors;
      });
    }
  };
  
  // ฟังก์ชันตรวจสอบอีเมลเมื่อออกจาก input
  const handleEmailBlur = (applicantId, value) => {
    // ถ้าอีเมลไม่ถูกต้องตามรูปแบบและไม่ว่างเปล่า
    if (value.trim() !== '' && !validateEmail(value)) {
      setEmailErrors(prev => ({
        ...prev,
        [applicantId]: 'รูปแบบอีเมลไม่ถูกต้อง'
      }));
    }
  };

  // ฟังก์ชันตรวจสอบคูปอง
const handleCheckCoupon = async () => {
  if (!couponCode.trim()) {
    setCouponError('กรุณากรอกรหัสคูปอง');
    return;
  }
  
  try {
    setCheckingCoupon(true);
    setCouponError('');
    
    // คำนวณราคาและแสดง debug info
    const subtotal = getSubtotalPrice();
    const promotionDiscount = getDiscountAmount();
    const afterPromotionPrice = subtotal - promotionDiscount;
    
    console.log('🔍 Coupon Check Debug Info:', {
      couponCode: couponCode.trim(),
      subtotal,
      promotionDiscount, 
      afterPromotionPrice
    });
    
    // ตรวจสอบค่าที่ส่งไป
    if (subtotal <= 0) {
      throw new Error('ไม่สามารถใช้คูปองได้เนื่องจากไม่มีสินค้าในตะกร้า');
    }
    
    if (afterPromotionPrice <= 0) {
      throw new Error('ไม่สามารถใช้คูปองได้เนื่องจากยอดรวมหลังหักส่วนลดน้อยกว่าหรือเท่ากับ 0');
    }
    
    // เรียกใช้ API จาก apiService โดยตรง
    const response = await checkCoupon(couponCode.trim(), subtotal, promotionDiscount);
    
    console.log('✅ Coupon Check Response:', response);
    
    if (!response.success) {
      throw new Error(response.message || 'คูปองไม่ถูกต้องหรือไม่สามารถใช้งานได้');
    }
    
    // ตรวจสอบว่า response มีข้อมูลครบถ้วน
    if (!response.coupon || typeof response.discountAmount !== 'number') {
      throw new Error('ข้อมูลคูปองไม่ครบถ้วน');
    }
    
    // ถ้าสำเร็จ บันทึกข้อมูลคูปอง
    setCouponInfo(response);
    setCouponError('');
    
    console.log('💾 Coupon Info Saved:', response);
    
  } catch (error) {
    console.error('❌ Error checking coupon:', error);
    
    // จัดการข้อความ error ให้เฉพาะเจาะจง
    let errorMessage = 'คูปองไม่ถูกต้องหรือไม่สามารถใช้งานได้';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // เพิ่มข้อความแนะนำสำหรับ error ที่พบบ่อย
    if (errorMessage.includes('ถูกใช้ไปแล้ว')) {
      errorMessage += ' - คูปองนี้อาจถูกใช้ในคำสั่งซื้ออื่นแล้ว';
    } else if (errorMessage.includes('หมดอายุ')) {
      errorMessage += ' - กรุณาตรวจสอบวันหมดอายุของคูปอง';
    } else if (errorMessage.includes('ไม่พบ')) {
      errorMessage += ' - กรุณาตรวจสอบรหัสคูปองให้ถูกต้อง';
    }
    
    setCouponError(errorMessage);
    setCouponInfo(null);
  } finally {
    setCheckingCoupon(false);
  }
};

 // แก้ไขฟังก์ชัน handleUseCouponFromList ด้วย
const handleUseCouponFromList = async (coupon) => {
  try {
    setCheckingCoupon(true);
    setCouponError('');
    
    // ตรวจสอบสถานะคูปองก่อน
    if (!coupon || !coupon.code) {
      throw new Error('ข้อมูลคูปองไม่ถูกต้อง');
    }
    
    const subtotal = getSubtotalPrice();
    const promotionDiscount = getDiscountAmount();
    const afterPromotionPrice = subtotal - promotionDiscount;
    
    console.log('🔍 Using Coupon from List:', {
      couponCode: coupon.code,
      couponId: coupon._id,
      subtotal,
      promotionDiscount,
      afterPromotionPrice
    });
    
    // ตรวจสอบค่าพื้นฐาน
    if (subtotal <= 0) {
      throw new Error('ไม่สามารถใช้คูปองได้เนื่องจากไม่มีสินค้าในตะกร้า');
    }
    
    if (afterPromotionPrice <= 0) {
      throw new Error('ไม่สามารถใช้คูปองได้เนื่องจากยอดรวมหลังหักส่วนลดน้อยกว่าหรือเท่ากับ 0');
    }
    
    const response = await checkCoupon(coupon.code, subtotal, promotionDiscount);
    
    if (!response.success) {
      throw new Error(response.message || 'คูปองไม่สามารถใช้งานได้');
    }
    
    console.log('✅ Coupon from List Response:', response);
    
    // ใช้คูปองทันที
    applyCouponToContext(response);
    setAppliedCoupon(response);
    setShowCouponList(false);
    
    console.log('💾 Applied Coupon from List:', response);
    
  } catch (error) {
    console.error('❌ Error using coupon from list:', error);
    
    let errorMessage = 'คูปองไม่สามารถใช้งานได้';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setCouponError(errorMessage);
  } finally {
    setCheckingCoupon(false);
  }
};
  // ฟังก์ชันใช้คูปอง
  const applyCoupon = () => {
    if (!couponInfo) return;
    
    // ใช้คูปองใน context
    applyCouponToContext(couponInfo);
    setAppliedCoupon(couponInfo);
    setCouponCode('');
    setCouponInfo(null);
  };

  // ฟังก์ชันยกเลิกการใช้คูปอง
  const removeCoupon = () => {
    // ยกเลิกคูปองใน context
    removeCouponFromContext();
    setAppliedCoupon(null);
  };
  
  // ฟังก์ชันกลับไปหน้าเลือกบริการ
  const handleBackToServices = () => {
    router.push('/background-check/select-services');
  };

  // ปรับปรุงฟังก์ชัน handleSubmit เพื่อรวมข้อมูลคูปอง
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
      subtotalPrice: getSubtotalPrice(),
      promotionDiscount: getDiscountAmount(),
      totalPrice: discountInfo.totalPrice,
      candidates: candidates,
    };

    // ✅ เพิ่ม Debug Info ก่อนเพิ่มคูปอง
    console.log("🔍 Order data before adding coupon:", {
      appliedCoupon: appliedCoupon,
      hasCoupon: !!appliedCoupon,
      couponCode: appliedCoupon ? appliedCoupon.coupon.code : 'None'
    });

    // เพิ่มข้อมูลคูปองถ้ามีการใช้คูปอง
    if (appliedCoupon) {
      orderData.couponCode = appliedCoupon.coupon.code;
      console.log("🎫 Adding coupon to order:", {
        couponCode: appliedCoupon.coupon.code,
        couponId: appliedCoupon.coupon._id,
        discountAmount: appliedCoupon.discountAmount
      });
    } else {
      console.log("⚠️ No coupon applied");
    }

    // ✅ เพิ่ม Complete Debug Info
    console.log("📤 Complete order data being sent:", JSON.stringify(orderData, null, 2));

    // ✅ เพิ่ม Pricing Debug
    console.log("💰 Pricing breakdown:", {
      subtotal: getSubtotalPrice(),
      promotionDiscount: getDiscountAmount(),
      couponDiscount: appliedCoupon ? appliedCoupon.discountAmount : 0,
      finalTotal: discountInfo.totalPrice
    });

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
      {/* ส่วนหัวและฟอร์มข้อมูลผู้สมัคร - คงเดิม */}
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
                
                {/* Services section - คงเดิม */}
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
      
      {/* ส่วนสรุปรายการ - คงเดิม แต่ปรับส่วนคูปอง */}
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
              {discountInfo.amount > 0 && (
                <div className="px-8 py-4 bg-green-50 border-t border-green-100">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-lg text-green-700">
                      ส่วนลด {discountInfo.rate === 0.10 ? '10%' : '5%'}: ({discountInfo.serviceCount} บริการ {discountInfo.rate === 0.10 ? '≥ 5 บริการ' : '≥ 3 บริการ'})
                    </div>
                    <div className="font-bold  text-lg text-green-700">
                      -{discountInfo.amount.toLocaleString()} บาท
                    </div>
                  </div>
                </div>
              )}
              {/* เพิ่มส่วนแสดงส่วนลดจากคูปอง */}
              {appliedCoupon && (
                <div className="px-8 py-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-lg text-gray-700">
                      ส่วนลดคูปอง ({appliedCoupon.coupon.code})
                    </div>
                    <div className="font-bold text-lg text-green-600">
                      -{appliedCoupon.discountAmount.toLocaleString()} บาท
                    </div>
                  </div>
                </div>
              )}
              
              <div className="px-8 py-4 flex justify-between items-center border-t border-gray-200">
                <div className="font-medium text-lg">ราคาสุทธิ:</div>
                <div className="font-bold text-lg text-green-700">
                  {discountInfo.totalPrice.toLocaleString()} บาท
                </div>
              </div>
            </div>
          )}
          
         {/* ส่วนของการใส่คูปอง - ออกแบบใหม่ */}
          <div className="px-8 py-6 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-gradient-to-r from-[#444DDA] to-[#5B63E8] w-8 h-8 rounded-full flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h4 className="font-semibold text-lg text-gray-800">คูปองส่วนลด</h4>
            </div>
            
            {!appliedCoupon ? (
              <div className="space-y-6">
                {/* แสดงคูปองที่มีอยู่ */}
                {userCoupons.length > 0 && (
                  <div className="bg-gradient-to-r from-[#444DDA]/10 to-[#5B63E8]/10 rounded-2xl p-5 border border-[#444DDA]/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="bg-[#444DDA] w-6 h-6 rounded-full flex items-center justify-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </div>
                        <h5 className="font-medium text-[#444DDA]">คูปองของคุณ ({userCoupons.length} ใบ)</h5>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCouponList(!showCouponList)}
                        className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                          showCouponList 
                            ? 'bg-[#444DDA] text-white' 
                            : 'bg-white text-[#444DDA] border border-[#444DDA]/30 hover:bg-[#444DDA]/5'
                        }`}
                      >
                        {showCouponList ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            ซ่อน
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            แสดง
                          </>
                        )}
                      </button>
                    </div>
                    
                    {showCouponList && (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {loadingCoupons ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#444DDA] mx-auto mb-3"></div>
                            <p className="text-[#444DDA] font-medium">กำลังโหลดคูปอง...</p>
                          </div>
                        ) : userCoupons.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                            <p className="text-gray-500 font-medium">ยังไม่มีคูปอง</p>
                            <p className="text-gray-400 text-sm">ทำแบบสอบถามเพื่อรับคูปองส่วนลด</p>
                          </div>
                        ) : (
                          userCoupons.map((coupon) => (
                            <div 
                              key={coupon._id} 
                              className="group relative bg-white rounded-xl border-2 border-gray-200 hover:border-[#444DDA]/30 transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-lg"
                              onClick={() => handleUseCouponFromList(coupon)}
                            >
                              {/* เส้นตัดคูปอง */}
                              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-[#444DDA]/10 rounded-full border-2 border-gray-200 -ml-2"></div>
                              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-[#444DDA]/10 rounded-full border-2 border-gray-200 -mr-2"></div>
                              
                              <div className="flex items-center p-4">
                                <div className="flex-1 mr-4">
                                  <div className="flex items-center mb-2">
                                    <div className="bg-gradient-to-r from-[#444DDA] to-[#5B63E8] text-white px-3 py-1 rounded-full text-xs font-bold mr-2">
                                      {coupon.code}
                                    </div>
                                    <div className="bg-[#FFC107] text-gray-900 px-2 py-1 rounded-full text-xs font-semibold">
                                      -{coupon.discountPercent}%
                                    </div>
                                  </div>
                                  
                                  {coupon.description && (
                                    <p className="text-sm text-gray-600 mb-1">{coupon.description}</p>
                                  )}
                                  
                                  <div className="flex items-center text-xs text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 8.5V20a2 2 0 002 2h4a2 2 0 002-2v-3.5" />
                                    </svg>
                                    หมดอายุ: {new Date(coupon.expiryDate).toLocaleDateString('th-TH')}
                                  </div>
                                </div>
                                
                                <div className="flex-shrink-0">
                                  <button
                                    type="button"
                                    className="bg-[#444DDA] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3730A3] transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    disabled={checkingCoupon}
                                  >
                                    {checkingCoupon ? (
                                      <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></div>
                                        ใช้งาน
                                      </div>
                                    ) : (
                                      'ใช้งาน'
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* ส่วนกรอกรหัสคูปองแบบเดิม */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                  <div className="flex items-center mb-3">
                    <div className="bg-gray-400 w-5 h-5 rounded-full flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <h5 className="font-medium text-gray-700">หรือกรอกรหัสคูปอง</h5>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="เช่น SUMMER2025, SUR1234"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-transparent transition-all duration-200 font-mono text-center tracking-wider"
                      />
                      {couponCode && (
                        <button
                          type="button"
                          onClick={() => setCouponCode('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleCheckCoupon}
                      disabled={checkingCoupon || !couponCode.trim()}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                        checkingCoupon || !couponCode.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-[#FFC107] text-gray-900 hover:bg-[#E6AC00] shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                      }`}
                    >
                      {checkingCoupon ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-gray-600 mr-2"></div>
                          ตรวจสอบ
                        </div>
                      ) : (
                        'ตรวจสอบ'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-[#444DDA] to-[#5B63E8] rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center mb-1">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold mr-2">
                          {appliedCoupon.coupon.code}
                        </span>
                        <span className="bg-[#FFC107] text-gray-900 px-2 py-1 rounded-full text-xs font-semibold">
                          -{appliedCoupon.coupon.discountPercent}%
                        </span>
                      </div>
                      <p className="text-blue-100 text-sm">
                        ส่วนลด {appliedCoupon.discountAmount.toLocaleString()} บาท
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={removeCoupon}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
            
            {couponError && !couponInfo && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="bg-red-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-700 font-medium">{couponError}</p>
                </div>
              </div>
            )}
            
            {couponInfo && (
              <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center mb-1">
                        <span className="bg-[#444DDA] text-white px-3 py-1 rounded-full text-sm font-bold mr-2">
                          {couponInfo.coupon.code}
                        </span>
                        <span className="bg-[#FFC107] text-gray-900 px-2 py-1 rounded-full text-xs font-semibold">
                          -{couponInfo.coupon.discountPercent}%
                        </span>
                      </div>
                      <p className="text-green-700 font-medium">
                        ส่วนลด {couponInfo.discountAmount.toLocaleString()} บาท
                      </p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="bg-[#444DDA] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#3730A3] transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    ใช้คูปอง
                  </button>
                </div>
              </div>
            )}
          </div>
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