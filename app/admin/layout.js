'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdmin } from '@/services/auth';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        setLoading(true);
        const isAdminUser = await isAdmin();
        
        if (!isAdminUser) {
          router.push('/dashboard');
          return;
        }
        
        setAuthorized(true);
      } catch (error) {
        console.error('Admin authentication failed:', error);
        router.push('/login?redirect=/admin/dashboard');
      } finally {
        setLoading(false);
      }
    }
    
    checkAdminAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }
  
  if (!authorized) {
    return null; // ไม่แสดงอะไรเลยเพราะจะ redirect ไปหน้า login แล้ว
  }
  
  return (
    <div className="admin-layout">
      {/* Admin Navigation และ Layout อื่นๆ สามารถใส่ได้ตรงนี้ */}
      {children}
    </div>
  );
}