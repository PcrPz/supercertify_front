// pages/tracking-process.js หรือ app/tracking-process/page.js
"use client"
import { useState } from 'react';
import { toast } from 'react-toastify';
import { trackOrderByTrackingNumber } from '@/services/apiService';
import TrackingResultCard from '@/components/tracking/TrackingResultCard';

export default function TrackingProcess() {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState(null);

  const handleSearch = async () => {
    if (!trackingId.trim()) {
      toast.error('กรุณากรอกรหัสอ้างอิงการตรวจสอบประวัติ');
      return;
    }

    try {
      setLoading(true);
      
      // เรียกใช้ API ผ่าน apiService
      const result = await trackOrderByTrackingNumber(trackingId);
      
      if (result.success) {
        // แสดงผลในหน้าเดียวกัน
        setTrackingResult(result.data);
      } else {
        // แสดงข้อความผิดพลาด
        toast.error(result.message || 'ไม่พบข้อมูลการตรวจสอบ กรุณาตรวจสอบรหัสอ้างอิงอีกครั้ง');
      }
    } catch (error) {
      console.error('Error fetching tracking information:', error);
      toast.error('เกิดข้อผิดพลาดในการค้นหาข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-10">การติดตามกระบวนการ</h1>
      
      <div className="max-w-4xl mx-auto">
        <p className="text-center mb-10 text-lg text-gray-600">
          กรุณาป้อนรหัสการตรวจสอบประวัติของคุณเพื่อตรวจสอบสถานะการประมวลผล
        </p>
        
        <div className="mb-10">
          <div className="max-w-md mx-auto">
            <input
              type="text"
              placeholder="รหัสการตรวจสอบประวัติ"
              className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            
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
                ) : 'ค้นหา'}
              </button>
            </div>
          </div>
        </div>
        
        {/* แสดงผลการค้นหาในหน้าเดียวกัน */}
        {trackingResult && (
          <div className="mt-8">
            <TrackingResultCard order={trackingResult} />
          </div>
        )}
      </div>
    </div>
  );
}