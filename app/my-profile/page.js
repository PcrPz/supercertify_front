'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Edit2, Lock, Camera, User, Mail, Phone, Building, Calendar } from 'lucide-react';
import profileApi from '@/services/profileApi';
import { reloadUserProfile } from '@/services/auth';

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // โหลดข้อมูลผู้ใช้
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await profileApi.getMyProfile();
        setUser(profile);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);
  
  const handleEditProfile = () => {
    router.push('/my-profile/edit');
  };

  const handleChangePassword = () => {
    router.push('/my-profile/edit?tab=password');
  };

  // ฟังก์ชันจัดรูปแบบวันที่
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-[#444DDA] animate-spin mb-4" />
          <span className="text-gray-600 text-lg">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* หัวข้อ */}
        <h1 className="text-2xl font-bold text-gray-800 py-6 px-4">ประวัติส่วนตัว</h1>
        <div className="border-t border-gray-200"></div>
        
        {/* ส่วนหัวโปรไฟล์ (ปรับปรุงใหม่) */}
        <div className="relative mx-4 mt-6">
          {/* พื้นหลังสีน้ำเงิน */}
          <div className="bg-gradient-to-r from-[#444DDA] to-[#6366F1] rounded-xl h-72 w-full relative overflow-hidden shadow-lg">
            {/* รูปแบบจุดประดับ (decorative dots) */}
            <div className="absolute right-8 top-8">
              <div className="grid grid-cols-6 gap-2 opacity-20">
                {[...Array(30)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-white"></div>
                ))}
              </div>
            </div>
            
            {/* ส่วนแสดงรูปโปรไฟล์ (ปรับตำแหน่งใหม่) */}
            <div className="absolute left-0 top-0 w-full h-full flex items-center">
              <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* รูปโปรไฟล์ที่ใหญ่ขึ้น */}
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg flex-shrink-0 transform transition-all duration-300 hover:scale-105">
                  {user.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#444DDA]/10 flex items-center justify-center">
                      <span className="text-6xl font-bold text-[#444DDA]">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* ข้อมูลผู้ใช้ (ปรับ layout ใหม่) */}
                <div className="text-white text-center md:text-left mt-2">
                  <div className="flex flex-col md:flex-row md:items-center md:gap-3">
                    <h2 className="text-3xl md:text-4xl font-bold">{user.username}</h2>
                    <span className={`${user.role === 'admin' ? 'bg-[#FFC107] text-gray-800' : 'bg-white/20 text-white'} px-3 py-1 rounded-full text-sm font-medium inline-block mt-2 md:mt-0`}>
                      {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    <p className="flex items-center justify-center md:justify-start gap-2">
                      <Mail className="w-4 h-4 text-blue-100" />
                      <span className="text-blue-100">{user.email}</span>
                    </p>
                    {user.phoneNumber && (
                      <p className="flex items-center justify-center md:justify-start gap-2">
                        <Phone className="w-4 h-4 text-blue-100" />
                        <span className="text-blue-100">{user.phoneNumber}</span>
                      </p>
                    )}
                  </div>
                  {user.companyName && (
                    <p className="mt-2 flex items-center justify-center md:justify-start gap-2">
                      <Building className="w-4 h-4 text-blue-100" />
                      <span className="text-blue-100">{user.companyName}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* ข้อมูลส่วนตัว */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-8 mb-10 mx-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">ข้อมูลส่วนตัว</h3>
              <p className="text-sm text-gray-500 mt-1">ข้อมูลเกี่ยวกับบัญชีผู้ใช้ของคุณ</p>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <button 
                onClick={handleChangePassword}
                className="px-6 py-2.5 bg-[#FFC107] text-gray-800 rounded-full font-medium hover:bg-[#FFC107]/90 transition shadow-sm flex items-center"
              >
                <Lock className="w-4 h-4 mr-2" />
                เปลี่ยนรหัสผ่าน
              </button>
              <button 
                onClick={handleEditProfile}
                className="px-6 py-2.5 bg-[#444DDA] text-white rounded-full font-medium hover:bg-[#444DDA]/90 transition shadow-sm flex items-center"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                แก้ไข
              </button>
            </div>
          </div>
          
          <div className="space-y-6 mt-8">
            <div className="flex flex-col md:flex-row border-b border-gray-100 pb-4">
              <div className="w-full md:w-1/3 text-gray-500 font-medium">ชื่อผู้ใช้</div>
              <div className="w-full md:w-2/3 text-gray-800 mt-1 md:mt-0">{user.username}</div>
            </div>
            <div className="flex flex-col md:flex-row border-b border-gray-100 pb-4">
              <div className="w-full md:w-1/3 text-gray-500 font-medium">อีเมล</div>
              <div className="w-full md:w-2/3 text-gray-800 mt-1 md:mt-0">{user.email}</div>
            </div>
            <div className="flex flex-col md:flex-row border-b border-gray-100 pb-4">
              <div className="w-full md:w-1/3 text-gray-500 font-medium">หมายเลขโทรศัพท์</div>
              <div className="w-full md:w-2/3 text-gray-800 mt-1 md:mt-0">{user.phoneNumber || 'ไม่ได้ระบุ'}</div>
            </div>
            <div className="flex flex-col md:flex-row border-b border-gray-100 pb-4">
              <div className="w-full md:w-1/3 text-gray-500 font-medium">บริษัท</div>
              <div className="w-full md:w-2/3 text-gray-800 mt-1 md:mt-0">{user.companyName || 'ไม่ได้ระบุ'}</div>
            </div>
            <div className="flex flex-col md:flex-row border-b border-gray-100 pb-4">
              <div className="w-full md:w-1/3 text-gray-500 font-medium">วันที่สมัครสมาชิก</div>
              <div className="w-full md:w-2/3 text-gray-800 mt-1 md:mt-0">{formatDate(user.createdAt)}</div>
            </div>
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/3 text-gray-500 font-medium">อัปเดตล่าสุด</div>
              <div className="w-full md:w-2/3 text-gray-800 mt-1 md:mt-0">{formatDate(user.updatedAt)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}