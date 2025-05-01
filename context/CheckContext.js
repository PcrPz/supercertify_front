// context/CheckContext.js - สำหรับจัดการ state ทั้งหมดของระบบ
'use client'

import { createContext, useContext, useState } from 'react';

// สร้าง context สำหรับเก็บข้อมูลทั้งหมดของการตรวจสอบ
const CheckContext = createContext();

export function CheckProvider({ children }) {
  // โหมดที่เลือกจากหน้า 1 (บริษัท หรือ ส่วนตัว)
  const [checkMode, setCheckMode] = useState('company'); // 'company' หรือ 'personal'
  
  // ตะกร้าสินค้า - เก็บบริการที่ผู้ใช้เลือก
  const [cart, setCart] = useState([]);
  
  // ข้อมูลผู้สมัคร (สำหรับหน้า 5)
  const [applicants, setApplicants] = useState([
    { id: 1, name: '', company: '', email: '', services: [] }
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
    // ถ้ามี subServices ใช้จำนวนจาก subServices
    if (item.subServices && Array.isArray(item.subServices)) {
      return item.subServices.length;
    } 
    // ถ้ามี packageItems ใช้จำนวนจาก packageItems
    else if (item.packageItems && Array.isArray(item.packageItems)) {
      return item.packageItems.length;
    } 
    // ถ้าไม่มีข้อมูลชัดเจน ใช้ค่าประมาณจากชื่อหรือค่าเริ่มต้น
    else {
      let packageServiceCount = 2; // ค่าเริ่มต้น
      
      if (item.title) {
        // ลองดึงตัวเลขจากชื่อ เช่น "Starter Package (3 services)"
        const matches = item.title.match(/\((\d+)\s*services?\)/i);
        if (matches && matches[1]) {
          packageServiceCount = parseInt(matches[1], 10);
        } 
        // หรือลองเดาจากชื่อ
        else if (item.title.toLowerCase().includes('starter')) {
          packageServiceCount = 2;
        } else if (item.title.toLowerCase().includes('premium')) {
          packageServiceCount = 3;
        } else if (item.title.toLowerCase().includes('complete')) {
          packageServiceCount = 4;
        }
      }
      
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
      return 0.10; // ลด 15%
    } else if (serviceCount >= 3) {
      return 0.05; // ลด 10%
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
  
  // คำนวณราคารวมหลังหักส่วนลด
  const getTotalPrice = () => {
    const subtotal = getSubtotalPrice();
    const discount = getDiscountAmount();
    return subtotal - discount;
  };
  
  // เพิ่มผู้สมัคร
  const addApplicant = () => {
    // ถ้าเป็นโหมด personal และมีผู้สมัครอยู่แล้ว 1 คน ไม่อนุญาตให้เพิ่ม
    if (checkMode === 'personal' && applicants.length >= 1) {
      alert('โหมดส่วนตัวสามารถเพิ่มผู้สมัครได้เพียง 1 คนเท่านั้น');
      return;
    }
    
    const newId = applicants.length > 0 
      ? Math.max(...applicants.map(a => a.id)) + 1 
      : 1;
    
    setApplicants([...applicants, { id: newId, name: '', company: '', email: '', services: [] }]);
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
  
  // รีเซ็ต state ทั้งหมด
  const resetState = () => {
    setCheckMode('company');
    setCart([]);
    setApplicants([{ id: 1, name: '', company: '', email: '', services: [] }]);
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