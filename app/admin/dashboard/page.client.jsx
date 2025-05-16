// app/admin/dashboard/page.client.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllOrders } from '@/services/apiService';
import Link from 'next/link';

export default function DashboardClient() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);
  
  const statusList = [
    { id: 'all', name: 'ทั้งหมด' },
    { id: 'awaiting_payment', name: 'รอชำระเงิน' },
    { id: 'pending_verification', name: 'รอตรวจสอบการชำระเงิน' },
    { id: 'payment_verified', name: 'ยืนยันการชำระเงินแล้ว' },
    { id: 'processing', name: 'กำลังดำเนินการ' },
    { id: 'completed', name: 'เสร็จสิ้น' },
    { id: 'cancelled', name: 'ยกเลิก' }
  ];
  
  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const ordersData = await getAllOrders();
        setOrders(ordersData);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrders();
  }, []);
  
  // กรองข้อมูลตาม status
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.OrderStatus === statusFilter);
  
  // แสดงวันที่ในรูปแบบที่อ่านง่าย
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // แสดงสถานะในรูปแบบที่อ่านง่าย
  const getStatusBadge = (status) => {
    const statusMap = {
      'awaiting_payment': { text: 'รอชำระเงิน', class: 'bg-yellow-100 text-yellow-800' },
      'pending_verification': { text: 'รอตรวจสอบการชำระเงิน', class: 'bg-blue-100 text-blue-800' },
      'payment_verified': { text: 'ยืนยันการชำระเงินแล้ว', class: 'bg-green-100 text-green-800' },
      'processing': { text: 'กำลังดำเนินการ', class: 'bg-indigo-100 text-indigo-800' },
      'completed': { text: 'เสร็จสิ้น', class: 'bg-green-100 text-green-800' },
      'cancelled': { text: 'ยกเลิก', class: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => router.refresh()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          ลองใหม่
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">ระบบจัดการคำสั่งซื้อ</h1>
      
      {/* Status Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {statusList.map(status => (
            <button
              key={status.id}
              onClick={() => setStatusFilter(status.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${statusFilter === status.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              {status.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Orders Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รหัสคำสั่ง
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่สร้าง
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้สมัคร
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ราคารวม
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.TrackingNumber}</div>
                      <div className="text-xs text-gray-500">{order._id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.OrderType === 'personal' ? 'บุคคล' : 'บริษัท'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.candidates?.length || 0} คน
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.OrderStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{(order.TotalPrice || 0).toLocaleString()} บาท</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex space-x-2 justify-end">
                        <Link 
                          href={`/admin/dashboard/${order._id}`}
                          className="px-3 py-1 border border-blue-500 text-blue-500 rounded hover:bg-blue-100"
                        >
                          ดูรายละเอียด
                        </Link>
                        
                        {order.OrderStatus === 'processing' && (
                          <Link 
                            href={`/admin/dashboard/${order._id}/add-result`}
                            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                          >
                            เพิ่มผลตรวจสอบ
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">ไม่พบข้อมูลคำสั่งซื้อตามเงื่อนไขที่เลือก</p>
          </div>
        )}
      </div>
    </div>
  );
}