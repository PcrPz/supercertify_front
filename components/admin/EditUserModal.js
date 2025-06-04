"use client"
import { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { updateUserByAdmin } from '@/services/profileApi';

// CSS สำหรับ Animation (ใส่แบบ inline เพื่อให้เห็นผลทันที)
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .modal-backdrop {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  .modal-content {
    animation: slideUp 0.3s ease-out forwards;
  }
`;

export default function EditUserModal({ user, isOpen, onClose, onUserUpdated }) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    phoneNumber: user?.phoneNumber || '',
    companyName: user?.companyName || '',
    newPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const [isClosing, setIsClosing] = useState(false); // State สำหรับ Animation ตอนปิด

  // อัพเดตข้อมูลฟอร์มเมื่อ user มีการเปลี่ยนแปลง
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        phoneNumber: user.phoneNumber || '',
        companyName: user.companyName || '',
        newPassword: '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // ล้าง error สำหรับฟิลด์นี้ (ถ้ามี)
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // ตรวจสอบ username
    if (formData.username.trim() && formData.username.length < 3) {
      newErrors.username = 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร';
    }

    // ตรวจสอบรหัสผ่านใหม่ (ถ้ามีการกรอก)
    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // รีเซ็ตสถานะการส่งฟอร์ม
    setSubmitStatus(null);
    
    // ตรวจสอบความถูกต้องของข้อมูล
    if (!validateForm()) {
      return;
    }

    // เตรียมข้อมูลสำหรับส่งไปยัง API
    const updateData = {};
    
    // เพิ่มเฉพาะข้อมูลที่มีการเปลี่ยนแปลงเท่านั้น
    if (formData.username !== user.username && formData.username.trim()) {
      updateData.username = formData.username.trim();
    }
    
    if (formData.phoneNumber !== user.phoneNumber && formData.phoneNumber.trim()) {
      updateData.phoneNumber = formData.phoneNumber.trim();
    }
    
    if (formData.companyName !== user.companyName && formData.companyName.trim()) {
      updateData.companyName = formData.companyName.trim();
    }
    
    if (formData.newPassword.trim()) {
      updateData.newPassword = formData.newPassword.trim();
    }

    // ถ้าไม่มีข้อมูลที่ต้องอัปเดต ให้ปิด modal
    if (Object.keys(updateData).length === 0) {
      handleCloseModal();
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await updateUserByAdmin(user._id, updateData);
      
      if (response.success) {
        setSubmitStatus('success');
        // รอให้แสดงข้อความสำเร็จสักครู่ก่อนปิด modal
        setTimeout(() => {
          handleCloseModal();
          if (typeof onUserUpdated === 'function') {
            onUserUpdated(response.data); // ส่งข้อมูลที่อัปเดตกลับไปที่หน้าหลัก
          }
        }, 1500);
      } else {
        setSubmitStatus('error');
        setErrors({
          ...errors,
          submit: response.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล'
        });
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrors({
        ...errors,
        submit: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: user?.username || '',
      phoneNumber: user?.phoneNumber || '',
      companyName: user?.companyName || '',
      newPassword: '',
    });
    setErrors({});
    setSubmitStatus(null);
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    // รอให้ animation เล่นจบก่อนปิด modal จริงๆ
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  // ถ้า modal ไม่เปิด ไม่ต้องแสดงอะไร
  if (!isOpen) return null;

  return (
    <>
      {/* CSS Styles */}
      <style jsx global>{animationStyles}</style>
      
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop แบบเบลอ */}
        <div 
          className={`fixed inset-0 transition-opacity modal-backdrop ${isClosing ? 'opacity-0' : 'opacity-100'}`}
          style={{ 
            backdropFilter: 'blur(8px)', 
            WebkitBackdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            transitionProperty: 'opacity',
            transitionDuration: '200ms'
          }}
          onClick={handleCloseModal}
        ></div>
        
        {/* Modal Content */}
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div 
            className={`w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative modal-content ${isClosing ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}
            style={{
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              transitionProperty: 'opacity, transform',
              transitionDuration: '200ms'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                แก้ไขข้อมูลผู้ใช้
              </h3>
              <button
                type="button"
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                onClick={handleCloseModal}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Status Message */}
            {submitStatus === 'success' && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center">
                <CheckIcon className="h-5 w-5 mr-2 text-green-500" />
                <span>อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว</span>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 mr-2 text-red-500" />
                <span>{errors.submit || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล'}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 mb-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อผู้ใช้
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`block w-full px-4 py-2.5 rounded-lg border ${
                      errors.username ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    } shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors`}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อบริษัท
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยนแปลง)
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`block w-full px-4 py-2.5 rounded-lg border ${
                      errors.newPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    } shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors`}
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  รีเซ็ต
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2.5 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                    isSubmitting 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  style={{ backgroundColor: isSubmitting ? undefined : '#444DDA' }}
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}