'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon, 
  PencilIcon, 
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const [certifications, setCertifications] = useState([
    { id: 'BGC1568022', startDate: '03 กุมภาพันธ์ 2025', endDate: '30 มีนาคม 2025', status: 'กำลัง' },
    { id: 'BGC1568022', startDate: '03 กุมภาพันธ์ 2025', endDate: '', status: 'รอการตรวจสอบการชำระเงิน' },
    { id: 'BGC1568022', startDate: '03 กุมภาพันธ์ 2025', endDate: '', status: 'ไม่สำเร็จ' },
    { id: 'BGC1568022', startDate: '03 กุมภาพันธ์ 2025', endDate: '30 มีนาคม 2025', status: 'กำลัง' },
    { id: 'BGC1568022', startDate: '03 กุมภาพันธ์ 2025', endDate: '', status: 'รอดำเนินการ' },
    { id: 'BGC1568022', startDate: '03 กุมภาพันธ์ 2025', endDate: '30 มีนาคม 2025', status: 'กำลัง' },
    { id: 'BGC1568022', startDate: '03 กุมภาพันธ์ 2025', endDate: '30 มีนาคม 2025', status: 'กำลัง' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-medium mb-8">ยินดีต้อนรับคุณวัตสัน</h1>
        
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1 */}
          <div className="bg-indigo-600 rounded-lg p-6 text-white relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-3">
                  <CheckCircleIcon className="h-6 w-6 mr-2" />
                  <span className="text-sm">ยอดรวมการตรวจสอบที่เสร็จสิ้น</span>
                </div>
                <h2 className="text-5xl font-bold">10</h2>
              </div>
              <PencilIcon className="h-6 w-6" />
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-yellow-400 rounded-full -mb-12 -mr-12 opacity-50"></div>
          </div>
          
          {/* Card 2 */}
          <div className="bg-indigo-600 rounded-lg p-6 text-white relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-3">
                  <ClockIcon className="h-6 w-6 mr-2" />
                  <span className="text-sm">ยอดรวมการตรวจสอบที่กำลังดำเนินการ</span>
                </div>
                <h2 className="text-5xl font-bold">23</h2>
              </div>
              <PencilIcon className="h-6 w-6" />
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-yellow-400 rounded-full -mb-12 -mr-12 opacity-50"></div>
          </div>
          
          {/* Card 3 */}
          <div className="bg-indigo-600 rounded-lg p-6 text-white relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-3">
                  <ExclamationCircleIcon className="h-6 w-6 mr-2" />
                  <span className="text-sm">ยอดรวมการตรวจสอบที่ไม่สำเร็จ</span>
                </div>
                <h2 className="text-5xl font-bold">12</h2>
              </div>
              <PencilIcon className="h-6 w-6" />
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-yellow-400 rounded-full -mb-12 -mr-12 opacity-50"></div>
          </div>
        </div>
        
        {/* Add Button */}
        <button className="bg-yellow-400 text-gray-900 px-5 py-2 rounded-full font-medium mb-6 flex items-center">
          <span className="text-2xl mr-1">+</span> เพิ่มการตรวจสอบประวัติใหม่
        </button>
        
        {/* Filter and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex items-center bg-indigo-600 text-white rounded-md px-4 py-2 w-full md:w-auto">
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            <span>สถานะ</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัสการตรวจสอบประวัติ"
              className="w-full border border-gray-300 rounded-md py-2 px-4 pl-10"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md whitespace-nowrap">
            ดูประวัติการตรวจสอบทั้งหมด
          </button>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200 mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-medium">รหัสการตรวจสอบประวัติ</th>
                <th className="text-left py-4 px-6 font-medium">วันที่เริ่ม</th>
                <th className="text-left py-4 px-6 font-medium">วันที่เสร็จสิ้น</th>
                <th className="text-left py-4 px-6 font-medium">สถานะ</th>
                <th className="text-left py-4 px-6 font-medium">การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              {certifications.map((cert, index) => (
                <tr key={index} className="border-b border-gray-200 last:border-b-0">
                  <td className="py-4 px-6">#{cert.id}</td>
                  <td className="py-4 px-6">{cert.startDate}</td>
                  <td className="py-4 px-6">{cert.endDate || 'ไม่มี'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      cert.status === 'กำลัง' ? 'bg-yellow-100 text-yellow-800' :
                      cert.status === 'รอการตรวจสอบการชำระเงิน' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {cert.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button className="bg-indigo-600 text-white px-4 py-1 rounded-md text-sm">
                      ดู
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}