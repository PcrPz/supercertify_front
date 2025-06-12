'use client'
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Calendar, Users, Percent, BarChart3, TrendingUp, Tag, Filter, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { getAllCoupons, getAdminCouponOverview, createPublicCoupon, deleteCoupon } from '@/services/apiService';
import useToast from '@/hooks/useToast'; // นำเข้า useToast

export default function AdminCouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [overview, setOverview] = useState({
    total: 0,
    byType: {
      public: 0,
      survey: 0,
      claimed: 0,
      used: 0
    },
    claimedByType: {
      PUBLIC: 0,
      SURVEY: 0,
      PRIVATE: 0,
      SPECIAL: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountPercent: '',
    expiryDate: '',
    description: '',
    remainingClaims: '',
    couponType: 'PUBLIC'
  });
  const [filterType, setFilterType] = useState('available'); // เปลี่ยนจาก 'all' เป็น 'available'
  const toast = useToast(); // เรียกใช้ useToast

  useEffect(() => {
    loadCoupons();
    loadOverview();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await getAllCoupons();
      
      if (response.success) {
        setCoupons(response.coupons);
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลคูปองได้'); // แสดง toast error เฉพาะเมื่อมีปัญหา
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลคูปอง'); // แสดง toast error เฉพาะเมื่อมีปัญหา
    } finally {
      setLoading(false);
    }
  };

  const loadOverview = async () => {
    try {
      const response = await getAdminCouponOverview();
      if (response.success && response.data) {
        setOverview(response.data);
      }
    } catch (error) {
      console.error('Error loading overview:', error);
      // ไม่จำเป็นต้องแสดง toast เพราะเป็นข้อมูลเสริมเท่านั้น
    }
  };

  const handleCreateCoupon = async () => {
    try {
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!newCoupon.code.trim()) {
        toast.warning('กรุณาระบุรหัสคูปอง');
        return;
      }
      
      if (!newCoupon.discountPercent) {
        toast.warning('กรุณาระบุเปอร์เซ็นต์ส่วนลด');
        return;
      }
      
      if (!newCoupon.expiryDate) {
        toast.warning('กรุณาระบุวันหมดอายุ');
        return;
      }
      
      const loadingToastId = toast.loading('กำลังสร้างคูปอง...'); // แสดง toast loading
      
      const response = await createPublicCoupon({
        ...newCoupon,
        discountPercent: parseInt(newCoupon.discountPercent),
        remainingClaims: newCoupon.remainingClaims ? parseInt(newCoupon.remainingClaims) : -1
      });

      toast.dismiss(loadingToastId); // ปิด toast loading

      if (response.success) {
        setShowCreateModal(false);
        setNewCoupon({ 
          code: '', 
          discountPercent: '', 
          expiryDate: '', 
          description: '', 
          remainingClaims: '',
          couponType: 'PUBLIC'
        });
        loadCoupons();
        loadOverview();
        toast.success(`สร้างคูปอง ${response.coupon.code} สำเร็จ!`); // แสดง toast success
      } else {
        toast.error(response.message || 'เกิดข้อผิดพลาดในการสร้างคูปอง'); // แสดง toast error
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast.error('เกิดข้อผิดพลาดในการสร้างคูปอง'); // แสดง toast error
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    // ใช้ toast.info แทน confirm ด้วย options ที่กำหนดเอง
    if (confirm(`คุณแน่ใจหรือไม่ที่จะลบคูปอง "${code}"?`)) {
      try {
        const loadingToastId = toast.loading(`กำลังลบคูปอง ${code}...`); // แสดง toast loading
        
        const response = await deleteCoupon(id);
        
        toast.dismiss(loadingToastId); // ปิด toast loading
        
        if (response.success) {
          loadCoupons();
          loadOverview();
          toast.success(`ลบคูปอง ${code} สำเร็จ!`); // แสดง toast success
        } else {
          toast.error(response.message || 'เกิดข้อผิดพลาดในการลบคูปอง'); // แสดง toast error
        }
      } catch (error) {
        console.error('Error deleting coupon:', error);
        toast.error('เกิดข้อผิดพลาดในการลบคูปอง'); // แสดง toast error
      }
    }
  };

  const generateRandomCode = () => {
    const prefixes = ['SALE', 'DISC', 'SAVE', 'PROMO'];
    const numbers = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    setNewCoupon({...newCoupon, code: `${prefix}${numbers}`});
    toast.info(`สร้างรหัสคูปองอัตโนมัติ: ${prefix}${numbers}`); // แสดง toast info
  };

  // ✅ ปรับปรุงฟังก์ชันกรองให้แยกชัดเจนขึ้น
  const getFilteredCoupons = () => {
    switch(filterType) {
      case 'available':
        // คูปองสาธารณะที่ยังใช้ได้ (ยังไม่มีเจ้าของ)
        return coupons.filter(c => !c.claimedBy && c.isActive && !c.isUsed);
      
      case 'claimed':
        // คูปองที่มีเจ้าของแล้วแต่ยังไม่ใช้
        return coupons.filter(c => c.claimedBy && !c.isUsed);
      
      case 'used':
        // คูปองที่ใช้แล้ว
        return coupons.filter(c => c.isUsed);
      
      case 'expired':
        // คูปองที่หมดอายุ
        return coupons.filter(c => new Date(c.expiryDate) < new Date());
      
      case 'survey':
        // คูปองประเภทแบบสอบถาม
        return coupons.filter(c => c.couponType === 'SURVEY');
      
      case 'all':
      default:
        return coupons;
    }
  };

  const filteredCoupons = getFilteredCoupons();

  // ✅ ฟังก์ชันกำหนดสถานะและสีของคูปอง
  const getCouponStatus = (coupon) => {
    if (coupon.isUsed) {
      return { 
        text: 'ใช้แล้ว', 
        color: 'bg-red-100 text-red-800',
        icon: <CheckCircle2 className="h-4 w-4" />
      };
    }
    if (new Date(coupon.expiryDate) < new Date()) {
      return { 
        text: 'หมดอายุ', 
        color: 'bg-gray-100 text-gray-800',
        icon: <Clock className="h-4 w-4" />
      };
    }
    if (coupon.claimedBy) {
      return { 
        text: 'มีเจ้าของแล้ว', 
        color: 'bg-yellow-100 text-yellow-800',
        icon: <User className="h-4 w-4" />
      };
    }
    return { 
      text: 'คูปองสาธารณะ', 
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircle2 className="h-4 w-4" />
    };
  };

  const getCouponTypeColor = (type) => {
    switch(type) {
      case 'SURVEY': return 'bg-purple-100 text-purple-800';
      case 'PRIVATE': return 'bg-orange-100 text-orange-800';
      case 'SPECIAL': return 'bg-pink-100 text-pink-800';
      default: return null; // ไม่แสดง PUBLIC
    }
  };

  const getCouponTypeText = (type) => {
    switch(type) {
      case 'SURVEY': return 'แบบสอบถาม';
      case 'PRIVATE': return 'ส่วนตัว';
      case 'SPECIAL': return 'พิเศษ';
      default: return null; // ไม่แสดง PUBLIC
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-[#444DDA] to-[#5B63E8] w-12 h-12 rounded-xl flex items-center justify-center mr-4">
              <Percent className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จัดการคูปองส่วนลด</h1>
              <p className="text-gray-600">สร้างและจัดการคูปองสำหรับผู้ใช้</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#444DDA] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#3730A3] transition-colors flex items-center shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            สร้างคูปองใหม่
          </button>
        </div>
      </div>

      {/* Statistics Cards - Updated to match second version */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">ทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900">{overview.total}</p>
            </div>
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">คูปองสาธารณะ</p>
              <p className="text-3xl font-bold text-green-600">
                {coupons.filter(c => !c.claimedBy && c.isActive && !c.isUsed).length}
              </p>
            </div>
            <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">มีเจ้าของ</p>
              <p className="text-3xl font-bold text-yellow-600">
                {coupons.filter(c => c.claimedBy && !c.isUsed).length}
              </p>
            </div>
            <div className="bg-yellow-100 w-12 h-12 rounded-xl flex items-center justify-center">
              <User className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">ใช้แล้ว</p>
              <p className="text-3xl font-bold text-red-500">
                {coupons.filter(c => c.isUsed).length}
              </p>
            </div>
            <div className="bg-red-100 w-12 h-12 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Coupon List with Improved Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            คูปองทั้งหมด ({filteredCoupons.length})
          </h2>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                toast.info(`กรองคูปองตาม: ${e.target.options[e.target.selectedIndex].text}`);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#444DDA] focus:border-transparent"
            >
              <option value="available">คูปองสาธารณะ</option>
              <option value="claimed">คูปองที่มีเจ้าของ</option>
              <option value="used">คูปองที่ใช้แล้ว</option>
              <option value="expired">คูปองหมดอายุ</option>
              <option value="survey">คูปองแบบสอบถาม</option>
              <option value="all">ทั้งหมด</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#444DDA] mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Percent className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีคูปองในหมวดนี้</h3>
            <p className="text-gray-600 mb-6">ลองเปลี่ยนตัวกรองหรือสร้างคูปองใหม่</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCoupons.map((coupon) => {
              const status = getCouponStatus(coupon);
              const typeColor = getCouponTypeColor(coupon.couponType);
              const typeText = getCouponTypeText(coupon.couponType);
              
              return (
                <div key={coupon._id} className="border border-gray-200 rounded-xl p-4 hover:border-[#444DDA]/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-[#444DDA] to-[#5B63E8] text-white px-4 py-2 rounded-full font-bold text-sm">
                        {coupon.code}
                      </div>
                      <div className="bg-[#FFC107] text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
                        -{coupon.discountPercent}%
                      </div>
                      {typeColor && typeText && (
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${typeColor}`}>
                          {typeText}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${status.color}`}>
                        {status.icon}
                        <span>{status.text}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                        title="ลบคูปอง"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      หมดอายุ: {new Date(coupon.expiryDate).toLocaleDateString('th-TH')}
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      เคลมได้: {coupon.remainingClaims === -1 ? 'ไม่จำกัด' : `${coupon.remainingClaims} ครั้ง`}
                    </div>
                    
                    {coupon.claimedBy && (
                      <div className="flex items-center text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        เจ้าของ: {coupon.claimedBy.username || coupon.claimedBy.email || 'ไม่ระบุ'}
                      </div>
                    )}
                    
                    {coupon.isUsed && coupon.usedAt && (
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        ใช้เมื่อ: {new Date(coupon.usedAt).toLocaleDateString('th-TH')}
                      </div>
                    )}
                  </div>
                  
                  {coupon.description && (
                    <div className="mt-3 text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                      {coupon.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal - Updated */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">สร้างคูปองใหม่</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทคูปอง</label>
                <select
                  value={newCoupon.couponType}
                  onChange={(e) => setNewCoupon({...newCoupon, couponType: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#444DDA] focus:border-transparent"
                  required
                >
                  <option value="PUBLIC">คูปองสาธารณะ</option>
                  <option value="SPECIAL">คูปองพิเศษ</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  * คูปองแบบสอบถาม (SURVEY) จะถูกสร้างอัตโนมัติเมื่อผู้ใช้ทำแบบสอบถาม
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">รหัสคูปอง</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#444DDA] focus:border-transparent"
                    placeholder="เช่น SUMMER2025"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors text-sm font-medium"
                    title="สุ่มรหัส"
                  >
                    สุ่ม
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ส่วนลด (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newCoupon.discountPercent}
                  onChange={(e) => setNewCoupon({...newCoupon, discountPercent: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#444DDA] focus:border-transparent"
                  placeholder="15"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันหมดอายุ</label>
                <input
                  type="date"
                  value={newCoupon.expiryDate}
                  onChange={(e) => setNewCoupon({...newCoupon, expiryDate: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#444DDA] focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">คำอธิบาย</label>
                <textarea
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({...newCoupon, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#444DDA] focus:border-transparent"
                  placeholder="คำอธิบายคูปอง (ไม่บังคับ)"
                  rows="2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนครั้งที่เคลมได้</label>
                <input
                  type="number"
                  min="1"
                  value={newCoupon.remainingClaims}
                  onChange={(e) => setNewCoupon({...newCoupon, remainingClaims: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#444DDA] focus:border-transparent"
                  placeholder="ปล่อยว่างสำหรับไม่จำกัด"
                />
                <p className="text-xs text-gray-500 mt-1">หากปล่อยว่างจะเป็นไม่จำกัดจำนวน</p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCoupon({ 
                      code: '', 
                      discountPercent: '', 
                      expiryDate: '', 
                      description: '', 
                      remainingClaims: '',
                      couponType: 'PUBLIC'
                    });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleCreateCoupon}
                  className="flex-1 bg-[#444DDA] text-white py-3 rounded-xl font-medium hover:bg-[#3730A3] transition-colors"
                >
                  สร้างคูปอง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}