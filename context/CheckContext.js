'use client'
import { createContext, useContext, useState } from 'react';

const CheckContext = createContext();

export function CheckProvider({ children }) {
  const [checkMode, setCheckMode] = useState('company');
  const [cart, setCart] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  
  // ✅ เปลี่ยน applicants structure
  const [applicants, setApplicants] = useState([
    { 
      id: 1, 
      firstName: '',  // ✅ เพิ่มฟิลด์ใหม่
      lastName: '',   // ✅ เพิ่มฟิลด์ใหม่
      company: '', 
      email: '', 
      services: [] 
    }
  ]);
  
  // เพิ่มบริการลงในตะกร้า
  const addService = (service) => {
    // ตรวจสอบว่าบริการนี้มีในตะกร้าแล้วหรือไม่
    const existingService = cart.find(item => item.id === service.id);
    
    if (existingService) {
      // ถ้ามีแล้ว อัปเดตจำนวน
      setCart(cart.map(item => 
        item.id === service.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // ถ้ายังไม่มี เพิ่มใหม่
      setCart([...cart, { ...service, quantity: 1 }]);
    }
  };
  
  // ลบบริการออกจากตะกร้า
  const removeService = (serviceId) => {
    // ลบบริการออกจากผู้สมัครทุกคนที่เลือกบริการนี้
    setApplicants(applicants.map(applicant => ({
      ...applicant,
      services: applicant.services.filter(id => id !== serviceId)
    })));
    
    // ลบบริการออกจากตะกร้า
    setCart(cart.filter(item => item.id !== serviceId));
  };
  
  // เปลี่ยนจำนวนของบริการในตะกร้า
  const updateQuantity = (serviceId, quantity) => {
    if (quantity <= 0) {
      // ถ้าจำนวนน้อยกว่าหรือเท่ากับ 0 ให้ลบออกจากตะกร้า
      removeService(serviceId);
    } else {
      // อัปเดตจำนวน
      setCart(cart.map(item => 
        item.id === serviceId 
          ? { ...item, quantity } 
          : item
      ));
      
      // ตรวจสอบว่ามีการลดจำนวนหรือไม่
      const currentService = cart.find(item => item.id === serviceId);
      if (currentService && quantity < currentService.quantity) {
        // นับจำนวนผู้สมัครที่เลือกบริการนี้
        const assignedCount = applicants.reduce((count, applicant) => {
          return count + applicant.services.filter(id => id === serviceId).length;
        }, 0);
        
        // ถ้ามีการกำหนดบริการให้ผู้สมัครมากกว่าจำนวนที่ต้องการในตะกร้า
        if (assignedCount > quantity) {
          // ลบบริการออกจากผู้สมัครบางคน
          const excessCount = assignedCount - quantity;
          let removedCount = 0;
          
          const updatedApplicants = [...applicants];
          
          // ลบจากผู้สมัครคนที่เพิ่มล่าสุดก่อน
          for (let i = updatedApplicants.length - 1; i >= 0 && removedCount < excessCount; i--) {
            const applicant = updatedApplicants[i];
            const serviceIndex = applicant.services.indexOf(serviceId);
            
            if (serviceIndex !== -1) {
              applicant.services.splice(serviceIndex, 1);
              removedCount++;
            }
          }
          
          setApplicants(updatedApplicants);
        }
      }
    }
  };
  
  // ฟังก์ชันตรวจสอบว่าเป็น package หรือไม่
  const isPackage = (item) => {
    return (
      (item.type === 'package') || 
      (item.isPackage === true) || 
      (item.title && item.title.toLowerCase().includes('package')) ||
      (item.subServices && Array.isArray(item.subServices) && item.subServices.length > 0) ||
      (item.packageItems && Array.isArray(item.packageItems) && item.packageItems.length > 0)
    );
  };

  // ฟังก์ชันนับจำนวนบริการภายใน package
  const countPackageServices = (item) => {
    console.log("Counting services for package:", item);
    
    // ถ้ามี subServices ใช้จำนวนจาก subServices
    if (item.subServices && Array.isArray(item.subServices)) {
      console.log(`Found ${item.subServices.length} services in subServices`);
      return item.subServices.length;
    } 
    // ถ้ามี packageItems ใช้จำนวนจาก packageItems
    else if (item.packageItems && Array.isArray(item.packageItems)) {
      console.log(`Found ${item.packageItems.length} services in packageItems`);
      return item.packageItems.length;
    }
    // ถ้ามี services และเป็น array ใช้จำนวนจาก services
    else if (item.services && Array.isArray(item.services)) {
      console.log(`Found ${item.services.length} services in services array`);
      return item.services.length;
    }
    // ถ้ามี packageServices และเป็น array ใช้จำนวนจาก packageServices
    else if (item.packageServices && Array.isArray(item.packageServices)) {
      console.log(`Found ${item.packageServices.length} services in packageServices array`);
      return item.packageServices.length;
    }
    // ถ้ามีฟิลด์ serviceCount ที่เป็นตัวเลข ใช้ค่านั้นเลย
    else if (item.serviceCount && typeof item.serviceCount === 'number') {
      console.log(`Using explicit serviceCount: ${item.serviceCount}`);
      return item.serviceCount;
    }
    // ถ้ามีฟิลด์ packageSize ที่เป็นตัวเลข ใช้ค่านั้น
    else if (item.packageSize && typeof item.packageSize === 'number') {
      console.log(`Using packageSize: ${item.packageSize}`);
      return item.packageSize;
    }
    // ถ้าไม่มีข้อมูลชัดเจน ใช้ค่าประมาณจากชื่อหรือค่าเริ่มต้น
    else {
      let packageServiceCount = 2; // ค่าเริ่มต้น
      
      if (item.title) {
        // ลองดึงตัวเลขจากชื่อ เช่น "Starter Package (3 services)" หรือ "Package (4)"
        const matches = item.title.match(/\((\d+)(?:\s*services?)?\)/i);
        if (matches && matches[1]) {
          packageServiceCount = parseInt(matches[1], 10);
          console.log(`Extracted service count ${packageServiceCount} from title pattern`);
        } 
        // หรือลองดึงตัวเลขที่ปรากฏในชื่อ (ถ้ามี)
        else {
          const numberMatches = item.title.match(/\b(\d+)\b/);
          if (numberMatches && numberMatches[1]) {
            const potentialCount = parseInt(numberMatches[1], 10);
            // ตรวจสอบว่าตัวเลขที่พบมีความเป็นไปได้ที่จะเป็นจำนวนบริการหรือไม่ (ระหว่าง 2-10)
            if (potentialCount >= 2 && potentialCount <= 10) {
              packageServiceCount = potentialCount;
              console.log(`Found number ${packageServiceCount} in title, using as service count`);
            }
          }
        }
        
        // หรือลองเดาจากชื่อ
        if (packageServiceCount === 2) { // ยังใช้ค่าเริ่มต้น แสดงว่ายังไม่พบตัวเลขที่ชัดเจน
          const titleLower = item.title.toLowerCase();
          
          if (titleLower.includes('complete') || titleLower.includes('full') || 
              titleLower.includes('comprehensive') || titleLower.includes('all-in-one')) {
            packageServiceCount = 4;
            console.log(`Title contains 'complete/full/comprehensive', assuming it has 4 services`);
          } 
          else if (titleLower.includes('premium') || titleLower.includes('plus') || 
                  titleLower.includes('enhanced') || titleLower.includes('advanced')) {
            packageServiceCount = 3;
            console.log(`Title contains 'premium/plus/enhanced/advanced', assuming it has 3 services`);
          }
          else if (titleLower.includes('basic') || titleLower.includes('starter') || 
                  titleLower.includes('simple') || titleLower.includes('standard')) {
            packageServiceCount = 2;
            console.log(`Title contains 'basic/starter/simple/standard', assuming it has 2 services`);
          }
        }
      }
      
      console.log(`Using estimated service count: ${packageServiceCount}`);
      return packageServiceCount;
    }
  };
  
  // ฟังก์ชันนับจำนวนบริการทั้งหมด (รวมบริการย่อยในแพ็คเกจ)
  const getTotalServiceCount = () => {
    let totalCount = 0;
    
    for (const item of cart) {
      console.log("Checking item:", item); // แสดงข้อมูลสินค้าเพื่อดีบัก
      
      if (isPackage(item)) {
        // ถ้าเป็นแพ็คเกจ นับจำนวนบริการย่อย
        const packageCount = countPackageServices(item);
        console.log(`Package ${item.title || 'unknown'}: ${packageCount} services`);
        totalCount += packageCount * item.quantity; // คูณด้วยจำนวนแพ็คเกจ
      } else {
        // ถ้าเป็นบริการเดี่ยว นับตามจำนวนที่สั่งซื้อ
        console.log(`Single service ${item.title || 'unknown'}: ${item.quantity} items`);
        totalCount += item.quantity;
      }
    }
    
    console.log("Total service count:", totalCount);
    return totalCount;
  };
  
  // ฟังก์ชันคำนวณอัตราส่วนลด
  const getDiscountRate = () => {
    const serviceCount = getTotalServiceCount();
    
    console.log("Service count for discount calculation:", serviceCount);
    
    if (serviceCount >= 5) {
      return 0.10; // ลด 10%
    } else if (serviceCount >= 3) {
      return 0.05; // ลด 5%
    }
    return 0;
  };
  
  // คำนวณราคารวมของบริการในตะกร้า (ก่อนหักส่วนลด)
  const getSubtotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  // คำนวณจำนวนเงินส่วนลด
  const getDiscountAmount = () => {
    const subtotal = getSubtotalPrice();
    const discountRate = getDiscountRate();
    const amount = Math.round(subtotal * discountRate);
    
    console.log("Subtotal:", subtotal);
    console.log("Discount rate:", discountRate);
    console.log("Discount amount:", amount);
    
    return amount;
  };
  
// แก้ฟังก์ชัน getTotalPrice
const getTotalPrice = () => {
  const subtotal = getSubtotalPrice();
  const promotionDiscount = getDiscountAmount();
  const afterPromotionPrice = subtotal - promotionDiscount;
  
  // หักคูปองจากราคาหลังหักโปรโมชั่นแล้ว
  return afterPromotionPrice - couponDiscount;
};
// เพิ่มฟังก์ชันใหม่
const getAfterPromotionPrice = () => {
  const subtotal = getSubtotalPrice();
  const promotionDiscount = getDiscountAmount();
  return subtotal - promotionDiscount;
};
  // เพิ่มผู้สมัคร
   const addApplicant = () => {
    if (checkMode === 'personal' && applicants.length >= 1) {
      alert('โหมดส่วนตัวสามารถเพิ่มผู้สมัครได้เพียง 1 คนเท่านั้น');
      return;
    }
    
    const newId = applicants.length > 0 
      ? Math.max(...applicants.map(a => a.id)) + 1 
      : 1;
    
    setApplicants([...applicants, { 
      id: newId, 
      firstName: '',  // ✅ เพิ่มฟิลด์ใหม่
      lastName: '',   // ✅ เพิ่มฟิลด์ใหม่
      company: '', 
      email: '', 
      services: [] 
    }]);
  };
  
  // อัปเดตข้อมูลผู้สมัคร
  const updateApplicant = (id, field, value) => {
    setApplicants(applicants.map(applicant => 
      applicant.id === id 
        ? { ...applicant, [field]: value } 
        : applicant
    ));
  };
  
  // ลบผู้สมัคร
  const removeApplicant = (id) => {
    // ถ้าเป็นโหมด personal และมีผู้สมัครเหลือเพียง 1 คน ไม่อนุญาตให้ลบ
    if (checkMode === 'personal' && applicants.length <= 1) {
      alert('โหมดส่วนตัวต้องมีผู้สมัครอย่างน้อย 1 คน');
      return;
    }
    
    // ตรวจสอบว่ามีผู้สมัครมากกว่า 1 คนหรือไม่
    if (applicants.length > 1) {
      // หาผู้สมัครที่จะลบ
      const applicantToRemove = applicants.find(app => app.id === id);
      
      // ลบผู้สมัคร
      setApplicants(applicants.filter(applicant => applicant.id !== id));
    }
  };
  
  // ตรวจสอบว่าบริการซ้ำซ้อนกับบริการที่ผู้สมัครมีอยู่แล้วหรือไม่
  const isServiceConflictingForApplicant = (applicantId, serviceId) => {
    const applicant = applicants.find(app => app.id === applicantId);
    if (!applicant) return false;
    
    // ตรวจสอบว่าผู้สมัครมีบริการนี้อยู่แล้วหรือไม่
    if (applicant.services.includes(serviceId)) return true;
    
    const serviceToAdd = cart.find(item => item.id === serviceId);
    if (!serviceToAdd) return false;
    
    // ถ้าเป็นแพ็คเกจ ตรวจสอบว่ามีบริการย่อยที่ซ้ำกับที่ผู้สมัครมีอยู่แล้วหรือไม่
    if (isPackage(serviceToAdd)) {
      // ดึงข้อมูล subServices หรือ packageItems ถ้ามี
      const packageServiceIds = [];
      
      if (serviceToAdd.subServices && Array.isArray(serviceToAdd.subServices)) {
        packageServiceIds.push(...serviceToAdd.subServices.map(s => s.id));
      } else if (serviceToAdd.packageItems && Array.isArray(serviceToAdd.packageItems)) {
        packageServiceIds.push(...serviceToAdd.packageItems.map(s => s.id));
      }
      
      // ถ้ามีข้อมูลบริการย่อย ตรวจสอบความซ้ำซ้อน
      if (packageServiceIds.length > 0) {
        for (const existingServiceId of applicant.services) {
          const existingService = cart.find(item => item.id === existingServiceId);
          if (!existingService) continue;
          
          // ถ้าบริการเดิมเป็นแพ็คเกจ
          if (isPackage(existingService)) {
            const existingPackageServiceIds = [];
            
            if (existingService.subServices && Array.isArray(existingService.subServices)) {
              existingPackageServiceIds.push(...existingService.subServices.map(s => s.id));
            } else if (existingService.packageItems && Array.isArray(existingService.packageItems)) {
              existingPackageServiceIds.push(...existingService.packageItems.map(s => s.id));
            }
            
            // ตรวจสอบว่ามีบริการย่อยที่ซ้ำกันหรือไม่
            const hasConflict = packageServiceIds.some(id => existingPackageServiceIds.includes(id));
            if (hasConflict) return true;
          } else {
            // ถ้าบริการเดิมเป็นบริการเดี่ยว ตรวจสอบว่าซ้ำกับบริการย่อยในแพ็คเกจหรือไม่
            if (packageServiceIds.includes(existingServiceId)) return true;
          }
        }
      }
    } else {
      // ถ้าเป็นบริการเดี่ยว ตรวจสอบว่าซ้ำกับบริการย่อยในแพ็คเกจที่ผู้สมัครมีอยู่แล้วหรือไม่
      for (const existingServiceId of applicant.services) {
        const existingService = cart.find(item => item.id === existingServiceId);
        if (!existingService) continue;
        
        if (isPackage(existingService)) {
          const existingPackageServiceIds = [];
          
          if (existingService.subServices && Array.isArray(existingService.subServices)) {
            existingPackageServiceIds.push(...existingService.subServices.map(s => s.id));
          } else if (existingService.packageItems && Array.isArray(existingService.packageItems)) {
            existingPackageServiceIds.push(...existingService.packageItems.map(s => s.id));
          }
          
          if (existingPackageServiceIds.includes(serviceId)) return true;
        }
      }
    }
    
    return false;
  };
  
  // เพิ่มบริการให้กับผู้สมัคร
  const addServiceToApplicant = (applicantId, serviceId) => {
    // ตรวจสอบความซ้ำซ้อน
    if (isServiceConflictingForApplicant(applicantId, serviceId)) {
      alert('บริการนี้ซ้ำซ้อนกับบริการที่ผู้สมัครมีอยู่แล้ว');
      return false;
    }
    
    // ตรวจสอบว่ายังมีจำนวนบริการเหลืออยู่หรือไม่
    const service = cart.find(item => item.id === serviceId);
    const assignedCount = applicants.reduce((count, app) => {
      return count + app.services.filter(id => id === serviceId).length;
    }, 0);
    
    if (assignedCount >= service.quantity) {
      alert('บริการนี้ถูกกำหนดให้ผู้สมัครครบจำนวนแล้ว');
      return false;
    }
    
    // เพิ่มบริการให้ผู้สมัคร
    setApplicants(applicants.map(app => 
      app.id === applicantId
        ? { ...app, services: [...app.services, serviceId] }
        : app
    ));
    
    return true;
  };
  
  // ลบบริการออกจากผู้สมัคร
  const removeServiceFromApplicant = (applicantId, serviceId) => {
    setApplicants(applicants.map(app => 
      app.id === applicantId
        ? { ...app, services: app.services.filter(id => id !== serviceId) }
        : app
    ));
    
    return true;
  };
  
  // ตรวจสอบว่าบริการถูกกำหนดให้ผู้สมัครครบจำนวนแล้วหรือยัง
  const isServiceFullyAssigned = (serviceId) => {
    const service = cart.find(item => item.id === serviceId);
    if (!service) return true;
    
    const assignedCount = applicants.reduce((count, app) => {
      return count + app.services.filter(id => id === serviceId).length;
    }, 0);
    
    return assignedCount >= service.quantity;
  };
  
  // ตรวจสอบว่าบริการทั้งหมดถูกกำหนดให้ผู้สมัครครบจำนวนแล้วหรือยัง
  const areAllServicesFullyAssigned = () => {
    return cart.every(service => isServiceFullyAssigned(service.id));
  };
  
  // หาบริการที่ยังสามารถกำหนดให้ผู้สมัครได้
  const getAvailableServicesForApplicant = (applicantId) => {
    return cart.filter(service => {
      // ต้องไม่ซ้ำซ้อนกับบริการที่ผู้สมัครมีอยู่แล้ว
      if (isServiceConflictingForApplicant(applicantId, service.id)) return false;
      
      // ต้องยังไม่ถูกกำหนดครบจำนวน
      if (isServiceFullyAssigned(service.id)) return false;
      
      return true;
    });
  };
  
  // ฟังก์ชันตรวจสอบคูปอง
const checkCouponCode = async () => {
  console.warn('checkCouponCode in context is deprecated - use checkCoupon from apiService directly');
  return null;
};
  
  // ฟังก์ชันใช้คูปอง
  const applyCoupon = (couponData) => {
    if (!couponData) return;
    
    setCoupon(couponData.coupon);
    setCouponDiscount(couponData.discountAmount); // ✅ เพิ่มบรรทัดนี้
  };

  
  // ฟังก์ชันยกเลิกการใช้คูปอง
  const removeCoupon = () => {
    setCoupon(null);
    setCouponDiscount(0);
  };
  
  // ฟังก์ชันรีเซ็ตคูปอง
  const resetCoupon = () => {
    setCoupon(null);
    setCouponDiscount(0);
  };
  
  // รีเซ็ต state ทั้งหมด
  const resetState = () => {
    setCheckMode('company');
    setCart([]);
    setApplicants([{ 
      id: 1, 
      firstName: '',  // ✅ เพิ่มฟิลด์ใหม่
      lastName: '',   // ✅ เพิ่มฟิลด์ใหม่
      company: '', 
      email: '', 
      services: [] 
    }]);
    resetCoupon();
  };

  // ค่าที่จะส่งไปให้ component ที่ใช้ context นี้
  const value = {
    checkMode,
    setCheckMode,
    cart,
    addService,
    removeService,
    updateQuantity,
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
    isServiceConflictingForApplicant,
    isServiceFullyAssigned,
    areAllServicesFullyAssigned,
    getAvailableServicesForApplicant,
    getAfterPromotionPrice,
    // เพิ่มฟังก์ชันสำหรับคูปอง
    coupon,
    couponDiscount,
    checkCouponCode,
    applyCoupon,
    removeCoupon,
    resetCoupon,
    resetState
  };

  return (
    <CheckContext.Provider value={value}>
      {children}
    </CheckContext.Provider>
  );
}

// Hook สำหรับใช้งาน context
export const useCheck = () => {
  const context = useContext(CheckContext);
  if (!context) {
    throw new Error('useCheck must be used within a CheckProvider');
  }
  return context;
};