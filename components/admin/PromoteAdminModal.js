"use client"
import { useState } from 'react';
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { updateUserRole } from '@/services/profileApi';

// CSS สำหรับ Animation
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

export default function PromoteAdminModal({ user, isOpen, onClose, onUserUpdated }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const [errorMessage, setErrorMessage] = useState('');
  const [isClosing, setIsClosing] = useState(false); // State สำหรับ Animation ตอนปิด

  const handlePromoteUser = async () => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');

    try {
      const response = await updateUserRole(user._id, 'admin');
      
      if (response.success) {
        setSubmitStatus('success');
        
        // รอให้แสดงข้อความสำเร็จสักครู่ก่อนปิด modal
        setTimeout(() => {
          handleCloseModal();
          if (typeof onUserUpdated === 'function') {
            // ส่งข้อมูลที่อัปเดตกลับไปที่หน้าหลัก
            onUserUpdated({
              ...user,
              role: 'admin'
            });
          }
        }, 1500);
      } else {
        setSubmitStatus('error');
        setErrorMessage(response.message || 'เกิดข้อผิดพลาดในการเพิ่มสิทธิ์ผู้ดูแลระบบ');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    } finally {
      setIsSubmitting(false);
    }
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
            className={`w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative modal-content ${isClosing ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}
            style={{
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              transitionProperty: 'opacity, transform',
              transitionDuration: '200ms'
            }}
          >
            {/* ส่วนหัว Modal */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-yellow-500" />
                เพิ่มสิทธิ์ผู้ดูแลระบบ
              </h3>
              <button
                type="button"
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                onClick={handleCloseModal}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* แสดงสถานะการทำงาน */}
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center">
                <CheckIcon className="h-6 w-6 mr-2 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">ดำเนินการสำเร็จ</p>
                  <p className="mt-1">เพิ่มสิทธิ์ผู้ดูแลระบบให้กับ {user.username} เรียบร้อยแล้ว</p>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">เกิดข้อผิดพลาด</p>
                  <p className="mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* เนื้อหา Modal */}
            {!submitStatus && (
              <>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 flex-shrink-0 mr-3" />
                    <div>
                      <p className="text-yellow-700 font-medium">คำเตือน</p>
                      <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                        <li>การเพิ่มสิทธิ์ผู้ดูแลระบบจะทำให้ผู้ใช้เข้าถึงข้อมูลและฟีเจอร์ทั้งหมดของระบบได้</li>
                        <li>ผู้ดูแลระบบสามารถแก้ไขข้อมูลผู้ใช้ทุกคน รวมถึงผู้ดูแลระบบคนอื่น</li>
                        <li>ควรเพิ่มสิทธิ์นี้ให้กับผู้ที่ไว้ใจได้เท่านั้น</li>
                        <li className="font-medium">หลังจากได้รับสิทธิ์แล้ว จะไม่สามารถเปลี่ยนกลับเป็นผู้ใช้ทั่วไปได้อีก</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600">
                    คุณกำลังจะเพิ่มสิทธิ์ผู้ดูแลระบบให้กับ 
                    <span className="font-medium text-gray-900"> {user.username} </span>
                    ({user.email})
                  </p>
                </div>
              </>
            )}

            {/* ปุ่มกดดำเนินการ */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={isSubmitting}
              >
                {submitStatus === 'success' ? 'ปิด' : 'ยกเลิก'}
              </button>
              
              {!submitStatus && (
                <button
                  type="button"
                  onClick={handlePromoteUser}
                  disabled={isSubmitting}
                  className={`px-4 py-2.5 text-gray-900 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors ${
                    isSubmitting 
                      ? 'bg-yellow-300 cursor-not-allowed' 
                      : 'bg-yellow-400 hover:bg-yellow-500'
                  }`}
                >
                  {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันการเพิ่มสิทธิ์'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}