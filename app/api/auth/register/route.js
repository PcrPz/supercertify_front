// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

// ตั้งค่า cookie options (เหมือนกับใน login route)
const ACCESS_TOKEN_OPTIONS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 5, // 5 ชั่วโมง ตรงกับ JWT_EXPIRES_IN=5h
};

const REFRESH_TOKEN_OPTIONS = {
  httpOnly: false, 
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 วัน ตรงกับ JWT_REFRESH_EXPIRES_IN=7d
};

export async function POST(request) {
  try {
    // ดึงข้อมูลจาก request
    const registerData = await request.json();
    console.log('Register data:', registerData);
    
    // ส่งข้อมูลไปยัง API
    const apiUrl = process.env.API_URL;
    console.log('API URL:', apiUrl);
    
    const response = await axios.post(`${apiUrl}/auth/register`, registerData);
    console.log('Register API response status:', response.status);
    
    // สร้าง response พร้อมกับตั้งค่า cookie
    const res = NextResponse.json({
      user: response.data.user,
      success: true
    });
    
    // ตั้งค่า access token cookie
    if (response.data.access_token) {
      res.cookies.set('access_token', response.data.access_token, ACCESS_TOKEN_OPTIONS);
    }
    
    // ตั้งค่า refresh token cookie
    if (response.data.refresh_token) {
      res.cookies.set('refresh_token', response.data.refresh_token, REFRESH_TOKEN_OPTIONS);
    }
    
    return res;
  } catch (error) {
    console.error('Register API error:', error.message);
    console.error('Error details:', error.response?.data || 'No response data');
    
    // ส่งข้อผิดพลาดกลับไป
    return NextResponse.json(
      { 
        message: error.response?.data?.message || 'Registration failed',
        error: error.message
      }, 
      { status: error.response?.status || 500 }
    );
  }
}