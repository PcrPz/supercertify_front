'use client'
import { useState, useEffect, Fragment, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ChevronLeft, Lock, Eye, EyeOff, User, Mail, Phone, Building, Save, X, Camera } from 'lucide-react';
import profileApi from '@/services/profileApi';
import { reloadUserProfile } from '@/services/auth';
import { Dialog, Transition } from '@headlessui/react';

// Separate component for the search params logic
function EditProfileContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  const [validationMessage, setValidationMessage] = useState(''); // เพิ่มสถานะสำหรับข้อความตรวจสอบ
  const [validationField, setValidationField] = useState(''); // เพิ่มสถานะสำหรับฟิลด์ที่มีปัญหา
  
  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    companyName: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isHoveringProfilePic, setIsHoveringProfilePic] = useState(false);

  // สถานะสำหรับ Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // โหลดข้อมูลผู้ใช้
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await profileApi.getMyProfile();
        if (profile) {
          setUser(profile);
          setFormData({
            username: profile.username || '',
            phoneNumber: profile.phoneNumber || '',
            companyName: profile.companyName || '',
          });
          setPreviewUrl(profile.profilePicture || '');
          setLoading(false);
        } else {
          setError('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
        setLoading(false);
      }
    };
    
    fetchUserProfile();
    
    // ตรวจสอบ tab จาก URL
    const tab = searchParams?.get('tab');
    if (tab === 'password') {
      setActiveTab('password');
    }
  }, [searchParams]);
  
  // จัดการการเปลี่ยนแปลงข้อมูลฟอร์ม
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // ล้างข้อความ validation และ error เมื่อผู้ใช้เริ่มแก้ไขข้อมูล
    if (name === validationField) {
      setValidationMessage('');
      setValidationField('');
    }
    setError('');
    
    // ตรวจสอบความถูกต้องของข้อมูลในขณะที่ผู้ใช้กำลังพิมพ์
    if (name === 'username') {
      // ตรวจสอบว่าชื่อผู้ใช้เป็นค่าว่างหรือไม่
      if (!value.trim()) {
        setValidationMessage('กรุณากรอกชื่อผู้ใช้');
        setValidationField('username');
      } 
      // ตรวจสอบว่าชื่อผู้ใช้ตรงกับปัจจุบันหรือไม่ (ไม่มีการเปลี่ยนแปลง)
      else if (value.trim() === user.username) {
        setValidationMessage('');
        setValidationField('');
      }
      // ตรวจสอบรูปแบบชื่อผู้ใช้
      else if (value.length < 3) {
        setValidationMessage('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
        setValidationField('username');
      }
    }
    
    // ตรวจสอบรูปแบบเบอร์โทรศัพท์
    if (name === 'phoneNumber' && value) {
      const phoneRegex = /^[0-9\+\-\s]+$/;
      if (!phoneRegex.test(value)) {
        setValidationMessage('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
        setValidationField('phoneNumber');
      }
    }
  };

  // จัดการการเปลี่ยนแปลงข้อมูลรหัสผ่าน
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    
    // ล้างข้อความ validation และ error เมื่อผู้ใช้เริ่มแก้ไขข้อมูล
    if (name === validationField) {
      setValidationMessage('');
      setValidationField('');
    }
    setError('');
    
    // ตรวจสอบความถูกต้องของข้อมูลในขณะที่ผู้ใช้กำลังพิมพ์
    if (name === 'newPassword' && value.length > 0 && value.length < 6) {
      setValidationMessage('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      setValidationField('newPassword');
    }
  };
  
  // จัดการการเปลี่ยนแปลงรูปโปรไฟล์
  const handleProfilePictureChange = (e) => {
    if (typeof window === 'undefined') return;
    
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบประเภทไฟล์
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setValidationMessage('ประเภทไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPEG, PNG, GIF, WEBP)');
        setValidationField('profilePicture');
        return;
      }
      
      // ตรวจสอบขนาดไฟล์
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setValidationMessage('ขนาดไฟล์ใหญ่เกินไป กรุณาอัปโหลดไฟล์ขนาดไม่เกิน 5MB');
        setValidationField('profilePicture');
        return;
      }
      
      setProfilePicture(file);
      
      // สร้าง URL สำหรับแสดงตัวอย่างรูป
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      
      // ล้างข้อความ validation เมื่อผู้ใช้เลือกไฟล์ใหม่
      setValidationMessage('');
      setValidationField('');
    }
  };
  
  // ฟังก์ชันสำหรับล้างข้อความแจ้งเตือนหลังจากเวลาที่กำหนด
  const clearMessages = (timeout = 5000) => {
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, timeout);
  };
  
  // บันทึกข้อมูลโปรไฟล์
  const handleUpdateProfile = async () => {
    // ตรวจสอบข้อมูลก่อนส่ง
    if (!formData.username.trim()) {
      setValidationMessage('กรุณากรอกชื่อผู้ใช้');
      setValidationField('username');
      return;
    }
    
    if (formData.username.length < 3) {
      setValidationMessage('ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      setValidationField('username');
      return;
    }
    
    // ตรวจสอบรูปแบบเบอร์โทรศัพท์
    if (formData.phoneNumber) {
      const phoneRegex = /^[0-9\+\-\s]+$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        setValidationMessage('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
        setValidationField('phoneNumber');
        return;
      }
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    setValidationMessage('');
    setValidationField('');
    setIsConfirmModalOpen(false);
    
    try {
      // อัปเดตรูปโปรไฟล์ (ถ้ามีการเปลี่ยนแปลง)
      if (profilePicture) {
        const pictureResult = await profileApi.uploadProfilePicture(profilePicture);
        if (!pictureResult.success) {
          setValidationMessage(pictureResult.message || 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้');
          setValidationField('profilePicture');
          setSaving(false);
          return;
        }
      }
      
      // อัปเดตข้อมูลอื่นๆ
      const result = await profileApi.updateProfile(formData);
      
      if (result.success) {
        // แสดงข้อความสำเร็จสั้นๆ
        alert('บันทึกข้อมูลเรียบร้อยแล้ว กำลังรีเฟรชหน้า...');
        
        // รีโหลดข้อมูลผู้ใช้
        await reloadUserProfile();
        
        // รีโหลดหน้าเว็บ
        window.location.reload();
      } else {
        // ตรวจสอบประเภทของ error
        if (result.errorCode === 'USERNAME_ALREADY_EXISTS') {
          // แสดงข้อความเตือนแทนข้อความผิดพลาด
          setValidationMessage(result.message || 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');
          setValidationField('username');
        } else if (result.errorCode === 'VALIDATION_ERROR' && result.validationErrors) {
          // กรณีมี validation errors หลายรายการ
          const firstErrorField = Object.keys(result.validationErrors)[0];
          setValidationMessage(result.validationErrors[firstErrorField]);
          setValidationField(firstErrorField);
        } else {
          // แสดงข้อความผิดพลาดทั่วไป
          setError(result.message || 'ไม่สามารถอัปเดตโปรไฟล์ได้');
        }
      }
      
      setSaving(false);
    } catch (error) {
      console.error('Error in handleUpdateProfile:', error);
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง');
      setSaving(false);
    }
  };

  // เปลี่ยนรหัสผ่าน
  const handleUpdatePassword = async () => {
    // ตรวจสอบข้อมูลก่อนส่ง
    if (!passwordData.currentPassword) {
      setValidationMessage('กรุณากรอกรหัสผ่านปัจจุบัน');
      setValidationField('currentPassword');
      return;
    }
    
    if (!passwordData.newPassword) {
      setValidationMessage('กรุณากรอกรหัสผ่านใหม่');
      setValidationField('newPassword');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setValidationMessage('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      setValidationField('newPassword');
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');
    setValidationMessage('');
    setValidationField('');
    setIsPasswordModalOpen(false);
    
    try {
      // อัปเดตรหัสผ่าน
      const result = await profileApi.updateProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      if (result.success) {
        // แสดงข้อความสำเร็จ
        alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กำลังรีเฟรชหน้า...');
        
        // รีโหลดข้อมูลผู้ใช้
        await reloadUserProfile();
        
        // รีโหลดหน้าเว็บ
        window.location.reload();
      } else {
        // ตรวจสอบประเภทของ error
        if (result.errorCode === 'INVALID_CURRENT_PASSWORD') {
          // แสดงข้อความเตือนแทนข้อความผิดพลาด
          setValidationMessage(result.message || 'รหัสผ่านปัจจุบันไม่ถูกต้อง');
          setValidationField('currentPassword');
        } else if (result.errorCode === 'VALIDATION_ERROR') {
          // แสดงข้อความเตือนแทนข้อความผิดพลาด
          setValidationMessage(result.message || 'ข้อมูลไม่ถูกต้อง');
          setValidationField(result.validationErrors?.newPassword ? 'newPassword' : 'currentPassword');
        } else {
          // แสดงข้อความผิดพลาดทั่วไป
          setError(result.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
        }
      }
      
      setSaving(false);
    } catch (error) {
      console.error('Error in handleUpdatePassword:', error);
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง');
      setSaving(false);
    }
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

  // ฟังก์ชันช่วยตรวจสอบว่าฟิลด์มีปัญหาหรือไม่
  const isFieldInvalid = (fieldName) => {
    return validationField === fieldName && validationMessage !== '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* หัวข้อ */}
        <div className="flex items-center py-6 px-4">
          <button 
            onClick={() => router.push('/my-profile')}
            className="mr-3 text-gray-600 hover:text-gray-900 transition"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">แก้ไขประวัติส่วนตัว</h1>
        </div>
        <div className="border-t border-gray-200"></div>
        
        {/* ส่วนหัวโปรไฟล์ (ปรับปรุงใหม่) */}
        <div className="relative">
          {/* พื้นหลังสีน้ำเงิน (ไม่มีจุดสีๆ แล้ว) */}
          <div className="bg-gradient-to-r from-[#444DDA] to-[#6366F1] rounded-xl h-64 w-full relative overflow-hidden shadow-lg">
            {/* ลบวงกลมสีสำหรับเลือกสีพื้นหลังออก */}
            {/* ลบรูปแบบจุดประดับ (decorative dots) ออก */}
          </div>
          
          {/* รูปโปรไฟล์ (ปรับให้ใหญ่ขึ้น) */}
          <div className="mx-auto -mt-32 relative z-10 w-52">
            <div className="relative">
              <label 
                htmlFor="profile-picture" 
                className={`w-52 h-52 rounded-full border-4 ${isFieldInvalid('profilePicture') ? 'border-red-400' : 'border-white'} bg-white overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl cursor-pointer block`}
                onMouseEnter={() => setIsHoveringProfilePic(true)}
                onMouseLeave={() => setIsHoveringProfilePic(false)}
              >
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="รูปโปรไฟล์" 
                    className={`w-full h-full object-cover transition-all duration-300 ${isHoveringProfilePic ? 'scale-110 brightness-90' : ''}`}
                  />
                ) : (
                  <div className={`w-full h-full bg-[#444DDA]/10 flex items-center justify-center transition-all duration-300 ${isHoveringProfilePic ? 'bg-[#444DDA]/20' : ''}`}>
                    <span className="text-7xl font-bold text-[#444DDA]">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                
                {/* โอเวอร์เลย์ตอนวางเมาส์เหนือรูป - แก้ให้เป็นวงกลม */}
                {isHoveringProfilePic && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-full">
                    <Camera className="w-12 h-12 text-white opacity-80" />
                  </div>
                )}

                <input
                  type="file"
                  id="profile-picture"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                  disabled={saving}
                />
              </label>
              
              <label htmlFor="profile-picture-btn" className="absolute bottom-2 right-2 bg-[#444DDA] text-white p-3 rounded-full cursor-pointer shadow-md hover:bg-[#444DDA]/90 transition">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  id="profile-picture-btn"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                  disabled={saving}
                />
              </label>
              
              {isFieldInvalid('profilePicture') && (
                <p className="mt-2 text-sm text-red-500 text-center">
                  {validationMessage}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mt-8 px-4">
          <button
            className={`py-3 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'profile' 
                ? 'border-[#444DDA] text-[#444DDA]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            } transition`}
            onClick={() => setActiveTab('profile')}
          >
            ข้อมูลส่วนตัว
          </button>
          <button
            className={`py-3 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'password' 
                ? 'border-[#444DDA] text-[#444DDA]' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            } transition`}
            onClick={() => setActiveTab('password')}
          >
            เปลี่ยนรหัสผ่าน
          </button>
        </div>
        
        {/* ฟอร์มแก้ไขข้อมูล */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6 mb-10 mx-4">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}
          
          {activeTab === 'profile' ? (
            // ฟอร์มข้อมูลส่วนตัว (ปรับปรุงใหม่)
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6">ข้อมูลส่วนตัว</h3>
              <p className="text-sm text-gray-500 mb-6">อัปเดตรูปแบบและรายละเอียดส่วนตัวของคุณ</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อเต็ม</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${isFieldInvalid('username') ? 'border-red-400' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-[#444DDA] shadow-sm`}
                      placeholder="ชื่อผู้ใช้งาน"
                      disabled={saving}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <User className={`h-5 w-5 ${isFieldInvalid('username') ? 'text-red-500' : 'text-gray-400'}`} />
                    </div>
                  </div>
                  {isFieldInvalid('username') && (
                    <p className="mt-2 text-sm text-red-500">
                      {validationMessage}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user.email}
                      className="w-full px-4 py-3 border border-gray-300 rounded-full bg-gray-50 text-gray-500 shadow-sm"
                      placeholder="อีเมล"
                      disabled
                      readOnly
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">ไม่สามารถเปลี่ยนอีเมลได้เพื่อความปลอดภัย</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">หมายเลขโทรศัพท์</label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${isFieldInvalid('phoneNumber') ? 'border-red-400' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-[#444DDA] shadow-sm`}
                      placeholder="เบอร์โทรศัพท์"
                      disabled={saving}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Phone className={`h-5 w-5 ${isFieldInvalid('phoneNumber') ? 'text-red-500' : 'text-gray-400'}`} />
                    </div>
                  </div>
                  {isFieldInvalid('phoneNumber') && (
                    <p className="mt-2 text-sm text-red-500">
                      {validationMessage}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อบริษัท</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${isFieldInvalid('companyName') ? 'border-red-400' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-[#444DDA] shadow-sm`}
                      placeholder="ชื่อบริษัท"
                      disabled={saving}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <Building className={`h-5 w-5 ${isFieldInvalid('companyName') ? 'text-red-500' : 'text-gray-400'}`} />
                    </div>
                  </div>
                  {isFieldInvalid('companyName') && (
                    <p className="mt-2 text-sm text-red-500">
                      {validationMessage}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/my-profile')}
                  className="px-6 py-2.5 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition font-medium shadow-sm"
                  disabled={saving}
                >
                  ยกเลิก
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="px-6 py-2.5 bg-[#444DDA] rounded-full text-white hover:bg-[#444DDA]/90 transition shadow-sm font-medium flex items-center"
                  disabled={saving}
                >
                {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      <span>บันทึกข้อมูล</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // ฟอร์มเปลี่ยนรหัสผ่าน (ปรับปรุงใหม่)
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">เปลี่ยนรหัสผ่าน</h3>
              <p className="text-sm text-gray-500 mb-6">อัปเดตรหัสผ่านของคุณเพื่อความปลอดภัย</p>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    รหัสผ่านปัจจุบัน
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-3 border ${isFieldInvalid('currentPassword') ? 'border-red-400' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-[#444DDA] shadow-sm`}
                      placeholder="รหัสผ่านปัจจุบัน"
                      disabled={saving}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`text-gray-400 hover:text-gray-600 focus:outline-none ${isFieldInvalid('currentPassword') ? 'text-red-500' : ''}`}
                        disabled={saving}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  {isFieldInvalid('currentPassword') && (
                    <p className="mt-2 text-sm text-red-500">
                      {validationMessage}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    รหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-3 border ${isFieldInvalid('newPassword') ? 'border-red-400' : 'border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-[#444DDA] shadow-sm`}
                      placeholder="รหัสผ่านใหม่"
                      minLength={6}
                      disabled={saving}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className={`text-gray-400 hover:text-gray-600 focus:outline-none ${isFieldInvalid('newPassword') ? 'text-red-500' : ''}`}
                        disabled={saving}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  {isFieldInvalid('newPassword') ? (
                    <p className="mt-2 text-sm text-red-500">
                      {validationMessage}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">
                      รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center bg-[#FFC107]/10 p-4 rounded-lg mt-6">
                  <div className="flex items-start md:items-center">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#FFC107]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-700">
                        รหัสผ่านที่ดีควรประกอบด้วยตัวอักษรตัวพิมพ์ใหญ่และตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/my-profile')}
                  className="px-6 py-2.5 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition font-medium shadow-sm"
                  disabled={saving}
                >
                  ยกเลิก
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="px-6 py-2.5 bg-[#444DDA] rounded-full text-white hover:bg-[#444DDA]/90 transition shadow-sm font-medium flex items-center"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      <span>บันทึกรหัสผ่าน</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal ยืนยันการบันทึก */}
      <Transition appear show={isConfirmModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsConfirmModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold leading-6 text-gray-900"
                  >
                    ยืนยันการบันทึกข้อมูล
                  </Dialog.Title>
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      คุณต้องการบันทึกการเปลี่ยนแปลงข้อมูลโปรไฟล์ใช่หรือไม่?
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:ring-offset-2"
                      onClick={() => setIsConfirmModalOpen(false)}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-full border border-transparent bg-[#444DDA] px-4 py-2 text-sm font-medium text-white hover:bg-[#444DDA]/90 focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:ring-offset-2"
                      onClick={handleUpdateProfile}
                    >
                      ยืนยัน
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      
      {/* Modal ยืนยันการเปลี่ยนรหัสผ่าน */}
      <Transition appear show={isPasswordModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsPasswordModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold leading-6 text-gray-900"
                  >
                    ยืนยันการเปลี่ยนรหัสผ่าน
                  </Dialog.Title>
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      คุณต้องการเปลี่ยนรหัสผ่านใช่หรือไม่? การเปลี่ยนรหัสผ่านจะมีผลทันทีและคุณจะต้องใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งถัดไป
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:ring-offset-2"
                      onClick={() => setIsPasswordModalOpen(false)}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-full border border-transparent bg-[#444DDA] px-4 py-2 text-sm font-medium text-white hover:bg-[#444DDA]/90 focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:ring-offset-2"
                      onClick={handleUpdatePassword}
                    >
                      ยืนยันการเปลี่ยนรหัสผ่าน
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

// Loading component for Suspense fallback
function EditProfileLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center">
        <Loader2 className="w-12 h-12 text-[#444DDA] animate-spin mb-4" />
        <span className="text-gray-600 text-lg">กำลังโหลดข้อมูล...</span>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function EditProfile() {
  return (
    <Suspense fallback={<EditProfileLoading />}>
      <EditProfileContent />
    </Suspense>
  );
}