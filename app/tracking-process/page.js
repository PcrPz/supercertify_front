// app/tracking-process/page.js
"use client"
import { useState } from 'react';
import showToast from '@/services/toastService'; // เปลี่ยนจาก useToast เป็น showToast
import { trackOrderByTrackingNumber } from '@/services/apiService';
import TrackingResultCard from '@/components/tracking/TrackingResultCard';
import Link from 'next/link';

export default function TrackingProcess() {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  // ไม่ต้องเรียกใช้ useToast() แล้ว

  const handleSearch = async () => {
    if (!trackingId.trim()) {
      showToast.error('กรุณากรอกรหัสอ้างอิงการตรวจสอบประวัติ'); // เปลี่ยนจาก toast.error เป็น showToast.error
      return;
    }

    try {
      setLoading(true);
      setNotFound(false);
      
      const loadingToastId = showToast.loading('กำลังค้นหาข้อมูล...'); // เปลี่ยนจาก toast.loading เป็น showToast.loading
      
      const result = await trackOrderByTrackingNumber(trackingId);
      
      showToast.dismiss(loadingToastId); // เปลี่ยนจาก toast.dismiss เป็น showToast.dismiss
      
      if (result.success) {
        setTrackingResult(result.data);
        showToast.success('พบข้อมูลการตรวจสอบประวัติเรียบร้อย'); // เปลี่ยนจาก toast.success เป็น showToast.success
      } else {
        showToast.error(result.message || 'ไม่พบข้อมูลการตรวจสอบ กรุณาตรวจสอบรหัสอ้างอิงอีกครั้ง'); // เปลี่ยนจาก toast.error เป็น showToast.error
        setTrackingResult(null);
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching tracking information:', error);
      showToast.error('เกิดข้อผิดพลาดในการค้นหาข้อมูล กรุณาลองใหม่อีกครั้ง'); // เปลี่ยนจาก toast.error เป็น showToast.error
      setTrackingResult(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setTrackingId('');
    setTrackingResult(null);
    setNotFound(false);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">การติดตามกระบวนการ</h1>
      
      <div className="max-w-4xl mx-auto">
        <p className="text-center mb-6 text-lg text-gray-600">
          กรุณาป้อนรหัสการตรวจสอบประวัติของคุณเพื่อตรวจสอบสถานะการประมวลผล
        </p>
        <p className="text-center mb-10 text-sm text-gray-500">
          รหัสการตรวจสอบประวัติมีรูปแบบเป็น SCT ตามด้วยตัวเลข เช่น SCT1234567890123
        </p>
        
        <div className="mb-10">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="รหัสการตรวจสอบประวัติ"
                className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              
              {trackingId && (
                <button 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setTrackingId('')}
                  aria-label="Clear input"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="flex justify-center mt-6">
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-full transition duration-300"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังค้นหา...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    ค้นหา
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* แสดงผลการค้นหา */}
        {trackingResult && (
          <div className="mt-8">
            <TrackingResultCard order={trackingResult} />
          </div>
        )}
        
        {/* แสดงข้อความเมื่อไม่พบข้อมูล - แบบ minimal */}
        {notFound && !loading && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="inline-flex items-center justify-center mx-auto w-14 h-14 rounded-full bg-gray-50 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">ไม่พบข้อมูลการตรวจสอบ</h3>
              
              <p className="text-gray-600 mb-5">
                ไม่พบข้อมูลที่ตรงกับรหัสอ้างอิง <span className="font-medium">{trackingId}</span>
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6 max-w-md mx-auto text-left">
                <p className="text-sm text-gray-600 mb-2">คำแนะนำ:</p>
                <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                  <li>ตรวจสอบความถูกต้องของรหัสอ้างอิง (SCT ตามด้วยตัวเลข)</li>
                  <li>หากเพิ่งทำการสั่งซื้อ อาจต้องรอ 1-2 วันทำการ</li>
                  <li>ตรวจสอบอีเมลของคุณเพื่อดูรหัสอ้างอิงที่ถูกต้อง</li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleClear}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ล้างข้อมูลและลองใหม่
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}