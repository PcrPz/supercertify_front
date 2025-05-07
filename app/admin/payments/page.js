'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PaymentManagement from '@/components/admin/PaymentManagement';
import Cookies from 'js-cookie';

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Check for authentication token on page load
  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get('access_token');
      
      if (!token) {
        setIsAuthorized(false);
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setIsAuthorized(true);
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#444DDA] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Unauthorized state
  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-100 text-red-600 p-6 rounded-xl mb-4 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ หรือเซสชันหมดอายุ</p>
          <p className="mt-2">กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  // Render main content when authorized
  return (
    <div className="container mx-auto px-4">
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-2">ระบบจัดการการชำระเงิน</h1>
        <p className="text-gray-600 mb-6">จัดการและตรวจสอบการชำระเงินของคำสั่งซื้อทั้งหมด</p>
      </div>
      <PaymentManagement />
    </div>
  );
}