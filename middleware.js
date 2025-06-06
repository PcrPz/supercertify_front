import { NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// ประเภทของเส้นทาง
const ROUTE_TYPES = {
  AUTH: ['/login', '/register'],
  PROTECTED: ['/dashboard', '/profile', '/background-check', '/coupon', '/my-profile'],
  ADMIN: ['/admin']
};

export async function middleware(request) {
  // ดึงเส้นทางปัจจุบัน
  const path = request.nextUrl.pathname;
  
  // ดึง token จาก cookies
  const token = request.cookies.get('access_token')?.value;
  
  // ตรวจสอบประเภทของเส้นทาง
  const isAuthRoute = ROUTE_TYPES.AUTH.includes(path);
  const isProtectedRoute = ROUTE_TYPES.PROTECTED.some(route => path.startsWith(route));
  const isAdminRoute = ROUTE_TYPES.ADMIN.some(route => path.startsWith(route));
  
  // ฟังก์ชันสำหรับถอดรหัส token และตรวจสอบว่าเป็น admin หรือไม่
  const getUserFromToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      const isAdmin = decoded.roles && Array.isArray(decoded.roles) && decoded.roles.includes('admin');
      
      return { 
        decoded,
        isAdmin,
        isValid: true 
      };
    } catch (error) {
      return { 
        decoded: null, 
        isAdmin: false, 
        isValid: false 
      };
    }
  };

  // ตรวจสอบเส้นทางที่ต้องการสิทธิ์ admin
  if (isAdminRoute) {
    // ถ้าไม่มี token ให้ redirect ไปหน้า login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
    const { isAdmin, isValid } = getUserFromToken(token);
    
    // ถ้า token ไม่ถูกต้อง ให้ redirect ไปหน้า login
    if (!isValid) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // ถ้าไม่ใช่ admin ให้ redirect ไปหน้า dashboard
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // ตรวจสอบเส้นทางที่ต้องการการเข้าสู่ระบบ
  if (isProtectedRoute) {
    // ถ้าไม่มี token ให้ redirect ไปหน้า login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // ป้องกันผู้ใช้ที่เข้าสู่ระบบแล้วเข้าหน้า login/register
  if (isAuthRoute && token) {
    const { isAdmin, isValid } = getUserFromToken(token);
    
    // ถ้า token ไม่ถูกต้อง ให้ดำเนินการต่อ
    if (!isValid) {
      return NextResponse.next();
    }
    
    // redirect ตามประเภทของผู้ใช้
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // ถ้าไม่มีเงื่อนไขใดๆ ทำงาน ให้ดำเนินการต่อตามปกติ
  return NextResponse.next();
}

// กำหนด Routes ที่ Middleware จะทำงาน
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/background-check/:path*',
    '/coupon/:path*',
    '/my-profile/:path*',
    '/login', 
    '/register'
  ]
}