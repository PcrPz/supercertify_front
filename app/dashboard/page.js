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
  MagnifyingGlassIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  XCircleIcon
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
    pending_verification: 0,
    payment_verified: 0,
    processing: 0,
    completed: 0
  });

  // โหลดข้อมูล Orders ทั้งหมดของ User
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // เรียกใช้ API Service เพื่อดึงข้อมูล Orders ของ User ปัจจุบัน
        const response = await getMyOrders();
        
        // ตรวจสอบว่า response เป็น array และมีข้อมูล
        if (Array.isArray(response) && response.length > 0) {
          setOrders(response);
          setFilteredOrders(response);
          
          // คำนวณสถิติตามสถานะ
          const pending_verification = response.filter(order => order.OrderStatus === 'pending_verification').length;
          const payment_verified = response.filter(order => order.OrderStatus === 'payment_verified').length;
          const processing = response.filter(order => order.OrderStatus === 'processing').length;
          const completed = response.filter(order => order.OrderStatus === 'completed').length;
          
          setStats({
            pending_verification,
            payment_verified,
            processing,
            completed
          });
        } else {
          // กรณีไม่มีข้อมูล
          setOrders([]);
          setFilteredOrders([]);
          setStats({
            pending_verification: 0,
            payment_verified: 0,
            processing: 0,
            completed: 0
          });
        }
        
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

  // ฟังก์ชันสำหรับการค้นหาตาม TrackingNumber (ปรับปรุง)
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      // ถ้าไม่มีคำค้นหา ให้แสดงตามสถานะที่กรองไว้ (คงเดิม)
      filterByStatus(statusFilter);
      return;
    }
    
    // กรองข้อมูลตามคำค้นหา (คงเดิม)
    let filtered = orders;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.OrderStatus === statusFilter);
    }
    
    // กรองตาม TrackingNumber (คงเดิม)
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
        return 'รอตรวจสอบการชำระเงิน';
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

  // ฟังก์ชันสำหรับสีของแท็กสถานะ
  const getStatusTagColor = (status) => {
    switch(status) {
      case 'awaiting_payment':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'pending_verification':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'payment_verified':
        return 'bg-cyan-100 text-cyan-800 border border-cyan-200';
      case 'processing':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  // ฟังก์ชันสำหรับการแสดงไอคอนตามสถานะ
  const getStatusIcon = (status) => {
    switch(status) {
      case 'awaiting_payment':
        return <BanknotesIcon className="h-3.5 w-3.5" />;
      case 'pending_verification':
        return <ClockIcon className="h-3.5 w-3.5" />;
      case 'payment_verified':
        return <DocumentCheckIcon className="h-3.5 w-3.5" />;
      case 'processing':
        return <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />;
      case 'completed':
        return <CheckCircleIcon className="h-3.5 w-3.5" />;
      case 'cancelled':
        return <XCircleIcon className="h-3.5 w-3.5" />;
      default:
        return <ClockIcon className="h-3.5 w-3.5" />;
    }
  };

  // ฟังก์ชันสำหรับคำอธิบายสถานะ (tooltip)
  const getStatusDescription = (status) => {
    switch(status) {
      case 'awaiting_payment':
        return 'รอรับการชำระเงิน กรุณาชำระเงินเพื่อดำเนินการต่อไป';
      case 'pending_verification':
        return 'ระบบกำลังตรวจสอบการชำระเงินของคุณ กรุณารอการยืนยัน';
      case 'payment_verified':
        return 'ยืนยันการชำระเงินเรียบร้อยแล้ว กำลังเตรียมการดำเนินการต่อไป';
      case 'processing':
        return 'เจ้าหน้าที่กำลังดำเนินการตรวจสอบข้อมูลของคุณ';
      case 'completed':
        return 'การตรวจสอบเสร็จสิ้นแล้ว คุณสามารถดูรายงานผลการตรวจสอบได้';
      case 'cancelled':
        return 'คำขอนี้ถูกยกเลิกแล้ว';
      default:
        return '';
    }
  };

  // ฟังก์ชันตรวจสอบความสำคัญของสถานะ
  const getStatusPriority = (status) => {
    switch(status) {
      case 'awaiting_payment':
        return 'high'; // ความสำคัญสูง
      case 'pending_verification':
        return 'medium'; // ความสำคัญปานกลาง
      case 'payment_verified':
        return 'low'; // ความสำคัญต่ำ
      case 'processing':
        return 'medium';
      case 'completed':
        return 'none'; // ไม่มีความสำคัญ (เสร็จสิ้นแล้ว)
      case 'cancelled':
        return 'none';
      default:
        return 'medium';
    }
  };

  // แสดง Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#444DDA] mx-auto"></div>
          <p className="mt-4 text-[#444DDA]">กำลังโหลดข้อมูล...</p>
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
            className="mt-6 bg-[#444DDA] text-white px-4 py-2 rounded-md"
            onClick={() => window.location.reload()}
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // กรณีไม่มี Order เลย
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 lg:px-6 py-8">
          
          <div className="flex flex-col items-center justify-center py-16 px-4">
            {/* ใช้รูปภาพ No_Order.png */}
            <img 
              src="/No_Order.svg" 
              alt="ไม่มีข้อมูลการตรวจสอบ" 
              className="w-72 h-auto mb-8"
            />
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">ยังไม่มีประวัติการตรวจสอบ</h2>
            <p className="text-gray-600 mb-8 text-center max-w-lg">
              คุณยังไม่มีรายการตรวจสอบประวัติ เริ่มต้นตรวจสอบประวัติแรกของคุณเพื่อดูผลลัพธ์และติดตามความคืบหน้า
            </p>
            
            {/* ปุ่มที่สวยงาม */}
          <button 
            className="bg-[#444DDA] hover:bg-[#3a41b8] text-white text-lg px-8 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2 transform hover:translate-y-[-2px]"
            onClick={() => router.push('/background-check')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <span>เริ่มการตรวจสอบประวัติใหม่</span>
          </button>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Card 1 - รอการตรวจสอบการชำระเงิน */}
          <div className="bg-[#444DDA] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <ClockIcon className="h-5 w-5" />
                </div>
                <span className="text-[15px] font-medium">รอตรวจสอบการชำระเงิน</span>
              </div>
              <button 
                className="bg-white/20 rounded-full p-1.5 hover:bg-white/30 transition-all"
                onClick={() => filterByStatus('pending_verification')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col">
              <span className="text-6xl font-bold">{stats.pending_verification}</span>
              {stats.pending_verification === 0 && (
                <span className="text-xs text-white/70 mt-1">ไม่มีรายการ</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-28 h-28 bg-yellow-400 rounded-full -mb-8 -mr-8"></div>
          </div>
          
          {/* Card 2 - ยืนยันการชำระเงินแล้ว */}
          <div className="bg-[#444DDA] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <DocumentCheckIcon className="h-5 w-5" />
                </div>
                <span className="text-[15px] font-medium">ยืนยันการชำระเงินแล้ว</span>
              </div>
              <button 
                className="bg-white/20 rounded-full p-1.5 hover:bg-white/30 transition-all"
                onClick={() => filterByStatus('payment_verified')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col">
              <span className="text-6xl font-bold">{stats.payment_verified}</span>
              {stats.payment_verified === 0 && (
                <span className="text-xs text-white/70 mt-1">ไม่มีรายการ</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-28 h-28 bg-yellow-400 rounded-full -mb-8 -mr-8"></div>
          </div>
          
          {/* Card 3 - กำลังดำเนินการ */}
          <div className="bg-[#444DDA] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                </div>
                <span className="text-[15px] font-medium">กำลังดำเนินการ</span>
              </div>
              <button 
                className="bg-white/20 rounded-full p-1.5 hover:bg-white/30 transition-all"
                onClick={() => filterByStatus('processing')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col">
              <span className="text-6xl font-bold">{stats.processing}</span>
              {stats.processing === 0 && (
                <span className="text-xs text-white/70 mt-1">ไม่มีรายการ</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-28 h-28 bg-yellow-400 rounded-full -mb-8 -mr-8"></div>
          </div>
          
          {/* Card 4 - เสร็จสิ้น */}
          <div className="bg-[#444DDA] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <CheckCircleIcon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">เสร็จสิ้น</span>
              </div>
              <button 
                className="bg-white/20 rounded-full p-1.5 hover:bg-white/30 transition-all"
                onClick={() => filterByStatus('completed')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col">
              <span className="text-6xl font-bold">{stats.completed}</span>
              {stats.completed === 0 && (
                <span className="text-xs text-white/70 mt-1">ไม่มีรายการ</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-28 h-28 bg-yellow-400 rounded-full -mb-8 -mr-8"></div>
          </div>
        </div>
        
        {/* Add Button */}
        <button 
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-5 py-2 rounded-full font-medium mb-6 flex items-center transition shadow-md hover:shadow-lg"
          onClick={() => router.push('/background-check')}
        >
          <span className="text-2xl mr-1">+</span> เพิ่มการตรวจสอบประวัติใหม่
        </button>
        
        {/* Filter and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Status Filter */}
          <div className="relative w-full md:w-1/3">
            <button 
              className="flex items-center bg-[#444DDA] hover:bg-[#3B43BF] text-white rounded-md px-4 py-2.5 w-full transition-all duration-300"
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
                {/* แถบสถานะทั้งหมด */}
                <button 
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition flex items-center"
                  onClick={() => filterByStatus('all')}
                >
                  <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
                  ทั้งหมด
                </button>
                
                {/* แถบสถานะ - รอการชำระเงิน */}
                <button 
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition flex items-center"
                  onClick={() => filterByStatus('awaiting_payment')}
                >
                  <span className="h-2 w-2 rounded-full bg-orange-500 mr-2"></span>
                  <BanknotesIcon className="h-4 w-4 text-orange-600 mr-2" />
                  รอการชำระเงิน
                </button>
                
                {/* แถบสถานะ - รอการตรวจสอบการชำระเงิน */}
                <button 
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition flex items-center"
                  onClick={() => filterByStatus('pending_verification')}
                >
                  <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                  <ClockIcon className="h-4 w-4 text-blue-600 mr-2" />
                  รอการตรวจสอบการชำระเงิน
                </button>
                
                {/* แถบสถานะ - ยืนยันการชำระเงินแล้ว */}
                <button 
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition flex items-center"
                  onClick={() => filterByStatus('payment_verified')}
                >
                  <span className="h-2 w-2 rounded-full bg-cyan-500 mr-2"></span>
                  <DocumentCheckIcon className="h-4 w-4 text-cyan-600 mr-2" />
                  ยืนยันการชำระเงินแล้ว
                </button>
                
                {/* แถบสถานะ - กำลังดำเนินการ */}
                <button 
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition flex items-center"
                  onClick={() => filterByStatus('processing')}
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500 mr-2"></span>
                  <AdjustmentsHorizontalIcon className="h-4 w-4 text-amber-600 mr-2" />
                  กำลังดำเนินการ
                </button>
                
                {/* แถบสถานะ - เสร็จสิ้น */}
                <button 
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition flex items-center"
                  onClick={() => filterByStatus('completed')}
                >
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                  เสร็จสิ้น
                </button>
                
                {/* แถบสถานะ - ยกเลิก */}
                <button 
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-100 transition flex items-center"
                  onClick={() => filterByStatus('cancelled')}
                >
                  <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                  <XCircleIcon className="h-4 w-4 text-red-600 mr-2" />
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
              className="w-full border border-gray-300 rounded-md py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-[#444DDA]"
              value={searchQuery}
              onChange={handleSearch}
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          
          {/* View All Button */}
          <button 
            className=" bg-[#444DDA] hover:bg-[#3B43BF] text-white px-4 py-2 rounded-md whitespace-nowrap transition shadow-md hover:shadow-lg"
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
                        <td className="py-4 px-6">{completedDate || '-'}</td>
                        <td className="py-4 px-6">
                          <div className="relative group">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusTagColor(order.OrderStatus)}`}>
                              {getStatusPriority(order.OrderStatus) === 'high' && (
                                <span className="relative flex h-2 w-2 mr-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                              )}
                              <span className="mr-1.5">{getStatusIcon(order.OrderStatus)}</span>
                              {getThaiStatus(order.OrderStatus)}
                            </span>
                            {/* Tooltip */}
                            <div className="absolute left-0 bottom-full mb-2 w-48 bg-gray-800 text-white text-xs rounded p-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                              {getStatusDescription(order.OrderStatus)}
                              <div className="absolute left-4 bottom-0 h-2 w-2 bg-gray-800 transform rotate-45 translate-y-1"></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">{order.TotalPrice.toLocaleString()} บาท</td>
                        <td className="py-4 px-6">
                          <button 
                            className="bg-[#444DDA] hover:bg-[#3B43BF] text-white px-4 py-1 rounded-md text-sm transition hover:shadow-md"
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
            <div className="py-16 px-4 text-center">
              {/* ใช้รูปภาพ No_Data.svg */}
              <img 
                src="/No_Data.svg" 
                alt="ไม่พบข้อมูล" 
                className="w-48 h-48 mx-auto mb-6"
              />
              
              <h3 className="text-xl font-medium text-gray-700 mb-2">ไม่พบข้อมูลการตรวจสอบ</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                {statusFilter !== 'all' 
                  ? `ไม่มีรายการตรวจสอบที่มีสถานะ "${getThaiStatus(statusFilter)}"`
                  : searchQuery 
                    ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา' 
                    : 'ยังไม่มีรายการตรวจสอบประวัติที่ตรงกับเงื่อนไข'
                }
              </p>
              
          {/* ส่วนโค้ดที่ปรับปรุงสำหรับปุ่มล้างการค้นหา */}
          {statusFilter !== 'all' ? (
            <button 
              onClick={() => filterByStatus('all')}
              className="bg-[#444DDA] text-white px-4 py-2 rounded-lg hover:bg-[#3a41b8] transition shadow-md"
            >
              ดูรายการทั้งหมด
            </button>
          ) : searchQuery ? (
            <button 
              onClick={() => {
                setSearchQuery('');
                filterByStatus('all'); // เพิ่มการรีเซ็ตสถานะกลับเป็น 'all'
              }}
              className="bg-[#444DDA] text-white px-4 py-2 rounded-lg hover:bg-[#3a41b8] transition shadow-md"
            >
              ล้างการค้นหา
            </button>
          ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}