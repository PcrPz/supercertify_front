import { NextResponse } from 'next/server';

export async function middleware(request) {
  // ดึง Token จาก Cookies
  const token = request.cookies.get('access_token')?.value;

  // Path สำหรับ Authentication
  const authRoutes = ['/login', '/register'];

 // Routes ที่ต้องการ Authentication
 const protectedRoutes = [
    '/dashboard',
    '/admin',
    '/profile',
    '/background-check'
  ];

  // ตรวจสอบ Protected Routes
  if (protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )) {
    // ถ้าไม่มี token ให้ redirect ไปหน้า login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // ป้องกันผู้ใช้ที่ login แล้วเข้า login/register
  if (authRoutes.includes(request.nextUrl.pathname)) {
    if (token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// กำหนด Routes ที่ Middleware จะทำงาน
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/background-check/:path*',
    '/login', 
    '/register'
  ]
}