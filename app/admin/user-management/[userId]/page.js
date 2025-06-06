"use client"
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserProfile } from '@/services/profileApi';
import { getOrderCountByUser, getUserOrders } from '@/services/apiService';
import { 
  ArrowLeftIcon, UserIcon, EnvelopeIcon, PhoneIcon, BuildingOfficeIcon,
  CalendarDaysIcon, ShoppingBagIcon, CreditCardIcon, KeyIcon, 
  ExclamationCircleIcon, ClockIcon, CheckCircleIcon, XCircleIcon,
  ArrowTopRightOnSquareIcon, PencilSquareIcon
} from '@heroicons/react/24/outline';
import EditUserModal from '@/components/admin/EditUserModal'; // นำเข้า Modal ที่สร้างขึ้นใหม่
import PromoteAdminModal from '@/components/admin/PromoteAdminModal'; // นำเข้า Modal สำหรับเพิ่มสิทธิ์ผู้ดูแลระบบ

// สีหลักของระบบ
const COLORS = {
  primary: "#444DDA",
  primaryDark: "#343EB0",
  primaryLight: "#ECEEFE",
  secondary: "#FFC107",
  white: "#FFFFFF",
  danger: "#E53E3E",
  success: "#38A169"
};

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.userId;
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // เพิ่ม state สำหรับ modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  
  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        const userResult = await getUserProfile(userId);
        
        if (userResult) {
          setUser(userResult);
          
          try {
            const orderCounts = await getOrderCountByUser();
            setOrderCount(orderCounts[userId] || 0);
          } catch (orderError) {
            console.error("Error fetching order count:", orderError);
          }
        } else {
          setError("ไม่พบข้อมูลผู้ใช้");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) {
      fetchUserData();
    }
  }, [userId]);
  
  // ฟังก์ชันสำหรับอัพเดทข้อมูลผู้ใช้หลังจาก modal ทำงานเสร็จ
  const handleUserUpdated = (updatedUserData) => {
    setUser(updatedUserData);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = new Intl.DateTimeFormat('th-TH', { month: 'long' }).format(date);
      const year = date.getFullYear();
      const time = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      
      return `${day} ${month} ${year} ${time}`;
    } catch (err) {
      console.error("Error formatting date:", err);
      return '-';
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
               style={{ borderColor: COLORS.primary }}></div>
          <p className="mt-4 text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-red-500 p-6 text-white">
            <ExclamationCircleIcon className="h-12 w-12 mb-2" />
            <h2 className="text-xl font-bold">เกิดข้อผิดพลาด</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-6">{error}</p>
            <button
              onClick={() => router.push('/admin/user-management')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              กลับไปหน้าจัดการผู้ใช้งาน
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-yellow-500 p-6 text-white">
            <ExclamationCircleIcon className="h-12 w-12 mb-2" />
            <h2 className="text-xl font-bold">ไม่พบข้อมูล</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-6">ไม่พบข้อมูลผู้ใช้งานที่ต้องการ</p>
            <button
              onClick={() => router.push('/admin/user-management')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              กลับไปหน้าจัดการผู้ใช้งาน
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <Link 
            href="/admin/user-management" 
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="bg-white p-2 rounded-full shadow-sm mr-3">
              <ArrowLeftIcon className="h-5 w-5" />
            </span>
            <span className="font-medium">กลับไปหน้าจัดการผู้ใช้งาน</span>
          </Link>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {/* User Profile Section */}
              <div className="relative">
                {/* Banner Background */}
                <div 
                  className="h-32 w-full"
                  style={{ background: `linear-gradient(to right, ${COLORS.primary}, ${COLORS.primaryDark})` }}
                ></div>
                
                {/* Profile Picture */}
                <div className="absolute top-16 inset-x-0 flex justify-center">
                  {user.profilePicture ? (
                    <div className="ring-4 ring-white rounded-full shadow-lg">
                      <img 
                        src={user.profilePicture} 
                        alt={user.username || 'User profile'} 
                        className="w-28 h-28 rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 ring-4 ring-white shadow-lg">
                      <span style={{ color: COLORS.primary }} className="font-bold text-4xl">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
               {/* User Info */}
              <div className="pt-20 px-6 pb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">{user.username || 'ไม่ระบุชื่อผู้ใช้'}</h1>
                <p className="text-gray-500 mb-4">{user.email || 'ไม่ระบุอีเมล'}</p>
                
                <div className="flex justify-center mb-6">
                  <span 
                    className="inline-block px-4 py-1.5 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: user.role === 'admin' ? COLORS.secondary : COLORS.primary,
                      color: user.role === 'admin' ? '#000' : '#fff'
                    }}
                  >
                    {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                  </span>
                </div>
                
                <div className="rounded-xl shadow-sm p-6 mb-6 bg-[#444DDA] text-white">
                <div className="flex items-center mb-4">
                    <ShoppingBagIcon className="h-6 w-6 mr-2.5 mb-2" />
                    <h3 className="text-lg font-medium">คำสั่งซื้อทั้งหมด</h3>
                </div>
                <div className="flex items-baseline mb-6">
                    <span className="text-4xl font-bold">{orderCount}</span>
                    <span className="ml-2 text-lg opacity-90">รายการ</span>
                </div>
                <button 
                    onClick={() => setActiveTab('orders')}
                    className="w-full px-4 py-2.5 bg-white text-[#444DDA] rounded-lg font-medium hover:bg-opacity-90 flex items-center justify-center"
                >
                    <ShoppingBagIcon className="h-4 w-4 mr-2" />
                    ดูรายละเอียดคำสั่งซื้อ
                </button>
                </div>
                
                {/* Registration Info */}
                <div className="bg-gray-100 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-600">สมัครเมื่อ</p>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{formatDate(user.createdAt)}</p>
                </div>
                
                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center shadow-sm"
                  >
                    <PencilSquareIcon className="h-4 w-4 mr-2" />
                    แก้ไขข้อมูลผู้ใช้
                  </button>
                  
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => setIsPromoteModalOpen(true)}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg font-medium hover:from-yellow-500 hover:to-yellow-600 transition-colors flex items-center justify-center shadow-sm"
                    >
                      <KeyIcon className="h-4 w-4 mr-2" />
                      เพิ่มสิทธิ์ผู้ดูแลระบบ
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
         {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tabs navigation */}
            <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'profile' 
                      ? 'border-b-2 border-blue-600 text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <UserIcon className="h-5 w-5" />
                  ข้อมูลโปรไฟล์
                </button>
                
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'orders' 
                      ? 'border-b-2 border-blue-600 text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ShoppingBagIcon className="h-5 w-5" />
                  คำสั่งซื้อ
                </button>
              </div>
            </div>
            
            {/* Content based on active tab */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {activeTab === 'profile' && (
                <ProfileTabContent 
                  user={user} 
                  formatDate={formatDate} 
                  onEditClick={() => setIsEditModalOpen(true)}
                  colors={COLORS} 
                />
              )}
              
              {activeTab === 'orders' && (
                <OrdersTabContent userId={userId} colors={COLORS} />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal แก้ไขข้อมูลผู้ใช้ */}
      <EditUserModal 
        user={user}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUserUpdated={handleUserUpdated}
      />
      
      {/* Modal ยืนยันการเพิ่มสิทธิ์ผู้ดูแลระบบ */}
      <PromoteAdminModal
        user={user}
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}

// Profile Tab Content
function ProfileTabContent({ user, formatDate, onEditClick, colors }) {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-gray-800">ข้อมูลส่วนตัว</h2>
        <button
          onClick={onEditClick} // เปลี่ยนจาก router.push เป็นการเปิด modal
          className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <PencilSquareIcon className="h-4 w-4 mr-2" />
          แก้ไข
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard icon={<UserIcon className="h-5 w-5 text-gray-400" />} label="ชื่อผู้ใช้" value={user.username || '-'} />
        <InfoCard icon={<EnvelopeIcon className="h-5 w-5 text-gray-400" />} label="อีเมล" value={user.email || '-'} />
        <InfoCard icon={<PhoneIcon className="h-5 w-5 text-gray-400" />} label="เบอร์โทรศัพท์" value={user.phoneNumber || '-'} />
        <InfoCard icon={<BuildingOfficeIcon className="h-5 w-5 text-gray-400" />} label="ชื่อบริษัท" value={user.companyName || '-'} />
        <InfoCard icon={<CalendarDaysIcon className="h-5 w-5 text-gray-400" />} label="สมัครเมื่อ" value={formatDate(user.createdAt)} />
        <InfoCard 
          icon={<KeyIcon className="h-5 w-5 text-gray-400" />} 
          label="สิทธิ์การใช้งาน" 
          value={
            <span 
              className="inline-block px-3 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: user.role === 'admin' ? colors.secondary : colors.primary,
                color: user.role === 'admin' ? '#000' : '#fff'
              }}
            >
              {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
            </span>
          } 
        />
      </div>
    </div>
  );
}

// Info Card Component
function InfoCard({ icon, label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center mb-3">
        <div className="mr-3">{icon}</div>
        <h3 className="text-sm font-medium text-gray-600">{label}</h3>
      </div>
      <div className="ml-8 text-gray-800 font-medium">
        {value}
      </div>
    </div>
  );
}

// Orders Tab Content
function OrdersTabContent({ userId, colors }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    async function fetchUserOrders() {
      try {
        setLoading(true);
        const userOrders = await getUserOrders(userId);
        setOrders(userOrders);
      } catch (err) {
        console.error("Error fetching user orders:", err);
        setError("ไม่สามารถดึงข้อมูลคำสั่งซื้อได้");
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserOrders();
  }, [userId]);
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(date);
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    } catch (err) {
      console.error("Error formatting date:", err);
      return '-';
    }
  };
  
  const formatPrice = (price) => {
    return price?.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }).replace('฿', '') || '0';
  };
  
  const getStatusBadge = (status) => {
    let bgColor, textColor, borderColor;
    let icon;
    
    switch (status) {
      case 'awaiting_payment':
        bgColor = 'bg-orange-100';
        textColor = 'text-orange-800';
        borderColor = 'border-orange-200';
        icon = <CreditCardIcon className="h-4 w-4 mr-1" />;
        return (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${bgColor} ${textColor} border ${borderColor} shadow-sm`}>
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mr-1.5"></span>
            {icon}
            รอชำระเงิน
          </span>
        );
      case 'pending_verification':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        borderColor = 'border-blue-200';
        icon = <ClockIcon className="h-4 w-4 mr-1" />;
        return (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${bgColor} ${textColor} border ${borderColor} shadow-sm`}>
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5"></span>
            {icon}
            รอตรวจสอบการชำระเงิน
          </span>
        );
      case 'payment_verified':
        bgColor = 'bg-cyan-100';
        textColor = 'text-cyan-800';
        borderColor = 'border-cyan-200';
        icon = <CheckCircleIcon className="h-4 w-4 mr-1" />;
        return (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${bgColor} ${textColor} border ${borderColor} shadow-sm`}>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 mr-1.5"></span>
            {icon}
            ยืนยันการชำระเงินแล้ว
          </span>
        );
      case 'processing':
        bgColor = 'bg-amber-100';
        textColor = 'text-amber-800';
        borderColor = 'border-amber-200';
        icon = <ClockIcon className="h-4 w-4 mr-1" />;
        return (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${bgColor} ${textColor} border ${borderColor} shadow-sm`}>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5"></span>
            {icon}
            กำลังดำเนินการ
          </span>
        );
      case 'completed':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        borderColor = 'border-green-200';
        icon = <CheckCircleIcon className="h-4 w-4 mr-1" />;
        return (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${bgColor} ${textColor} border ${borderColor} shadow-sm`}>
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5"></span>
            {icon}
            เสร็จสิ้น
          </span>
        );
      case 'cancelled':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        borderColor = 'border-red-200';
        icon = <XCircleIcon className="h-4 w-4 mr-1" />;
        return (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${bgColor} ${textColor} border ${borderColor} shadow-sm`}>
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-1.5"></span>
            {icon}
            ยกเลิก
          </span>
        );
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        borderColor = 'border-gray-200';
        icon = <ClockIcon className="h-4 w-4 mr-1" />;
        return (
          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${bgColor} ${textColor} border ${borderColor} shadow-sm`}>
            <span className="h-1.5 w-1.5 rounded-full bg-gray-500 mr-1.5"></span>
            {icon}
            ไม่ระบุ
          </span>
        );
    }
  };
  
  if (loading) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center justify-between">
          <span>ประวัติคำสั่งซื้อ</span>
          <div className="bg-gray-100 text-gray-400 text-sm px-3 py-1 rounded-full">กำลังโหลด...</div>
        </h2>
        
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.primary }}></div>
            <p className="mt-4 text-gray-600 font-medium">กำลังโหลดข้อมูลคำสั่งซื้อ...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">ประวัติคำสั่งซื้อ</h2>
        <div className="bg-red-50 border border-red-200 rounded-xl text-red-700 p-6 mb-6 flex items-start" role="alert">
          <ExclamationCircleIcon className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
          <div>
            <p className="font-medium">เกิดข้อผิดพลาด</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!orders || orders.length === 0) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">ประวัติคำสั่งซื้อ</h2>
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-100">
          <ShoppingBagIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">ผู้ใช้นี้ยังไม่มีคำสั่งซื้อ</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <span>ประวัติคำสั่งซื้อ</span>
          <span className="ml-3 bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full font-medium">
            {orders.length} รายการ
          </span>
        </h2>
        
        <div className="flex items-center space-x-2">
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white shadow-sm">
            <option>ทั้งหมด</option>
            <option>รอชำระเงิน</option>
            <option>กำลังดำเนินการ</option>
            <option>เสร็จสิ้น</option>
            <option>ยกเลิก</option>
          </select>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 px-6 py-4 text-sm font-medium text-gray-500">
          <div className="col-span-3">เลขที่คำสั่งซื้อ</div>
          <div className="col-span-2 text-center">วันที่สั่งซื้อ</div>
          <div className="col-span-2 text-center">ราคา</div>
          <div className="col-span-2 text-center">ผู้สมัคร</div>
          <div className="col-span-2 text-center">สถานะ</div>
          <div className="col-span-1 text-center">ดูข้อมูล</div>
        </div>
        
        {/* Table Rows */}
        {orders.map((order, index) => (
          <div 
            key={order._id}
            className={`grid grid-cols-12 px-6 py-5 items-center hover:bg-gray-50 transition-colors ${
              index !== orders.length - 1 ? 'border-b border-gray-200' : ''
            }`}
          >
            <div className="col-span-3">
              <p className="font-medium text-gray-800">{order.TrackingNumber}</p>
              <p className="text-xs text-gray-500 mt-1">{order.OrderType === 'personal' ? 'ส่วนบุคคล' : 'บริษัท'}</p>
            </div>
            
            <div className="col-span-2 text-center">
              <p className="text-gray-800">{formatDate(order.createdAt)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(order.createdAt).toLocaleTimeString('th-TH', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            
            <div className="col-span-2 text-center">
              <p className="text-gray-800 font-medium">{formatPrice(order.TotalPrice)} บาท</p>
              {order.discount > 0 && (
                <p className="text-xs text-green-600 mt-1">ส่วนลด {formatPrice(order.discount)} บาท</p>
              )}
            </div>
            
            <div className="col-span-2 text-center">
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                {order.candidates?.length || 0} คน
              </span>
            </div>
            
            <div className="col-span-2 text-center">
              {getStatusBadge(order.OrderStatus)}
            </div>
            
            <div className="col-span-1 text-center">
              <Link 
                href={`/admin/dashboard/${order._id}`}
                className="inline-flex items-center justify-center h-8 w-8 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">แสดง 1-{orders.length} จาก {orders.length} รายการ</p>
        
        <div className="flex items-center space-x-2">
          <button 
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            ก่อนหน้า
          </button>
          
          <button 
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: colors.primary }}
          >
            1
          </button>
          
          <button 
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  );
}