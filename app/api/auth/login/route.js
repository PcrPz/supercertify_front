// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';


// ตั้งค่า cookie options
const COOKIE_OPTIONS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 วัน
};

export async function POST(request) {
  try {
    // ดึงข้อมูลจาก request
    const loginData = await request.json();
    console.log('Login data:', loginData);
    
    // ส่งข้อมูลไปยัง API
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const response = await axios.post(`${apiUrl}/auth/login`, loginData);
    console.log('Login API response status:', response.status);
    
    // สร้าง response พร้อมกับตั้งค่า cookie
    const res = NextResponse.json({
      user: response.data.user,
      success: true
    });
    
    // ตั้งค่า httpOnly cookie
    if (response.data.access_token) {
      res.cookies.set('access_token', response.data.access_token, COOKIE_OPTIONS);
    }
    
    return res;
  } catch (error) {
    console.error('Login API error:', error.message);
    console.error('Error details:', error.response?.data || 'No response data');
    
    // ส่งข้อผิดพลาดกลับไป
    return NextResponse.json(
      { 
        message: error.response?.data?.message || 'Login failed',
        error: error.message
      }, 
      { status: error.response?.status || 500 }
    );
  }
}