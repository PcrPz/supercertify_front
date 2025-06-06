// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    // ดึง token จาก cookie
    const token = request.cookies.get('access_token')?.value;
    
    // ถ้ามี token ให้เรียก API logout ของ Backend
    if (token) {
      try {
        const apiUrl = process.env.API_URL || 'http://localhost:3000';
        await axios.post(`${apiUrl}/auth/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (error) {
        console.warn('Backend logout failed, but will continue to clear cookies:', error.message);
      }
    }
    
    // สร้าง response
    const res = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
    
    // ลบทั้ง access_token และ refresh_token
    res.cookies.set('access_token', '', { 
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0 
    });
    
    res.cookies.set('refresh_token', '', { 
      httpOnly: false,
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
    
    // ลบ cookies แม้จะเกิดข้อผิดพลาด
    res.cookies.set('access_token', '', { maxAge: 0 });
    res.cookies.set('refresh_token', '', { maxAge: 0 });
    
    return res;
  }
}