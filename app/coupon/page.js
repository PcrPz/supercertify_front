'use client'
import { useState, useEffect } from 'react';
import { Gift, Calendar, Percent, Plus, Check, Clock, Star, Sparkles, Filter, X, ChevronRight, Zap, Trophy, TrendingUp, ShoppingBag, Crown } from 'lucide-react';
import { getUserCoupons, getPublicCoupons, claimCoupon } from '@/services/apiService';

export default function MyCouponsPage() {
  const [myCoupons, setMyCoupons] = useState([]);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingCoupon, setClaimingCoupon] = useState(null);
  const [activeTab, setActiveTab] = useState('my-coupons');
  const [couponFilter, setCouponFilter] = useState('all');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      
      const myResponse = await getUserCoupons(true);
      if (myResponse.success) {
        setMyCoupons(myResponse.coupons || []);
      }
      
      const publicResponse = await getPublicCoupons();
      if (publicResponse.success) {
        setAvailableCoupons(publicResponse.coupons || []);
      }
      
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCoupon = async (couponId) => {
    try {
      setClaimingCoupon(couponId);
      
      const result = await claimCoupon(couponId);

      if (result.success) {
        setShowSuccessAnimation(true);
        await loadCoupons();
        
        setTimeout(() => {
          setShowSuccessAnimation(false);
          alert(`เก็บคูปอง "${result.coupon.code}" สำเร็จ!`);
        }, 1500);
      } else {
        alert(result.message || 'ไม่สามารถเก็บคูปองได้');
      }
    } catch (error) {
      console.error('Error claiming coupon:', error);
      alert('เกิดข้อผิดพลาดในการเก็บคูปอง');
    } finally {
      setClaimingCoupon(null);
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'expired', text: 'หมดอายุแล้ว', color: 'text-red-600', bgColor: 'bg-red-100' };
    } else if (diffDays <= 7) {
      return { status: 'expiring', text: `เหลือ ${diffDays} วัน`, color: 'text-orange-600', bgColor: 'bg-orange-100' };
    } else {
      return { status: 'valid', text: `เหลือ ${diffDays} วัน`, color: 'text-green-600', bgColor: 'bg-green-100' };
    }
  };

  const getFilteredCoupons = () => {
    const now = new Date();
    let filtered = [];
    
    switch (couponFilter) {
      case 'available':
        filtered = myCoupons.filter(coupon => 
          !coupon.isUsed && new Date(coupon.expiryDate) > now
        );
        break;
      case 'used':
        filtered = myCoupons.filter(coupon => coupon.isUsed);
        break;
      case 'expired':
        filtered = myCoupons.filter(coupon => 
          !coupon.isUsed && new Date(coupon.expiryDate) <= now
        );
        break;
      default:
        filtered = [...myCoupons];
    }
    
    // เรียงลำดับ: คูปองที่ใช้ได้มาก่อน, ตามด้วยคูปองที่ใช้แล้ว, และคูปองหมดอายุ
    return filtered.sort((a, b) => {
      const now = new Date();
      const aExpired = new Date(a.expiryDate) <= now;
      const bExpired = new Date(b.expiryDate) <= now;
      
      // คูปองที่ใช้ได้มาก่อน
      if (!a.isUsed && !aExpired && (b.isUsed || bExpired)) return -1;
      if (!b.isUsed && !bExpired && (a.isUsed || aExpired)) return 1;
      
      // คูปองที่ใช้แล้วมาก่อนคูปองหมดอายุ
      if (a.isUsed && !b.isUsed && bExpired) return -1;
      if (b.isUsed && !a.isUsed && aExpired) return 1;
      
      // เรียงตามวันหมดอายุ (ใกล้หมดอายุมาก่อน)
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });
  };

  const getCouponCounts = () => {
    const now = new Date();
    const available = myCoupons.filter(c => !c.isUsed && new Date(c.expiryDate) > now).length;
    const used = myCoupons.filter(c => c.isUsed).length;
    const expired = myCoupons.filter(c => !c.isUsed && new Date(c.expiryDate) <= now).length;
    
    return { available, used, expired, total: myCoupons.length };
  };

  const getCouponGradient = (coupon) => {
    const expiryStatus = getExpiryStatus(coupon.expiryDate);
    
    if (coupon.isUsed || expiryStatus.status === 'expired') {
      return 'from-gray-400 to-gray-500';
    }
    
    // Special gradients based on discount percentage
    if (coupon.discountPercent >= 50) {
      return 'from-[#FFD700] via-[#FFC107] to-[#FF8C00]'; // Gold gradient for high value
    } else if (coupon.discountPercent >= 30) {
      return 'from-[#6B46C1] to-[#444DDA]'; // Purple to blue for medium-high
    } else if (coupon.discountPercent >= 20) {
      return 'from-[#444DDA] to-[#5B63E8]'; // Standard blue
    } else {
      return 'from-[#5B63E8] to-[#7C81EA]'; // Light blue for lower discounts
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#444DDA]/20 border-t-[#444DDA] mx-auto"></div>
            <Gift className="h-8 w-8 text-[#444DDA] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 mt-4 font-medium">กำลังโหลดคูปองของคุณ...</p>
        </div>
      </div>
    );
  }

  const filteredCoupons = getFilteredCoupons();
  const counts = getCouponCounts();
  const availableToClaimCount = availableCoupons.filter(c => c.canClaim).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 shadow-2xl transform scale-110 animate-bounce">
            <div className="bg-gradient-to-r from-[#444DDA] to-[#5B63E8] w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Check className="h-12 w-12 text-white animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">เก็บคูปองสำเร็จ!</h3>
            <p className="text-gray-600 mt-2">กำลังเพิ่มเข้าคอลเลคชั่นของคุณ...</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-[#444DDA] via-[#5B63E8] to-[#444DDA] rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20 blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/20 blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <Gift className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">คูปองส่วนลดของฉัน</h1>
                  <p className="text-blue-100">จัดการและใช้คูปองส่วนลดของคุณ</p>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="flex space-x-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold">{counts.available}</div>
                  <div className="text-xs text-blue-100">ใช้ได้</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold">{counts.total}</div>
                  <div className="text-xs text-blue-100">ทั้งหมด</div>
                </div>
              </div>
            </div>
            
            {availableToClaimCount > 0 && (
              <div className="mt-6 bg-[#FFC107] text-gray-900 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <Zap className="h-6 w-6 mr-2" />
                  <span className="font-semibold">มีคูปองใหม่ {availableToClaimCount} ใบรอคุณอยู่!</span>
                </div>
                <button
                  onClick={() => setActiveTab('available')}
                  className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center"
                >
                  ดูเลย
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="bg-white rounded-3xl shadow-xl mb-8 p-2">
          <div className="flex bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setActiveTab('my-coupons')}
              className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'my-coupons'
                  ? 'bg-white text-[#444DDA] shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center">
                <Crown className="h-5 w-5 mr-2" />
                คูปองของฉัน
                <span className="ml-2 bg-[#444DDA]/10 text-[#444DDA] px-2 py-1 rounded-full text-xs font-bold">
                  {myCoupons.length}
                </span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all duration-300 relative ${
                activeTab === 'available'
                  ? 'bg-white text-[#444DDA] shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 mr-2" />
                คูปองที่เก็บได้
                {availableToClaimCount > 0 && (
                  <>
                    <span className="ml-2 bg-[#FFC107] text-gray-900 px-2 py-1 rounded-full text-xs font-bold">
                      {availableToClaimCount}
                    </span>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* My Coupons Tab Content */}
        {activeTab === 'my-coupons' && (
          <div className="space-y-6">
            {/* Quick Filter Pills */}
            {myCoupons.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">ดูเฉพาะ:</span>
                  
                  {[
                    { id: 'all', label: 'ทั้งหมด', count: counts.total, icon: Star, color: 'gray' },
                    { id: 'available', label: 'ใช้ได้', count: counts.available, icon: Check, color: 'green' },
                    { id: 'used', label: 'ใช้แล้ว', count: counts.used, icon: ShoppingBag, color: 'gray' },
                    { id: 'expired', label: 'หมดอายุ', count: counts.expired, icon: Clock, color: 'red' }
                  ].map((filter) => {
                    const Icon = filter.icon;
                    const isActive = couponFilter === filter.id;
                    
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setCouponFilter(filter.id)}
                        className={`
                          flex items-center px-4 py-2 rounded-full font-medium transition-all duration-200
                          ${isActive 
                            ? filter.id === 'available' 
                              ? 'bg-gradient-to-r from-[#444DDA] to-[#5B63E8] text-white shadow-lg transform scale-105'
                              : `bg-${filter.color}-500 text-white shadow-lg transform scale-105`
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {filter.label}
                        <span className={`ml-2 ${isActive ? 'bg-white/20' : 'bg-gray-200'} px-2 py-0.5 rounded-full text-xs font-bold`}>
                          {filter.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Coupons Display */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {filteredCoupons.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Gift className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">ไม่มีคูปองในหมวดนี้</h3>
                  <p className="text-gray-600 mb-6">ลองเปลี่ยนตัวกรองหรือเก็บคูปองใหม่</p>
                  
                  {couponFilter !== 'all' && (
                    <button
                      onClick={() => setCouponFilter('all')}
                      className="bg-gradient-to-r from-[#444DDA] to-[#5B63E8] text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                    >
                      ดูคูปองทั้งหมด
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCoupons.map((coupon) => {
                    const expiryStatus = getExpiryStatus(coupon.expiryDate);
                    const isExpired = expiryStatus.status === 'expired';
                    const gradient = getCouponGradient(coupon);
                    
                    return (
                      <div 
                        key={coupon._id} 
                        className={`relative group ${coupon.isUsed || isExpired ? 'opacity-75' : ''}`}
                      >
                        {/* Card Container - Compact Height */}
                        <div className={`
                          relative rounded-xl p-4 text-white overflow-hidden 
                          shadow-md hover:shadow-lg transition-all duration-300 
                          ${!coupon.isUsed && !isExpired ? 'hover:transform hover:-translate-y-0.5' : ''}
                          bg-gradient-to-br ${gradient}
                          h-[180px] flex flex-col
                        `}>
                          {/* Decorative Elements */}
                          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                          
                          {/* Ticket Perforation */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-gray-100 rounded-full -ml-1.5"></div>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-gray-100 rounded-full -mr-1.5"></div>
                          
                          {/* High Value Badge */}
                          {coupon.discountPercent >= 50 && !coupon.isUsed && !isExpired && (
                            <div className="absolute -top-1 -right-1 bg-[#FFC107] text-gray-900 rounded-full p-1 shadow-md animate-pulse">
                              <Trophy className="h-3.5 w-3.5" />
                            </div>
                          )}
                          
                          {/* Content */}
                          <div className="relative z-10 flex flex-col h-full">
                            {/* Header - Code and Percent in one line */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2 flex-1">
                                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                  <span className="font-bold text-base">{coupon.code}</span>
                                </div>
                                <div className="bg-[#FFC107] text-gray-900 px-2.5 py-1 rounded-full">
                                  <span className="font-black text-lg">-{coupon.discountPercent}%</span>
                                </div>
                                {coupon.discountPercent >= 30 && (
                                  <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse flex-shrink-0" />
                                )}
                              </div>
                              
                              {/* Status Icon */}
                              {coupon.isUsed && (
                                <div className="bg-white/20 backdrop-blur-sm w-7 h-7 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                                  <Check className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            
                            {/* Description - Flexible Height */}
                            <div className="flex-1 mb-2">
                              {coupon.description && (
                                <p className="text-sm text-white/90 line-clamp-2 leading-relaxed">
                                  {coupon.description}
                                </p>
                              )}
                            </div>
                            
                            {/* Footer Info - Bottom aligned */}
                            <div className="mt-auto">
                              <div className="flex items-end justify-between">
                                <div className="text-xs text-white/75">
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    <span>{new Date(coupon.expiryDate).toLocaleDateString('th-TH', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: '2-digit'
                                    })}</span>
                                  </div>
                                  {coupon.isUsed && coupon.usedAt && (
                                    <div className="flex items-center mt-1 text-white/60">
                                      <ShoppingBag className="h-3 w-3 mr-1" />
                                      <span className="text-xs">ใช้แล้ว {new Date(coupon.usedAt).toLocaleDateString('th-TH', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: '2-digit'
                                      })}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Status Badge - Bottom Right */}
                                <div className={`${
                                  coupon.isUsed 
                                    ? 'bg-gray-500 text-white' 
                                    : expiryStatus.bgColor + ' text-gray-900'
                                } px-2 py-1 rounded-full flex items-center`}>
                                  {coupon.isUsed ? (
                                    <>
                                      <Check className="h-2.5 w-2.5 mr-1" />
                                      <span className="font-medium text-xs">ใช้แล้ว</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-2.5 w-2.5 mr-1" />
                                      <span className="font-medium text-xs">{expiryStatus.text}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Available Coupons Tab Content */}
        {activeTab === 'available' && (
          <div className="space-y-6">
            {availableToClaimCount === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">ไม่มีคูปองใหม่ในขณะนี้</h3>
                <p className="text-gray-600">กลับมาดูใหม่ในภายหลัง อาจมีคูปองพิเศษรอคุณอยู่!</p>
              </div>
            ) : (
              <>
                {/* Available Coupons Header */}
                <div className="bg-gradient-to-r from-[#FFC107] to-[#FFD700] rounded-2xl shadow-lg p-6 text-gray-900">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-6 w-6 mr-3" />
                      <div>
                        <h3 className="text-xl font-bold">คูปองพิเศษสำหรับคุณ</h3>
                        <p className="text-gray-800">เก็บก่อนหมด! มีจำนวนจำกัด</p>
                      </div>
                    </div>
                    <div className="bg-gray-900 text-white px-4 py-2 rounded-full font-bold">
                      {availableToClaimCount} ใบ
                    </div>
                  </div>
                </div>

                {/* Available Coupons List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableCoupons.filter(c => c.canClaim).map((coupon) => {
                    const expiryStatus = getExpiryStatus(coupon.expiryDate);
                    const isClaimingThis = claimingCoupon === coupon._id;
                    
                    return (
                      <div 
                        key={coupon._id}
                        className={`
                          relative bg-white rounded-2xl overflow-hidden
                          ${isClaimingThis ? 'shadow-xl' : 'shadow-lg hover:shadow-2xl'}
                          transition-all duration-300 group
                          ${!isClaimingThis && 'hover:transform hover:-translate-y-1'}
                        `}
                      >
                        {/* Top Gradient Bar */}
                        <div className="h-2 bg-gradient-to-r from-[#444DDA] to-[#5B63E8]"></div>
                        
                        {/* Main Content */}
                        <div className="p-6">
                          {/* Header Section */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-4 py-2 rounded-full">
                                    <span className="font-bold text-lg tracking-wide">{coupon.code}</span>
                                  </div>
                                  {coupon.discountPercent >= 30 && (
                                    <div className="relative">
                                      <Sparkles className="h-5 w-5 text-[#FFC107] animate-pulse" />
                                      <div className="absolute inset-0 bg-[#FFC107]/20 blur-xl"></div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="bg-gradient-to-r from-[#FFC107] to-[#FFD700] text-gray-900 px-4 py-2 rounded-xl shadow-md">
                                  <span className="font-black text-2xl">-{coupon.discountPercent}%</span>
                                </div>
                              </div>
                              
                              {coupon.remainingClaims > 0 && coupon.remainingClaims <= 10 && (
                                <div className="flex items-center bg-red-50 text-red-600 px-3 py-1.5 rounded-full animate-pulse w-fit">
                                  <Zap className="h-4 w-4 mr-1" />
                                  <span className="text-sm font-bold">เหลือ {coupon.remainingClaims} ใบ!</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Description */}
                          {coupon.description && (
                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                              <p className="text-gray-700 leading-relaxed">{coupon.description}</p>
                            </div>
                          )}
                          
                          {/* Info Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-blue-50 rounded-xl p-3">
                              <div className="flex items-center text-blue-700">
                                <Calendar className="h-4 w-4 mr-2" />
                                <div>
                                  <p className="text-xs font-medium">วันหมดอายุ</p>
                                  <p className="text-sm font-bold">{new Date(coupon.expiryDate).toLocaleDateString('th-TH')}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className={`${expiryStatus.bgColor} rounded-xl p-3`}>
                              <div className={`flex items-center ${expiryStatus.color}`}>
                                <Clock className="h-4 w-4 mr-2" />
                                <div>
                                  <p className="text-xs font-medium">สถานะ</p>
                                  <p className="text-sm font-bold">{expiryStatus.text}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Claim Button */}
                          <button
                            onClick={() => handleClaimCoupon(coupon._id)}
                            disabled={isClaimingThis}
                            className={`
                              w-full relative overflow-hidden rounded-2xl font-bold text-white transition-all duration-300
                              ${isClaimingThis
                                ? 'bg-gray-400 py-5 cursor-wait'
                                : 'bg-gradient-to-r from-[#444DDA] to-[#5B63E8] py-4 hover:shadow-xl active:scale-[0.98]'
                              }
                            `}
                          >
                            {isClaimingThis ? (
                              <div className="flex items-center justify-center">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="ml-3">กำลังเก็บคูปอง</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center group">
                                <Plus className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                                <span>เก็บคูปองนี้</span>
                                <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                              </div>
                            )}
                            
                            {/* Animated Background */}
                            {!isClaimingThis && (
                              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            )}
                          </button>
                        </div>
                        
                        {/* Special Badge for High Value */}
                        {coupon.discountPercent >= 50 && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#FFD700] to-[#FFC107] text-gray-900 rounded-full p-3 shadow-lg animate-pulse">
                            <Trophy className="h-5 w-5" />
                          </div>
                        )}
                        
                        {/* Decorative Corner */}
                        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-br from-[#444DDA]/10 to-[#5B63E8]/10 rounded-tl-full"></div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}