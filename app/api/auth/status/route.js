// app/api/auth/status/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  try {
    const token = request.cookies.get('access_token')?.value;
    
    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }
    
    // เรียกใช้ API เพื่อตรวจสอบ token และดึงข้อมูลผู้ใช้
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const response = await axios.get(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        // เพิ่ม headers เพื่อป้องกันการแคช
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    });
    
    // ตั้งค่า headers เพื่อป้องกันการแคช
    const res = NextResponse.json(
      { authenticated: true, user: response.data },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
    
    return res;
  } catch (error) {
    console.error('Auth status API error:', error.message);
    
    // ถ้าเป็น 401 หรือ token ไม่ถูกต้อง
    if (error.response?.status === 401) {
      const res = NextResponse.json(
        { authenticated: false, user: null },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
      
      // ลบ cookie ที่หมดอายุหรือไม่ถูกต้อง
      res.cookies.set('access_token', '', { 
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0 
      });
      
      return res;
    }
    
    // สำหรับข้อผิดพลาดอื่นๆ ให้ตอบกลับว่าไม่ได้เข้าสู่ระบบ
    return NextResponse.json(
      { authenticated: false, user: null }, 
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}