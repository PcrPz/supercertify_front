// components/Navbar.js
import { cookies } from 'next/headers';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import Image from 'next/image';

async function getUser() {
  // ใช้ async กับ cookies()
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  
  if (!token) return null;
  
  try {
    const response = await fetch(`${process.env.API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });
    
    if (!response.ok) return null;
    
    return response.json();
  } catch (error) {
    return null;
  }
}

export default async function Navbar() {
  const user = await getUser();
  const isAuthenticated = !!user;

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
                <div className="flex items-center">
                <Image
                    src="/LogoSC.png"
                    alt="SuperCertify Logo"
                    width={220}
                    height={50}
                    className="cursor-pointer"
                />
                </div>
            </Link>
          
          {/* เมนูหลัก */}
          <div className="hidden md:flex space-x-8">
            <Link href="/background-check" className="text-gray-700 hover:text-blue-600">
              Background Check
            </Link>
            <Link href="/tracking-process" className="text-gray-700 hover:text-blue-600">
              Tracking Process
            </Link>
            <Link href="/contact-us" className="text-gray-700 hover:text-blue-600">
              Contact Us
            </Link>
          </div>
          
          {/* ปุ่มเข้าสู่ระบบ/ลงทะเบียน หรือ โปรไฟล์ */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link href="/profile" className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-gray-700">{user.username}</span>
                </Link>
                <LogoutButton />
              </div>
            ) : (
              <>
                <Link href="/register" className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-medium py-2 px-4 rounded-full">
                  Register
                </Link>
                <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-full">
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}