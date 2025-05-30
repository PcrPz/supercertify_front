'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllOrders } from '@/services/apiService';
import Link from 'next/link';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationCircleIcon, 
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  DocumentCheckIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // เริ่มต้นเป็น 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0); // เริ่มต้นไม่เลือกขั้นตอนไหน
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // ข้อมูลขั้นตอนในกระบวนการ
  const steps = [
    { id: 1, name: 'คำขอความยินยอม', status: 'awaiting_payment' },
    { id: 2, name: 'การชำระเงิน', status: 'pending_verification' },
    { id: 3, name: 'ยืนยันการชำระเงิน', status: 'payment_verified' },
    { id: 4, name: 'รอดำเนินการ', status: 'processing' },
    { id: 5, name: 'สำเร็จ', status: 'completed' }
  ];
  
  // รายการสถานะทั้งหมดสำหรับตัวกรอง
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
        
        // เรียงลำดับจากใหม่ไปเก่า
        const sortedOrders = ordersData.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        setOrders(sortedOrders);
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
  
  // เปลี่ยนสถานะกรองเมื่อเลือกขั้นตอนใหม่
  useEffect(() => {
    const selectedStep = steps.find(step => step.id === activeStep);
    if (selectedStep) {
      const firstStatus = selectedStep.status.split(',')[0];
      setStatusFilter(firstStatus);
    }
  }, [activeStep]);

  // เปลี่ยนขั้นตอนเมื่อเลือกตัวกรองสถานะใหม่
  useEffect(() => {
    if (statusFilter === 'all') {
      return;
    }
    
    const matchedStep = steps.find(step => {
      if (step.status.includes(',')) {
        const stepStatuses = step.status.split(',');
        return stepStatuses.includes(statusFilter);
      } else {
        return step.status === statusFilter;
      }
    });
    
    if (matchedStep) {
      setActiveStep(matchedStep.id);
    }
  }, [statusFilter]);
  
  // กรองข้อมูลตาม status และคำค้นหา
  const filteredOrders = orders.filter(order => {
    let matchesStatus = false;
    
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else {
      const selectedStep = steps.find(step => step.id === activeStep);
      if (selectedStep && selectedStep.status.includes(',')) {
        const stepStatuses = selectedStep.status.split(',');
        matchesStatus = stepStatuses.includes(order.OrderStatus);
      } else {
        matchesStatus = order.OrderStatus === statusFilter;
      }
    }
    
    const matchesSearch = searchTerm === '' || 
      (order.TrackingNumber && order.TrackingNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.user && order.user.username && order.user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.user && order.user.email && order.user.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
    return matchesStatus && matchesSearch;
  });
  
  // แสดงวันที่ในรูปแบบที่อ่านง่าย
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    
    const date = new Date(dateString);
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear() + 543;
    
    return `${day} ${month} ${year}`;
  };
  
  // แสดงสถานะในรูปแบบที่อ่านง่าย
  const getStatusLabel = (status) => {
    const statusMap = {
      'awaiting_payment': 'รอชำระเงิน',
      'pending_verification': 'รอตรวจสอบการชำระเงิน',
      'payment_verified': 'ยืนยันการชำระเงินแล้ว',
      'processing': 'กำลังดำเนินการ',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
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

  // แสดงสถานะในรูปแบบ badge (เอาจุดสีกลับมา)
  const getStatusBadge = (status) => {
    const statusInfo = getStatusTagColor(status);
    const statusText = getStatusLabel(status);
    
    // สีจุดตามสถานะ
    const getDotColor = (status) => {
      switch(status) {
        case 'awaiting_payment': return 'bg-orange-500';
        case 'pending_verification': return 'bg-blue-500';
        case 'payment_verified': return 'bg-cyan-500';
        case 'processing': return 'bg-amber-500';
        case 'completed': return 'bg-green-500';
        case 'cancelled': return 'bg-red-500';
        default: return 'bg-gray-500';
      }
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${statusInfo}`}>
        <span className={`h-2 w-2 rounded-full mr-2 ${getDotColor(status)}`}></span>
        <span className="mr-1.5">{getStatusIcon(status)}</span>
        {statusText}
      </span>
    );
  };

  // คำนวณจำนวน orders ในแต่ละขั้นตอน
  const getStepStats = () => {
    return steps.map(step => {
      const count = orders.filter(order => order.OrderStatus === step.status).length;
      return {
        ...step,
        count: count
      };
    });
  };
  
  // เลือกขั้นตอนใหม่
  const handleStepClick = (stepId) => {
    setActiveStep(stepId);
    
    const selectedStep = steps.find(step => step.id === stepId);
    if (selectedStep) {
      const firstStatus = selectedStep.status.split(',')[0];
      setStatusFilter(firstStatus);
    }
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
    <div className="container mx-auto p-6 bg-gray-50">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">คำขอตรวจสอบประวัติ</h1>
      
      {/* Step Cards พร้อมเส้น Progress */}
      <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
        {/* เส้น Progress */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center w-full max-w-4xl relative">
            {/* เส้นพื้นหลัง */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2"></div>
            
            {/* เส้นความคืบหน้า */}
            <div 
              className="absolute top-1/2 left-0 h-1 bg-[#444DDA] -translate-y-1/2 transition-all duration-500"
              style={{ 
                width: (statusFilter === 'all' || activeStep === 0) ? '0%' : `${((activeStep - 1) / (steps.length - 1)) * 100}%` 
              }}
            ></div>
            
            {/* จุดแต่ละขั้นตอน */}
            {steps.map((step, index) => {
              const isActive = step.id === activeStep && statusFilter !== 'all' && activeStep !== 0;
              const isCompleted = step.id < activeStep && statusFilter !== 'all' && activeStep !== 0;
              const position = (index / (steps.length - 1)) * 100;
              
              return (
                <div 
                  key={step.id}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                  style={{ left: `${position}%` }}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-4 cursor-pointer transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#444DDA] border-[#444DDA]' 
                        : isCompleted 
                          ? 'bg-[#444DDA] border-[#444DDA]' 
                          : 'bg-white border-gray-300'
                    }`}
                    onClick={() => handleStepClick(step.id)}
                  >
                    {isCompleted && (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {getStepStats().map((step, index) => {
            const isActive = step.id === activeStep && statusFilter !== 'all' && activeStep !== 0;
            const isCompleted = step.id < activeStep && statusFilter !== 'all' && activeStep !== 0;
            // เมื่อเลือก "ทั้งหมด" ให้ทุกการ์ดเป็นสีขาว
            const shouldHighlight = statusFilter !== 'all' && activeStep !== 0 && (isActive || isCompleted);
            
            return (
              <div 
                key={step.id} 
                className={`rounded-xl p-3 border-2 cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-105 min-h-[110px] ${
                  shouldHighlight
                    ? 'border-[#444DDA] bg-gradient-to-br from-[#444DDA] to-[#3B43BF] text-white shadow-md' 
                    : 'border-gray-400 bg-white text-gray-700 hover:border-gray-500 hover:bg-gray-50'
                }`}
                onClick={() => handleStepClick(step.id)}
              >
                {/* หมายเลขขั้นตอน */}
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    shouldHighlight
                      ? 'bg-white text-[#444DDA] border-white' 
                      : 'bg-gray-500 text-white border-gray-500'
                  }`}>
                    {isCompleted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold flex items-center justify-center">{step.id}</span>
                    )}
                  </div>
                  
                  {/* Badge แสดงจำนวน orders - แสดงเสมอ */}
                  <div className={`text-xs rounded-full px-2 py-1 font-bold flex items-center gap-1 ${
                    shouldHighlight 
                      ? 'bg-[#FFC107] text-[#444DDA]' 
                      : 'bg-gray-400 text-white'
                  }`}>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zM8 6a2 2 0 114 0v1H8V6zm0 3a1 1 0 012 0 1 1 0 11-2 0zm4 0a1 1 0 012 0 1 1 0 11-2 0z" clipRule="evenodd"/>
                    </svg>
                    {step.count}
                  </div>
                </div>
                
                {/* ชื่อขั้นตอน */}
                <div className="mb-2">
                  <div className={`text-xs font-medium mb-1 ${
                    shouldHighlight ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    ขั้นตอนที่ {step.id}
                  </div>
                  <div className={`flex items-center justify-between ${
                    shouldHighlight ? 'text-white' : 'text-gray-800'
                  }`}>
                    <div className="text-sm font-bold">
                      {step.name}
                    </div>
                    {/* ไอคอนสถานะ - ชิดขวาตรงกับบรรทัดชื่อสถานะ */}
                    <div className={`p-1 rounded-full ${
                      shouldHighlight ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      <div className={`w-4 h-4 flex items-center justify-center ${shouldHighlight ? 'text-white' : 'text-gray-600'}`}>
                        {getStatusIcon(step.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* ตัวกรองและการค้นหา - ใช้สไตล์แบบ User Dashboard */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Status Filter */}
        <div className="relative w-full md:w-1/3">
          <button 
            className="flex items-center bg-[#444DDA] hover:bg-[#3B43BF] text-white rounded-md px-4 py-2.5 w-full transition-all duration-300"
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            <span>สถานะ: {statusFilter === 'all' ? 'ทั้งหมด' : getStatusLabel(statusFilter)}</span>
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
                onClick={() => {
                  setStatusFilter('all');
                  setShowStatusDropdown(false);
                }}
              >
                ทั้งหมด
              </button>
              
              {statusList.filter(status => status.id !== 'all').map(status => (
                <button 
                  key={status.id}
                  className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 transition flex items-center ${
                    statusFilter === status.id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => {
                    setStatusFilter(status.id);
                    setShowStatusDropdown(false);
                  }}
                >
                  {status.id === 'awaiting_payment' && <BanknotesIcon className="h-4 w-4 text-orange-600 mr-2" />}
                  {status.id === 'pending_verification' && <ClockIcon className="h-4 w-4 text-blue-600 mr-2" />}
                  {status.id === 'payment_verified' && <DocumentCheckIcon className="h-4 w-4 text-cyan-600 mr-2" />}
                  {status.id === 'processing' && <AdjustmentsHorizontalIcon className="h-4 w-4 text-amber-600 mr-2" />}
                  {status.id === 'completed' && <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />}
                  {status.id === 'cancelled' && <XCircleIcon className="h-4 w-4 text-red-600 mr-2" />}
                  {status.name}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Search Input */}
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="ค้นหาด้วยรหัสการตรวจสอบประวัติ"
            className="w-full border border-gray-300 rounded-md py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-[#444DDA]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>
        
        {/* View All Button */}
        <button 
          onClick={() => setStatusFilter('all')}
          className=" bg-[#444DDA] hover:bg-[#3B43BF] text-white px-4 py-2 rounded-md whitespace-nowrap transition shadow-md hover:shadow-lg"
        >
          ดูประวัติการตรวจสอบทั้งหมด
        </button>
      </div>
      
      {/* ตารางคำสั่งซื้อ */}
      <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-md">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 font-medium text-gray-600">รหัสการตรวจสอบประวัติ</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">ประเภท</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">วันที่เริ่ม</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">ชื่อเจ้าของ</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">สถานะ</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">ราคารวม</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-600">การกระทำ</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="py-4 px-6 font-medium">{order.TrackingNumber || 'SCT3314482764'}</td>
                    <td className="py-4 px-6">
                      {order.OrderType === 'personal' ? 'บุคคล' : 'บริษัท'}
                    </td>
                    <td className="py-4 px-6">{formatDate(order.createdAt) || '20 พ.ค. 2568'}</td>
                    <td className="py-4 px-6">{order.user?.username || order.user?.fullName || 'เอนฎา วิลัย'}</td>
                    <td className="py-4 px-6">
                      {getStatusBadge(order.OrderStatus || 'awaiting_payment')}
                    </td>
                    <td className="py-4 px-6 font-medium">{(order.TotalPrice || 3000).toLocaleString()} บาท</td>
                    <td className="py-4 px-6">
                      <Link 
                        href={`/admin/dashboard/${order._id}`}
                        className="bg-[#444DDA] hover:bg-[#3B43BF] text-white px-4 py-1.5 rounded-lg text-sm font-medium transition hover:shadow-md"
                      >
                        ดูรายละเอียด
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 px-4 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-700 mb-2">ไม่พบข้อมูลการตรวจสอบ</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {statusFilter !== 'all' 
                ? `ไม่มีรายการตรวจสอบที่มีสถานะ "${getStatusLabel(statusFilter)}"`
                : searchTerm 
                  ? 'ไม่พบข้อมูลที่ตรงกับการค้นหา' 
                  : 'ยังไม่มีรายการตรวจสอบประวัติที่ตรงกับเงื่อนไข'
              }
            </p>
            
            {/* ปุ่มตัวเลือกเมื่อไม่พบข้อมูล */}
            {statusFilter !== 'all' ? (
              <button 
                onClick={() => setStatusFilter('all')}
                className="bg-[#444DDA] text-white px-4 py-2 rounded-lg hover:bg-[#3a41b8] transition shadow-md"
              >
                ดูรายการทั้งหมด
              </button>
            ) : searchTerm ? (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="bg-[#444DDA] text-white px-4 py-2 rounded-lg hover:bg-[#3a41b8] transition shadow-md"
              >
                ล้างการค้นหา
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}