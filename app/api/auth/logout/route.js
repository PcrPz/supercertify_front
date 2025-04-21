// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    // ดึง token จาก cookie
    const token = request.cookies.get('access_token')?.value;
    
    // ถ้ามี token และต้องการแจ้ง Backend ว่ามีการ logout
    if (token) {
      try {
        const apiUrl = process.env.API_URL || 'http://localhost:3000';
        // อาจจะเรียก API logout ของ Backend ถ้ามี
        // await axios.post(`${apiUrl}/auth/logout`, {}, {
        //   headers: {
        //     Authorization: `Bearer ${token}`
        //   }
        // });
      } catch (error) {
        console.warn('Backend logout failed, but will continue to clear cookies:', error.message);
      }
    }
    
    // สร้าง response
    const res = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
    
    // ลบ cookie โดยตั้งค่าหมดอายุเป็น 0
    res.cookies.set('access_token', '', { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0 
    });
    
    return res;
  } catch (error) {
    console.error('Logout API error:', error.message);
    
    // ส่งข้อผิดพลาดกลับไป แต่ยังคงพยายามลบ cookie
    const res = NextResponse.json(
      { success: false, message: 'Logout failed', error: error.message },
      { status: 500 }
    );
    
    // ลบ cookie แม้จะเกิดข้อผิดพลาด
    res.cookies.set('access_token', '', { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0 
    });
    
    return res;
  }
}