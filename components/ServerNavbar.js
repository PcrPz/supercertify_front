// components/ServerNavbar.js
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import Navbar from './Navbar';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  
  if (!token) return null;
  
  try {
    // เพิ่ม cache: 'no-store' เพื่อบังคับให้เรียก API ใหม่ทุกครั้ง
    const response = await fetch(`${process.env.API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
      next: { revalidate: 0 } // เพื่อบังคับให้ Next.js ไม่แคชข้อมูล
    });
    
    if (!response.ok) return null;
    
    return response.json();
  } catch (error) {
    return null;
  }
}

export default async function ServerNavbar() {
  const user = await getUser();
  
  // ดึง path ปัจจุบัน
  const headersList = await headers();
  const activePath = headersList.get('x-invoke-path') || '';

  return <Navbar user={user} activePath={activePath} />;
}