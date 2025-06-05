// app/api/auth/refresh-token/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  console.log('[REFRESH-TOKEN] API route called');
  try {
    // ดึง refresh token จาก cookie
    const refreshToken = request.cookies.get('refresh_token')?.value;
    
    console.log('[REFRESH-TOKEN] Cookie check:', {
      'Has refresh_token': !!refreshToken,
      'All cookies': request.cookies.getAll().map(c => c.name)
    });
    
    if (!refreshToken) {
      console.log('[REFRESH-TOKEN] No refresh token found in cookies');
      return NextResponse.json(
        { success: false, message: 'No refresh token' },
        { status: 401 }
      );
    }
    
    console.log('[REFRESH-TOKEN] Calling backend API with refresh token');
    
    // เรียกใช้ API refresh token ของ Backend
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    console.log('[REFRESH-TOKEN] API URL:', apiUrl);
    
    const response = await axios.post(`${apiUrl}/auth/refresh-token`, {
      refreshToken
    });
    
    console.log('[REFRESH-TOKEN] Backend response status:', response.status);
    console.log('[REFRESH-TOKEN] Backend response data:', {
      'Has access_token': !!response.data.access_token,
      success: response.data.success
    });
    
    // สร้าง response พร้อมกับตั้งค่า cookie
    const res = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully'
    });
    
    // ตั้งค่า access token cookie ใหม่
    if (response.data.access_token) {
    console.log('[REFRESH-TOKEN] Setting new access_token cookie');
    res.cookies.set('access_token', response.data.access_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 5, // 5 ชั่วโมง ตรงกับ JWT_EXPIRES_IN=5h
    });
    }
    
    return res;
  } catch (error) {
    console.error('[REFRESH-TOKEN] Error:', error.message);
    console.error('[REFRESH-TOKEN] Error details:', error.response?.data || 'No response data');
    
    // ถ้าเป็น 401 หรือ refresh token หมดอายุ
    if (error.response?.status === 401) {
      console.log('[REFRESH-TOKEN] Refresh token expired or invalid, clearing cookies');
      // ลบ cookies ทั้งหมด
      const res = NextResponse.json(
        { success: false, message: 'Refresh token expired or invalid' },
        { status: 401 }
      );
      
      res.cookies.set('access_token', '', { maxAge: 0 });
      res.cookies.set('refresh_token', '', { maxAge: 0 });
      
      return res;
    }
    
    return NextResponse.json(
      { success: false, message: 'Failed to refresh token', error: error.message },
      { status: error.response?.status || 500 }
    );
  }
}