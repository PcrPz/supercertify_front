'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon, 
  PencilIcon, 
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { getOrderById, getAllOrders, getMyOrders } from '../../services/apiService';

export default function DashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // สถิติข้อมูล Order
  const [stats, setStats] = useState({
    completed: 0,
    processing: 0,
    failed: 0
  });

  // โหลดข้อมูล Orders ทั้งหมดของ User
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // เรียกใช้ API Service เพื่อดึงข้อมูล Orders ของ User ปัจจุบัน
        const response = await getMyOrders();
        
        // ถ้าใช้งานจริงควรใช้ API ที่มีอยู่แล้ว แต่ในกรณีนี้เราใช้ getAllOrders
        // ซึ่งเป็น Admin API ในโค้ดตัวอย่าง 
        // ใน Backend ควรมี API findMyOrders สำหรับดึงข้อมูล Order ของ User ปัจจุบัน
        
        setOrders(response);
        setFilteredOrders(response);
        
        // คำนวณสถิติ
        const completed = response.filter(order => order.OrderStatus === 'completed').length;
        const processing = response.filter(order => 
          ['payment_verified', 'processing', 'pending_verification'].includes(order.OrderStatus)
        ).length;
        const failed = response.filter(order => order.OrderStatus === 'cancelled').length;
        
        setStats({
          completed,
          processing,
          failed
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง');
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // ฟังก์ชันสำหรับการกรองข้อมูลตามสถานะ
  const filterByStatus = (status) => {
    setStatusFilter(status);
    setShowStatusDropdown(false);
    
    if (status === 'all') {
      setFilteredOrders(orders);
    } else {
      // กรองตามสถานะที่เลือก
      let filtered = [];
      
      switch(status) {
        case 'awaiting_payment':
          filtered = orders.filter(order => order.OrderStatus === 'awaiting_payment');
          break;
        case 'pending_verification':
          filtered = orders.filter(order => order.OrderStatus === 'pending_verification');
          break;
        case 'payment_verified':
          filtered = orders.filter(order => order.OrderStatus === 'payment_verified');
          break;
        case 'processing':
          filtered = orders.filter(order => order.OrderStatus === 'processing');
          break;
        case 'completed':
          filtered = orders.filter(order => order.OrderStatus === 'completed');
          break;
        case 'cancelled':
          filtered = orders.filter(order => order.OrderStatus === 'cancelled');
          break;
        default:
          filtered = orders;
      }
      
      setFilteredOrders(filtered);
    }
  };

  // ฟังก์ชันสำหรับการค้นหาตาม TrackingNumber
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      // ถ้าไม่มีคำค้นหา ให้แสดงตามสถานะที่กรองไว้
      filterByStatus(statusFilter);
      return;
    }
    
    // กรองข้อมูลตามคำค้นหาและสถานะที่เลือกไว้
    let filtered = orders;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.OrderStatus === statusFilter);
    }
    
    // กรองตาม TrackingNumber
    filtered = filtered.filter(order => 
      order.TrackingNumber.toLowerCase().includes(query.toLowerCase())
    );
    
    setFilteredOrders(filtered);
  };

  // ฟังก์ชันสำหรับการนำทางไปยังหน้ารายละเอียด Order
  const navigateToOrderDetail = (orderId) => {
    router.push(`/dashboard/${orderId}`);
  };

  // แปลงสถานะเป็นภาษาไทย
  const getThaiStatus = (status) => {
    switch(status) {
      case 'awaiting_payment':
        return 'รอการชำระเงิน';
      case 'pending_verification':
        return 'รอการตรวจสอบการชำระเงิน';
      case 'payment_verified':
        return 'ยืนยันการชำระเงินแล้ว';
      case 'processing':
        return 'กำลังดำเนินการ';
      case 'completed':
        return 'เสร็จสิ้น';
      case 'cancelled':
        return 'ยกเลิก';
      default:
        return status;
    }
  };

  const getStatusTagColor = (status) => {
    switch(status) {
      case 'awaiting_payment':
        return 'bg-gray-100 text-gray-800';
      case 'pending_verification':
        return 'bg-blue-100 text-blue-800';
      case 'payment_verified':
        return 'bg-cyan-100 text-cyan-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // แสดง Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-indigo-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // แสดงข้อความ Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error}</p>
          <button 
            className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded-md"
            onClick={() => window.location.reload()}
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-6 py-8">
        <h1 className="text-2xl font-medium mb-8">ประวัติการตรวจสอบของคุณ</h1>
        
        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Card 1 - Completed */}
          <div className="bg-indigo-600 rounded-lg p-6 text-white relative overflow-hidden shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-3">
                  <CheckCircleIcon className="h-6 w-6 mr-2" />
                  <span className="text-sm">การตรวจสอบที่เสร็จสิ้น</span>
                </div>
                <h2 className="text-5xl font-bold">{stats.completed}</h2>
              </div>
              <button 
                onClick={() => filterByStatus('completed')}
                className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded-md transition"
              >
                ดูทั้งหมด
              </button>
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-yellow-400 rounded-full -mb-12 -mr-12 opacity-50"></div>
          </div>
          
          {/* Card 2 - Processing */}
          <div className="bg-indigo-600 rounded-lg p-6 text-white relative overflow-hidden shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-3">
                  <ClockIcon className="h-6 w-6 mr-2" />
                  <span className="text-sm">กำลังดำเนินการ</span>
                </div>
                <h2 className="text-5xl font-bold">{stats.processing}</h2>
              </div>
              <button 
                onClick={() => filterByStatus('processing')}
                className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded-md transition"
              >
                ดูทั้งหมด
              </button>
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-yellow-400 rounded-full -mb-12 -mr-12 opacity-50"></div>
          </div>
          
          {/* Card 3 - Awaiting Payment */}
          <div className="bg-indigo-600 rounded-lg p-6 text-white relative overflow-hidden shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-3">
                  <ClockIcon className="h-6 w-6 mr-2" />
                  <span className="text-sm">รอการชำระเงิน</span>
                </div>
                <h2 className="text-5xl font-bold">{stats.awaiting || 0}</h2>
              </div>
              <button 
                onClick={() => filterByStatus('awaiting_payment')}
                className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded-md transition"
              >
                ดูทั้งหมด
              </button>
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-yellow-400 rounded-full -mb-12 -mr-12 opacity-50"></div>
          </div>
        </div>
        
        {/* Add Button */}
        <Link href="/order/new">
          <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-5 py-2 rounded-full font-medium mb-6 flex items-center transition shadow-md">
            <span className="text-2xl mr-1">+</span> เพิ่มการตรวจสอบประวัติใหม่
          </button>
        </Link>
        
        {/* Filter and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Status Filter */}
          <div className="relative w-full md:w-1/3">
            <button 
              className="flex items-center bg-indigo-600 text-white rounded-md px-4 py-2.5 w-full"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
              <span>สถานะ: {statusFilter === 'all' ? 'ทั้งหมด' : getThaiStatus(statusFilter)}</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Status Dropdown */}
            {showStatusDropdown && (
              <div className="absolute z-10 mt-1 bg-white rounded-md shadow-lg w-full py-1 border border-gray-200">
                <button 
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition"
                  onClick={() => filterByStatus('all')}
                >
                  ทั้งหมด
                </button>
                <button 
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition"
                  onClick={() => filterByStatus('awaiting_payment')}
                >
                  รอการชำระเงิน
                </button>
                <button 
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition"
                  onClick={() => filterByStatus('pending_verification')}
                >
                  รอการตรวจสอบการชำระเงิน
                </button>
                <button 
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition"
                  onClick={() => filterByStatus('payment_verified')}
                >
                  ยืนยันการชำระเงินแล้ว
                </button>
                <button 
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition"
                  onClick={() => filterByStatus('processing')}
                >
                  กำลังดำเนินการ
                </button>
                <button 
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition"
                  onClick={() => filterByStatus('completed')}
                >
                  เสร็จสิ้น
                </button>
                <button 
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition"
                  onClick={() => filterByStatus('cancelled')}
                >
                  ยกเลิก
                </button>
              </div>
            )}
          </div>
          
          {/* Search Input */}
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัสการตรวจสอบประวัติ"
              className="w-full border border-gray-300 rounded-md py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              value={searchQuery}
              onChange={handleSearch}
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          
          {/* View All Button */}
          <button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md whitespace-nowrap transition shadow-md"
            onClick={() => filterByStatus('all')}
          >
            ดูประวัติการตรวจสอบทั้งหมด
          </button>
        </div>
        
        {/* Table */}
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200 mb-8 shadow-md">
          {filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-4 px-6 font-medium text-gray-600">รหัสการตรวจสอบประวัติ</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">ประเภท</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">วันที่เริ่ม</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">วันที่เสร็จสิ้น</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">สถานะ</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">ราคารวม</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">การกระทำ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    // สร้างข้อมูลวันที่จากฟิลด์ createdAt
                    const createdDate = new Date(order.createdAt);
                    const formattedCreatedDate = `${createdDate.getDate().toString().padStart(2, '0')} ${
                      ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][createdDate.getMonth()]
                    } ${createdDate.getFullYear() + 543}`;
                    
                    // วันที่เสร็จสิ้น (ถ้ามี)
                    let completedDate = null;
                    if (order.OrderStatus === 'completed' && order.updatedAt) {
                      const updatedDate = new Date(order.updatedAt);
                      completedDate = `${updatedDate.getDate().toString().padStart(2, '0')} ${
                        ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][updatedDate.getMonth()]
                      } ${updatedDate.getFullYear() + 543}`;
                    }
                    
                    return (
                      <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="py-4 px-6 font-medium">{order.TrackingNumber}</td>
                        <td className="py-4 px-6">
                          {order.OrderType === 'company' ? 'บริษัท' : 'บุคคล'}
                        </td>
                        <td className="py-4 px-6">{formattedCreatedDate}</td>
                        <td className="py-4 px-6">{completedDate || 'ไม่มี'}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusTagColor(order.OrderStatus)}`}>
                            {getThaiStatus(order.OrderStatus)}
                          </span>
                        </td>
                        <td className="py-4 px-6">{order.TotalPrice.toLocaleString()} บาท</td>
                        <td className="py-4 px-6">
                          <button 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded-md text-sm transition"
                            onClick={() => navigateToOrderDetail(order._id)}
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">ไม่พบข้อมูลการตรวจสอบที่ตรงกับเงื่อนไข</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}