"use client"
import { useState, useEffect } from 'react';
import { getFeaturedReviews } from '@/services/reviewsApi';

export default function FeaturedReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRating, setFilterRating] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Define theme colors
  const colors = {
    primary: '#444DDA',
    primaryLight: '#5A63E4',
    primaryLighter: '#F7F8FF',
    primaryDark: '#3841B2',
    text: '#333333',
    yellow: '#FFCA28', // ใช้สีเหลืองสำหรับดาว
    gray: '#9CA3AF',
    lightGray: '#F3F4F6',
    borderColor: '#E2E4EA', // สีกรอบที่เข้มขึ้น
  };
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const result = await getFeaturedReviews();
        
        if (result.success) {
          setReviews(result.data);
        } else {
          setError(result.message || 'ไม่สามารถโหลดรีวิวได้');
        }
      } catch (error) {
        setError('เกิดข้อผิดพลาดในการโหลดรีวิว: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadReviews();
  }, []);
  // Get unique service categories from reviews
  const getCategories = () => {
    const categories = new Set();
    reviews.forEach(review => {
      if (review.orderDetails && review.orderDetails.services) {
        review.orderDetails.services.forEach(service => {
          categories.add(service.title);
        });
      }
    });
    return ['all', ...Array.from(categories)];
  };

  // Filter reviews by rating and category
  const filteredReviews = reviews.filter(review => {
    const matchesRating = filterRating === 0 || review.rating >= filterRating;
    const matchesCategory = activeCategory === 'all' || 
      (review.orderDetails?.services?.some(service => service.title === activeCategory));
    return matchesRating && matchesCategory;
  });

  // Get average rating
  const averageRating = reviews.length 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 0;

  // Format date to be more minimal
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };
  // Open review details modal
  const openReviewDetails = (review) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  // Close review details modal
  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedReview(null), 300); // Clear after animation ends
  };

  // Get first two services from a review
  const getFirstTwoServices = (review) => {
    if (!review.orderDetails?.services || review.orderDetails.services.length === 0) {
      return [];
    }
    return review.orderDetails.services.slice(0, 2);
  };

  // Get remaining services count
  const getRemainingServicesCount = (review) => {
    if (!review.orderDetails?.services) return 0;
    return Math.max(0, review.orderDetails.services.length - 2);
  };

  // Star rating component
  const StarRating = ({ rating, showText = false }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg 
            key={star}
            className="w-4 h-4"
            style={{color: star <= rating ? colors.yellow : colors.lightGray}}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {showText && <span className="ml-2 text-sm">{rating}.0</span>}
      </div>
    );
  };
  // Modal component for review details
// ส่วนที่ 1: ประกาศ Component และ Helper Functions
const ReviewModal = ({ review, isOpen, onClose }) => {
  if (!review) return null;
  
  // Define theme colors (keeping same colors from parent component)
  const colors = {
    primary: '#444DDA',
    primaryLight: '#5A63E4',
    primaryLighter: '#F7F8FF',
    primaryDark: '#3841B2',
    text: '#333333',
    yellow: '#FFCA28',
    gray: '#9CA3AF',
    lightGray: '#F3F4F6',
    borderColor: '#E2E4EA',
  };

  // Format date to be more minimal
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  // Star rating component
  const StarRating = ({ rating, showText = false, size = "small" }) => {
    const starSize = size === "small" ? "w-4 h-4" : "w-5 h-5";
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg 
            key={star}
            className={starSize}
            style={{color: star <= rating ? colors.yellow : colors.lightGray}}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {showText && <span className="ml-2 text-sm">{rating}.0</span>}
      </div>
    );
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* ส่วนที่ 2: พื้นหลัง Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* ส่วนที่ 3: Modal Container */}
      <div 
        className={`bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl transition-all duration-300 ${
          isOpen ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'
        }`}
        style={{
          border: `1px solid ${colors.borderColor}`,
          boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)`
        }}
      >
        {/* ส่วนที่ 4: แถบสีด้านบน */}
        <div className="h-1.5 w-full" style={{ backgroundColor: colors.primary }}></div>
        
        {/* ส่วนที่ 5: ส่วนหัว Modal */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-gray-200">
          <h3 className="text-xl font-medium" style={{ color: colors.primary }}>รายละเอียดรีวิว</h3>
          <button 
            className="rounded-full p-1.5 transition-colors"
            style={{
              color: colors.primary + '80',
              backgroundColor: colors.primaryLighter
            }}
            onClick={onClose}
            aria-label="ปิด"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* ส่วนที่ 6: ข้อมูลผู้ใช้ */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex items-center">
            {/* รูปโปรไฟล์ผู้ใช้ */}
            <div 
              className="w-16 h-16 rounded-full overflow-hidden mr-5 flex-shrink-0"
              style={{
                boxShadow: `0 0 0 3px white, 0 0 0 5px ${colors.primary}30`,
              }}
            >
              {review.userDetails?.profilePicture ? (
                <img 
                  src={review.userDetails.profilePicture} 
                  alt={review.userDetails.username || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-full h-full flex items-center justify-center">
                  <svg 
                    className="w-7 h-7 text-gray-400" 
                    fill="currentColor" 
                    viewBox="0 0 20 20" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* รายละเอียดผู้ใช้ */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-medium text-gray-800 mb-1">
                  {review.userDetails?.fullName || review.userDetails?.username || 'ผู้ใช้งาน'}
                </h4>
                
                {/* ป้ายประเภทออเดอร์ (Company/Personal) */}
                {review.orderDetails?.orderType && (
                  <span 
                    className="px-2.5 py-1 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: review.orderDetails?.orderType === 'Company' 
                        ? '#E9F7FD' : colors.primaryLighter,
                      color: review.orderDetails?.orderType === 'Company' 
                        ? '#0EA5E9' : colors.primary
                    }}
                  >
                    {review.orderDetails.orderType}
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <StarRating rating={review.rating} size="medium" />
                <span className="ml-2 text-sm text-gray-500 flex items-center">
                  <span className="mx-1.5 text-gray-300">•</span>
                  <svg className="w-3.5 h-3.5 mr-1 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {review.createdAt ? formatDate(review.createdAt) : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* ส่วนที่ 7: เนื้อหารีวิว */}
        <div className="px-8 py-6">
          {/* หัวข้อ "ความคิดเห็น" */}
          <div className="flex items-center mb-4 bg-gray-50 py-2.5 px-4 rounded-lg shadow-sm">
            <div className="w-7 h-7 rounded-full flex items-center justify-center mr-3" style={{ 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
              boxShadow: `0 2px 4px ${colors.primary}40`
            }}>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="text-sm font-medium" style={{ color: colors.primary }}>ความคิดเห็น</h4>
          </div>
          
          {/* ข้อความรีวิว */}
          <div className="relative mx-2 mb-8 p-6 rounded-lg" style={{ 
            backgroundColor: 'white',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
            border: `1px solid ${colors.borderColor}`
          }}>
            {/* Decorative quote marks */}
            <svg className="absolute -left-3 -top-3 w-8 h-8 opacity-10" style={{ color: colors.primary }} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">{review.comment}</p>
            
            <svg className="absolute -right-3 -bottom-3 w-8 h-8 opacity-10 transform rotate-180" style={{ color: colors.primary }} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
          </div>
          
          {/* ส่วนที่ 8: รายการบริการที่ใช้ */}
          {review.orderDetails?.services && review.orderDetails.services.length > 0 && (
            <div>
              <div className="flex items-center mb-4 bg-gray-50 py-2.5 px-4 rounded-lg shadow-sm">
                <div className="w-7 h-7 rounded-full flex items-center justify-center mr-3" style={{ 
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`,
                  boxShadow: `0 2px 4px ${colors.primary}40`
                }}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                </div>
                <h4 className="text-sm font-medium" style={{ color: colors.primary }}>บริการที่ใช้</h4>
              </div>
              <div className="flex flex-wrap gap-2 px-2 mb-2">
                {review.orderDetails.services.map((service, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-3 py-1.5 text-sm rounded-md bg-white text-gray-700 transition-all hover:shadow-md"
                    style={{ 
                      border: `1px solid ${colors.primary}30`,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <span className="w-2 h-2 rounded-full mr-2" style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryLight})`
                    }}></span>
                    {service.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* ส่วนที่ 9: การตอบกลับจากทีมงาน */}
        {review.adminResponse && (
          <div className="px-8 py-6 relative" style={{backgroundColor: colors.primaryLighter}}>
            {/* แถบสีด้านซ้าย */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1.5"
              style={{backgroundColor: colors.primary}}
            ></div>
            
            <div className="flex items-start mb-4">
              {/* Avatar ทีมงาน */}
              <div 
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-4 flex-shrink-0"
                style={{
                  border: `1px solid ${colors.primary}`,
                  boxShadow: `0 2px 4px ${colors.primary}20`
                }}
              >
                <svg className="w-5 h-5" style={{color: colors.primary}} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div>
                <h4 className="text-base font-medium mb-1" style={{color: colors.primary}}>การตอบกลับจากทีมงาน</h4>
                {review.adminResponseAt && (
                  <div className="text-xs text-gray-600 flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1 text-gray-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    {formatDate(review.adminResponseAt)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="ml-14 bg-white p-4 rounded-lg shadow-md">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{review.adminResponse}</p>
            </div>
          </div>
        )}
        
        {/* ส่วนที่ 10: ส่วนท้าย Modal */}
        <div className="px-8 py-5 border-t border-gray-200 flex justify-end">
          <button 
            className="px-6 py-2.5 rounded-lg transition-all flex items-center shadow-sm hover:shadow hover:brightness-95"
            style={{
              backgroundColor: colors.primary,
              color: 'white',
            }}
            onClick={onClose}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
  return (
    <div className="min-h-screen bg-white">
      {/* Ultra simplified hero section - just a flat blue background with a single wave */}
      <div 
        className="relative pt-16 pb-20 px-4"
        style={{
          background: colors.primary,
        }}
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-light text-white mb-6">
            รีวิวจากลูกค้า
          </h1>
          
          <div className="flex items-start space-x-16">
            {/* Rating with minimum styling */}
            <div>
              <div className="text-6xl font-light text-white mb-1">{averageRating}</div>
              <div className="flex items-center space-x-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star}
                      className="w-5 h-5"
                      style={{color: colors.yellow}}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-white/80 text-sm">จาก 5 คะแนน</span>
              </div>
            </div>
            
            {/* Review count with minimum styling */}
            <div className="flex items-start">
              <svg className="w-8 h-8 text-white mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="text-2xl font-light text-white">{reviews.length} </div>
                <div className="text-white/80 text-sm">รีวิวทั้งหมด</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Single simple wave */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 1440 100" 
            preserveAspectRatio="none" 
            className="w-full h-16" 
            style={{ fill: 'white' }}
          >
            <path d="M0,100L1440,100L1440,40C1080,80,720,100,360,80L0,40Z" />
          </svg>
        </div>
      </div>
      {/* Filter area - now with more pronounced border */}
      <div className="max-w-6xl mx-auto px-4 mt-6 mb-10">
        <div className="bg-white rounded-xl p-5 shadow-md" style={{ border: `1px solid ${colors.borderColor}` }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Category pills */}
            <div className="flex flex-wrap gap-2"> 
              {getCategories().map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    activeCategory === category 
                      ? 'text-white shadow-md transform scale-105' 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: activeCategory === category ? colors.primary : 'transparent',
                    border: `1px solid ${activeCategory === category ? colors.primary : colors.borderColor}`,
                    boxShadow: activeCategory === category ? `0 4px 10px -2px ${colors.primary}30` : 'none'
                  }}
                >
                  {category === 'all' ? 'ทั้งหมด' : category}
                </button>
              ))}
            </div>
            
            {/* Rating filter */}
            <div className="flex items-center mt-3 sm:mt-0">
              <span className="text-sm text-gray-500 mr-3">คะแนน:</span>
              <div className="flex space-x-1">
                {[0, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setFilterRating(rating)}
                    className={`min-w-[40px] py-1.5 px-2 text-sm rounded-full transition-all text-center ${
                      filterRating === rating 
                        ? 'text-white shadow-md transform scale-105' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                    style={{
                      backgroundColor: filterRating === rating ? colors.primary : 'transparent',
                      border: `1px solid ${filterRating === rating ? colors.primary : colors.borderColor}`,
                      boxShadow: filterRating === rating ? `0 4px 10px -2px ${colors.primary}30` : 'none'
                    }}
                  >
                    {rating === 0 ? 'ทั้งหมด' : `${rating}+`}
                    {rating > 0 && (
                      <span className="ml-1" style={{color: filterRating === rating ? '#fff' : colors.yellow}}>★</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Loading state with improved animation */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
              <div 
                className="absolute inset-0 border-4 rounded-full animate-spin" 
                style={{borderColor: `${colors.primary} transparent transparent transparent`}}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor: colors.primary}}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Error state with improved design */}
        {error && (
          <div className="py-12 text-center">
            <div 
              className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full"
              style={{backgroundColor: '#FEF2F2'}}
            >
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">เกิดข้อผิดพลาด</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        )}

        {/* No results with improved design */}
        {!loading && !error && filteredReviews.length === 0 && (
          <div className="py-16 text-center">
            <div 
              className="mx-auto mb-4 w-20 h-20 flex items-center justify-center rounded-full"
              style={{backgroundColor: colors.primaryLighter}}
            >
              <svg className="w-10 h-10" style={{color: colors.primary}} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-light text-gray-900 mb-2">ไม่พบรีวิวที่ตรงกับเงื่อนไข</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              กรุณาลองเปลี่ยนตัวกรองเพื่อดูรีวิวอื่นๆ
            </p>
          </div>
        )}
{/* Modern review cards grid with clearer borders */}
{!loading && !error && filteredReviews.length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {filteredReviews.map((review) => (
      <div 
        key={review._id} 
        className="bg-white rounded-lg overflow-hidden transition-all hover:shadow-lg cursor-pointer"
        style={{ 
          border: '1.5px solid #E2E4EA', 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}
        onClick={() => openReviewDetails(review)}
      >
        {/* Card header with user info and type tag */}
        <div className="p-4 flex items-center border-b border-gray-200 relative">
          {/* Company/Personal tag at top right */}
          <div 
            className="absolute top-3 right-3 px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: review.orderDetails?.orderType === 'Company' 
                ? '#E9F7FD' : colors.primaryLighter,
              color: review.orderDetails?.orderType === 'Company' 
                ? '#0EA5E9' : colors.primary,
              border: '1px solid',
              borderColor: review.orderDetails?.orderType === 'Company' 
                ? '#BEE3F8' : `${colors.primary}30`
            }}
          >
            {review.orderDetails?.orderType || 'Personal'}
          </div>

          <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
            {review.userDetails?.profilePicture ? (
              <img 
                src={review.userDetails.profilePicture} 
                alt={review.userDetails.username || 'User'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="bg-gray-100 w-full h-full flex items-center justify-center">
                <svg 
                  className="w-5 h-5 text-gray-400" 
                  fill="currentColor" 
                  viewBox="0 0 20 20" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-gray-800 truncate">
              {review.userDetails?.fullName || review.userDetails?.username || 'ผู้ใช้งาน'}
            </h3>
            <div className="flex items-center">
              <StarRating rating={review.rating} />
            </div>
          </div>
        </div>
        
        {/* Review content with clear comment section */}
        <div className="p-4 border-b border-gray-200">
          {/* Comment section with clear heading */}
          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">ความคิดเห็น</h4>
            <p className="text-gray-700 text-sm line-clamp-3">
              {review.comment}
            </p>
          </div>
          
          {/* Services list with tag style */}
          {getFirstTwoServices(review).length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">บริการที่ใช้</h4>
              <div className="flex flex-wrap gap-1.5">
                {getFirstTwoServices(review).map((service, index) => (
                  <span 
                    key={index} 
                    className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-50 text-gray-600"
                    style={{ border: '1px solid #D1D5DB' }}
                  >
                    {service.title}
                  </span>
                ))}
                
                {/* Show remaining count if any */}
                {getRemainingServicesCount(review) > 0 && (
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500">
                    +{getRemainingServicesCount(review)}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Admin response badge */}
          {review.adminResponse && (
            <div className="mt-3">
              <span className="inline-block px-2 py-0.5 rounded text-xs" style={{
                backgroundColor: colors.primaryLighter, 
                color: colors.primary,
                border: `1px solid ${colors.primary}30`
              }}>
                มีการตอบกลับ
              </span>
            </div>
          )}
        </div>
        
        {/* Card footer with arrow icon instead of text button */}
        <div className="px-4 py-3 bg-gray-50 text-right">
          <button 
            className="text-sm font-medium flex items-center justify-end w-full"
            onClick={(e) => {
              e.stopPropagation();
              openReviewDetails(review);
            }}
          >
            <svg 
              className="w-5 h-5 transition-transform transform group-hover:translate-x-1" 
              style={{color: colors.primary}} 
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    ))}
  </div>
)}
        {/* Results count with improved design and more visible border */}
        {!loading && !error && filteredReviews.length > 0 && (
          <div className="mt-12 text-center">
            <div 
              className="inline-block px-5 py-2.5 rounded-full text-sm text-gray-600 font-light"
              style={{
                backgroundColor: colors.primaryLighter,
                border: `1px solid ${colors.primary}30`
              }}
            >
              แสดง {filteredReviews.length} จาก {reviews.length} รีวิว
            </div>
          </div>
        )}
      </div>
      
      {/* Review details modal */}
      <ReviewModal 
        review={selectedReview} 
        isOpen={showModal} 
        onClose={closeModal}
      />
    </div>
  );
}