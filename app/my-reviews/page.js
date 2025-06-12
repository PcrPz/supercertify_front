'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaStar, FaRegStar, FaEdit, FaPen, FaChartBar , FaStore} from 'react-icons/fa';
import { getReviewableOrders, getMyReviews, calculateAverageRating } from '@/services/reviewsApi';
import ReviewForm from '@/components/reviews/ReviewForm';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Simple Loader Component with minimal design
const SimpleLoader = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} border-4 border-gray-100 border-t-[#444DDA] rounded-full animate-spin`}></div>
  );
};

export default function MyReviewsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingCount: 0,
    reviewedCount: 0,
    averageRating: 0,
    ratingDistribution: [0, 0, 0, 0, 0] // 1-5 ดาว
  });
    // State สำหรับจัดการ Modal
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [modalType, setModalType] = useState('create'); // 'create' หรือ 'edit'
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);

  // โหลดข้อมูลเมื่อเข้าสู่หน้า
  useEffect(() => {
    fetchData();
  }, []);

  // ดึงข้อมูล Orders และ Reviews
  const fetchData = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูล Orders ที่รอรีวิว
      const pendingResult = await getReviewableOrders();
      if (pendingResult.success) {
        setPendingOrders(pendingResult.data || []);
      } else {
        toast.error('ไม่สามารถดึงข้อมูล Orders ที่รอรีวิวได้');
        setPendingOrders([]);
      }

      // ดึงข้อมูล Reviews ที่เคยทำไปแล้ว
      const reviewsResult = await getMyReviews();
      if (reviewsResult.success) {
        setMyReviews(reviewsResult.data || []);
      } else {
        toast.error('ไม่สามารถดึงข้อมูลรีวิวของคุณได้');
        setMyReviews([]);
      }

      // คำนวณสถิติ
      calculateStats(pendingResult.data || [], reviewsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // คำนวณสถิติสำหรับแสดงในหน้า
  const calculateStats = (pendingData, reviewsData) => {
    // จำนวน orders ที่รอรีวิว
    const pendingCount = pendingData.length;
    
    // จำนวนรีวิวที่ทำไปแล้ว
    const reviewedCount = reviewsData.length;
    
    // คะแนนเฉลี่ย
    const averageRating = calculateAverageRating(reviewsData);
    
    // การกระจายของคะแนน
    const ratingDistribution = [0, 0, 0, 0, 0]; // 1-5 ดาว
    reviewsData.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating - 1]++;
      }
    });
    
    setStats({
      pendingCount,
      reviewedCount,
      averageRating,
      ratingDistribution
    });
  };

    const handleCreateReview = (order) => {
    setSelectedOrder(order);
    setSelectedReview(null);
    setModalType('create');
    setShowReviewModal(true);
    };

    // ฟังก์ชันเปิด Modal สำหรับแก้ไขรีวิว
    const handleEditReview = (review) => {
    setSelectedReview(review);
    setSelectedOrder(null);
    setModalType('edit');
    setShowReviewModal(true);
    };

    // ฟังก์ชันปิด Modal
    const handleCloseModal = () => {
    setShowReviewModal(false);
    // เคลียร์ข้อมูลหลังจากปิด Modal
    setTimeout(() => {
        setSelectedOrder(null);
        setSelectedReview(null);
    }, 300); // รอให้ animation เสร็จก่อน
    };

    // ฟังก์ชันที่จะถูกเรียกเมื่อการทำรีวิวสำเร็จ
    const handleReviewSuccess = (reviewData) => {
    console.log('Review success:', reviewData);
    
    // ปิด Modal
    setShowReviewModal(false);
    
    // แสดงการแจ้งเตือน
    toast.success(
        modalType === 'create' 
        ? 'ขอบคุณสำหรับรีวิวของคุณ!' 
        : 'แก้ไขรีวิวเรียบร้อยแล้ว!',
        {
        position: "top-right",
        autoClose: 3000
        }
    );
    
    // โหลดข้อมูลใหม่โดยใช้ fetchData ที่มีอยู่แล้ว
    fetchData();
    
    // เคลียร์ข้อมูล
    setTimeout(() => {
        setSelectedOrder(null);
        setSelectedReview(null);
    }, 300);
    };

  // แสดงคะแนนเป็นดาว
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className="text-[#FFC107]" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-gray-300" />);
      }
    }
    return (
      <div className="flex">{stars}</div>
    );
  };

  // แสดงกราฟการกระจายของคะแนน - ปรับให้ minimal
  const renderRatingDistribution = () => {
    const maxCount = Math.max(...stats.ratingDistribution, 1);
    
    return (
      <div className="flex items-end h-12 space-x-1 mt-3">
        {stats.ratingDistribution.map((count, index) => {
          const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="text-xs text-gray-500">{count}</div>
              <div 
                className={`w-full ${count > 0 ? 'bg-[#444DDA]/40' : 'bg-gray-100'} rounded-sm`}
                style={{ height: `${Math.max(height, 5)}%`, minHeight: '4px' }}
              ></div>
              <div className="text-xs mt-1 text-gray-500">{index + 1}</div>
            </div>
          );
        })}
      </div>
    );
  };


// แสดงรายการ Orders ที่รอรีวิว - เพิ่มความมนและเอฟเฟกต์
const renderPendingOrders = () => {
  if (pendingOrders.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3 shadow-inner">
          <FaPen className="text-gray-400" size={20} />
        </div>
        <p className="text-gray-600 font-medium">ไม่มีรายการที่รอรีวิว</p>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">รายการที่เสร็จสมบูรณ์แล้วจะปรากฏที่นี่เพื่อให้คุณรีวิว</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pendingOrders.map((order) => {
        // ดึงจำนวนบริการในออเดอร์
        const serviceCount = order.services?.length || 0;
        
        // ฟอร์แมตวันที่ให้สั้นลง - แสดงเฉพาะวันและเดือน
        const completedDate = new Date(order.completedAt || order.updatedAt);
        const formattedDate = completedDate.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
        });
        
        // ตรวจสอบจำนวนบริการและจำกัดการแสดงผล
        const services = order.services || [];
        const hasMultipleServices = services.length > 3;
        const displayServices = hasMultipleServices ? services.slice(0, 3) : services;
        
        return (
          <div key={order._id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-[#444DDA]/30 group">
            {/* ส่วนหัวแสดงรหัสออเดอร์ */}
            <div className="p-4 bg-gradient-to-r from-[#444DDA]/15 to-[#444DDA]/5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 mb-1">รหัสออเดอร์</p>
                <p className="font-medium text-[#444DDA] transition-transform">
                  {order.TrackingNumber || order.orderNumber || order._id.substring(0, 8)}
                </p>
              </div>
              <span className="text-xs bg-white px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 shadow-sm">
                {formattedDate}
              </span>
            </div>
            
            {/* ส่วนเนื้อหาแสดงบริการและราคา */}
            <div className="p-4">
              {/* แสดงบริการแบบสรุป */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                  <span className="inline-block w-1 h-1 bg-[#444DDA] rounded-full mr-1.5"></span>
                  บริการในออเดอร์นี้
                </p>
                {services.length > 0 ? (
                  <div className="max-h-24 overflow-y-auto pr-1 custom-scrollbar bg-gray-50 rounded-lg p-2">
                    <ul className="text-sm text-gray-700 space-y-1.5">
                      {displayServices.map((service, idx) => (
                        <li key={idx} className="flex justify-between items-start hover:bg-white p-1 rounded-lg transition-colors">
                          <span className="truncate mr-2 leading-5">• {service.title || 'บริการ'}</span>
                          <span className="whitespace-nowrap text-gray-500 text-xs px-1.5 py-0.5 bg-white rounded-md shadow-sm">
                            x{service.quantity || 1}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {hasMultipleServices && (
                      <p className="text-xs text-gray-500 mt-2 italic text-center bg-white py-1 rounded-md">
                        + อีก {services.length - 3} บริการ
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-500">ไม่มีข้อมูลบริการ</p>
                  </div>
                )}
              </div>
              
              {/* ราคารวม */}
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 mb-4">
                <p className="text-sm text-gray-600 ml-2">ราคารวม</p>
                <p className="font-medium text-[#444DDA] mr-1 bg-[#444DDA]/5 px-3 py-0.5 rounded-full">
                  ฿{(order.TotalPrice || order.total || 0).toLocaleString()}
                </p>
              </div>
              
              {/* ปุ่มเขียนรีวิว */}
              <button
                onClick={() => handleCreateReview(order)}
                className="w-full py-2.5 bg-[#444DDA] hover:bg-[#444DDA]/90 text-white rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all group-hover:shadow-md group-hover:translate-y-[-1px]"
              >
                <FaPen size={12} />
                เขียนรีวิว
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// แสดงรายการ Orders ที่รีวิวแล้ว - เพิ่มความมนและเอฟเฟกต์
const renderCompletedOrders = () => {
  if (myReviews.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3 shadow-inner">
          <FaStar className="text-[#FFC107]" size={24} />
        </div>
        <p className="text-gray-600 font-medium">คุณยังไม่มีรีวิว</p>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">รีวิวที่คุณเขียนจะปรากฏที่นี่</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {myReviews.map((review) => {
        // ฟอร์แมตวันที่
        const reviewDate = new Date(review.createdAt);
        const formattedDate = reviewDate.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
        });
        
        return (
          <div key={review._id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-[#FFC107]/30 group">
            {/* ส่วนหัวแสดงรหัสออเดอร์ - ใช้สีเหลือง */}
            <div className="p-4 bg-gradient-to-r from-[#FFC107]/15 to-[#FFC107]/5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 mb-1">รหัสออเดอร์</p>
                <p className="font-medium text-[#FFC107] transition-transform">
                  {review.order?.TrackingNumber || review.order?.orderNumber || (review.order?._id && review.order._id.substring(0, 8)) || 'ไม่ระบุ'}
                </p>
              </div>
              <span className="text-xs bg-white px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 shadow-sm">
                {formattedDate}
              </span>
            </div>
            
            {/* ส่วนเนื้อหาแสดงข้อมูลรีวิว */}
            <div className="p-4">
              {/* แสดงคะแนนดาวและคำวิจารณ์ */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-gray-600 flex items-center">
                    <span className="inline-block w-1 h-1 bg-[#FFC107] rounded-full mr-1.5"></span>
                    คะแนนรีวิวของคุณ
                  </p>
                  <div className="flex items-center gap-1 bg-[#FFC107]/5 px-2 py-0.5 rounded-full">
                    {renderStars(review.rating)}
                    <span className="text-xs text-[#FFC107] font-medium ml-1">({review.rating}.0)</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg mt-3 hover:shadow-sm transition-shadow relative">
                  <div className="absolute -top-1 -left-1 w-5 h-5 bg-[#FFC107]/20 rounded-md flex items-center justify-center">
                    <FaStar className="text-[#FFC107]" size={8} />
                  </div>
                  <p className="text-sm text-gray-700">
                    {review.comment || 'ไม่มีความคิดเห็นเพิ่มเติม'}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-200 mb-4">
              </div>
              
              {/* ปุ่มแก้ไขรีวิว */}
              <button
                onClick={() => handleEditReview(review)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2 border border-gray-200 transition-all group-hover:border-[#FFC107]/30 group-hover:shadow-sm group-hover:translate-y-[-1px]"
              >
                <FaEdit size={12} />
                แก้ไขรีวิว
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// รวมแสดงทั้ง Orders ที่รอรีวิวและรีวิวที่ทำแล้ว - เพิ่มความมนและเอฟเฟกต์
const renderAllReviews = () => {
  if (pendingOrders.length === 0 && myReviews.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3 shadow-inner">
          <FaChartBar className="text-gray-400" size={20} />
        </div>
        <p className="text-gray-600 font-medium">ไม่มีข้อมูลรีวิว</p>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">เมื่อคุณทำรายการเสร็จสมบูรณ์ จะสามารถรีวิวได้ที่นี่</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {pendingOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-5 text-gray-800 flex items-center gap-2">
            <div className="p-1.5 bg-[#444DDA]/10 rounded-md">
              <FaPen className="text-[#444DDA]" size={14} />
            </div>
            รอการรีวิว ({pendingOrders.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingOrders.map((order) => {
              // ฟอร์แมตวันที่ให้สั้นลง
              const completedDate = new Date(order.completedAt || order.updatedAt);
              const formattedDate = completedDate.toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
              });
              
              // ตรวจสอบจำนวนบริการและจำกัดการแสดงผล
              const services = order.services || [];
              const hasMultipleServices = services.length > 3;
              const displayServices = hasMultipleServices ? services.slice(0, 3) : services;
              
              return (
                <div key={order._id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-[#444DDA]/30 group">
                  {/* ส่วนหัวแสดงรหัสออเดอร์ */}
                  <div className="p-4 bg-gradient-to-r from-[#444DDA]/15 to-[#444DDA]/5 border-b border-gray-100 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute w-10 h-10 bg-[#444DDA]/10 rounded-full -top-5 -left-5"></div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">รหัสออเดอร์</p>
                      <p className="font-medium text-[#444DDA]  transition-transform">
                        {order.TrackingNumber || order.orderNumber || order._id.substring(0, 8)}
                      </p>
                    </div>
                    <span className="text-xs bg-white px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 shadow-sm">
                      {formattedDate}
                    </span>
                  </div>
                  
                  {/* ส่วนเนื้อหาแสดงบริการและราคา */}
                  <div className="p-4">
                    {/* แสดงบริการแบบสรุป */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                        <span className="inline-block w-1 h-1 bg-[#444DDA] rounded-full mr-1.5"></span>
                        บริการในออเดอร์นี้
                      </p>
                      {services.length > 0 ? (
                        <div className="max-h-24 overflow-y-auto pr-1 custom-scrollbar bg-gray-50 rounded-lg p-2">
                          <ul className="text-sm text-gray-700 space-y-1.5">
                            {displayServices.map((service, idx) => (
                              <li key={idx} className="flex justify-between items-start hover:bg-white p-1 rounded-lg transition-colors">
                                <span className="truncate mr-2 leading-5">• {service.title || 'บริการ'}</span>
                                <span className="whitespace-nowrap text-gray-500 text-xs px-1.5 py-0.5 bg-white rounded-md shadow-sm">
                                  x{service.quantity || 1}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {hasMultipleServices && (
                            <p className="text-xs text-gray-500 mt-2 italic text-center bg-white py-1 rounded-md">
                              + อีก {services.length - 3} บริการ
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <p className="text-sm text-gray-500">ไม่มีข้อมูลบริการ</p>
                        </div>
                      )}
                    </div>
                    
                    {/* ราคารวม */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 mb-4">
                      <p className="text-sm text-gray-600 ml-2">ราคารวม</p>
                      <p className="font-medium text-[#444DDA] mr-1 bg-[#444DDA]/5 px-3 py-0.5 rounded-full">
                        ฿{(order.TotalPrice || order.total || 0).toLocaleString()}
                      </p>
                    </div>
                    
                    {/* ปุ่มเขียนรีวิว */}
                    <button
                      onClick={() => handleCreateReview(order)}
                      className="w-full py-2.5 bg-[#444DDA] hover:bg-[#444DDA]/90 text-white rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all group-hover:shadow-md group-hover:translate-y-[-1px]"
                    >
                      <FaPen size={12} />
                      เขียนรีวิว
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {myReviews.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-5 text-gray-800 flex items-center gap-2">
            <div className="p-1.5 bg-[#FFC107]/10 rounded-md">
              <FaStar className="text-[#FFC107]" size={14} />
            </div>
            รีวิวของฉัน ({myReviews.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myReviews.map((review) => {
              // ฟอร์แมตวันที่
              const reviewDate = new Date(review.createdAt);
              const formattedDate = reviewDate.toLocaleDateString('th-TH', {
                day: 'numeric', 
                month: 'short'
              });
              
              return (
                <div key={review._id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-[#FFC107]/30 group">
                  {/* ส่วนหัวแสดงรหัสออเดอร์ - ใช้สีเหลือง */}
                  <div className="p-4 bg-gradient-to-r from-[#FFC107]/15 to-[#FFC107]/5 border-b border-gray-100 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute w-10 h-10 bg-[#FFC107]/10 rounded-full -top-5 -left-5"></div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">รหัสออเดอร์</p>
                      <p className="font-medium text-[#FFC107]  transition-transform">
                        {review.order?.TrackingNumber || review.order?.orderNumber || (review.order?._id && review.order._id.substring(0, 8)) || 'ไม่ระบุ'}
                      </p>
                    </div>
                    <span className="text-xs bg-white px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 shadow-sm">
                      {formattedDate}
                    </span>
                  </div>
                  
                  {/* ส่วนเนื้อหาแสดงข้อมูลรีวิว */}
                  <div className="p-4">
                    {/* แสดงคะแนนดาวและคำวิจารณ์ */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-gray-600 flex items-center">
                          <span className="inline-block w-1 h-1 bg-[#FFC107] rounded-full mr-1.5"></span>
                          คะแนนรีวิวของคุณ
                        </p>
                        <div className="flex items-center gap-1 bg-[#FFC107]/5 px-2 py-0.5 rounded-full">
                          {renderStars(review.rating)}
                          <span className="text-xs text-[#FFC107] font-medium ml-1">({review.rating}.0)</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg mt-3 hover:shadow-sm transition-shadow relative">
                        <div className="absolute -top-1 -left-1 w-5 h-5 bg-[#FFC107]/20 rounded-md flex items-center justify-center">
                          <FaStar className="text-[#FFC107]" size={8} />
                        </div>
                        <p className="text-sm text-gray-700">
                          {review.comment || 'ไม่มีความคิดเห็นเพิ่มเติม'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 mb-4">
                    </div>
                    
                    {/* ปุ่มแก้ไขรีวิว */}
                    <button
                      onClick={() => handleEditReview(review)}
                      className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2 border border-gray-200 transition-all group-hover:border-[#FFC107]/30 group-hover:shadow-sm group-hover:translate-y-[-1px]"
                    >
                      <FaEdit size={12} />
                      แก้ไขรีวิว
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-medium mb-8 text-gray-800">การรีวิวของฉัน</h1>
      
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <SimpleLoader size="large" />
        </div>
      ) : (
        <>
        {/* สรุปข้อมูลรีวิว */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-gray-100 hover:border-[#444DDA]/30 transition-colors">
        <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="flex-1">
            <h2 className="text-lg font-medium mb-5 flex items-center gap-2 text-gray-800">
                <div className="p-1.5 bg-[#444DDA]/10 rounded-md">
                <FaChartBar className="text-[#444DDA]" size={18} />
                </div>
                สรุปข้อมูลรีวิว
            </h2>
            <div className="grid grid-cols-3 gap-8">
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#444DDA]/5 to-[#444DDA]/10 border border-[#444DDA]/20 hover:shadow-md transition-all hover-bounce">
                <p className="text-sm text-gray-600 mb-1">รอการรีวิว</p>
                <p className="text-2xl font-bold text-[#444DDA]">{stats.pendingCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#444DDA]/5 to-[#444DDA]/10 border border-[#444DDA]/20 hover:shadow-md transition-all hover-bounce">
                <p className="text-sm text-gray-600 mb-1">รีวิวแล้ว</p>
                <p className="text-2xl font-bold text-[#444DDA]">{stats.reviewedCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#444DDA]/5 to-[#444DDA]/10 border border-[#444DDA]/20 hover:shadow-md transition-all hover-bounce">
                <p className="text-sm text-gray-600 mb-1">คะแนนเฉลี่ย</p>
                <p className="text-2xl font-bold flex items-center text-[#444DDA]">
                    {stats.averageRating.toFixed(1)}
                    <FaStar className="text-[#FFC107] ml-1" size={16} />
                </p>
                </div>
            </div>
            </div>
              
            <div className="flex-1 border-l border-gray-100 pl-8 mt-4 md:mt-0">
            <p className="text-sm text-gray-600 mb-3 font-medium">การกระจายของคะแนน</p>
            {stats.reviewedCount > 0 ? (
                renderRatingDistribution()
            ) : (
                <div className="flex items-center justify-center h-16 bg-gray-50 rounded-lg">
                <p className="text-gray-400 text-sm">ยังไม่มีข้อมูลการให้คะแนน</p>
                </div>
            )}
            </div>
        </div>
        </div>
          
        {/* แท็บสำหรับเลือกดูข้อมูล - เพิ่มความมน */}
        <div className="border-b border-gray-200 mb-8 ">
        <div className="flex space-x-8">
            {/* แท็บ "ทั้งหมด" */}
            <button
            className={`pb-2 px-3 relative ${
                activeTab === 'all' 
                ? 'text-[#444DDA] font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            } transition-colors`}
            onClick={() => setActiveTab('all')}
            >
            <div className="flex items-center gap-1.5">
                <FaChartBar size={14} className={activeTab === 'all' ? 'text-[#444DDA]' : 'text-gray-400'} />
                ทั้งหมด
            </div>
            {activeTab === 'all' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#444DDA] rounded-full"></span>
            )}
            </button>
            
            {/* แท็บ "รอการรีวิว" */}
            <button
            className={`pb-2 px-3 relative ${
                activeTab === 'pending' 
                ? 'text-[#444DDA] font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            } transition-colors`}
            onClick={() => setActiveTab('pending')}
            >
            <div className="flex items-center gap-1.5">
                <FaPen size={12} className={activeTab === 'pending' ? 'text-[#444DDA]' : 'text-gray-400'} />
                รอการรีวิว {stats.pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#444DDA] text-white rounded-full text-xs inline-flex items-center justify-center min-w-[20px] shadow-sm">
                    {stats.pendingCount}
                </span>
                )}
            </div>
            {activeTab === 'pending' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#444DDA] rounded-full"></span>
            )}
            </button>
            
            {/* แท็บ "รีวิวแล้ว" */}
            <button
            className={`pb-2 px-3 relative ${
                activeTab === 'completed' 
                ? 'text-[#444DDA] font-medium' 
                : 'text-gray-500 hover:text-gray-700'
            } transition-colors`}
            onClick={() => setActiveTab('completed')}
            >
            <div className="flex items-center gap-1.5">
                <FaStar size={12} className={activeTab === 'completed' ? 'text-[#444DDA]' : 'text-gray-400'} />
                รีวิวแล้ว {stats.reviewedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#FFC107] text-white rounded-full text-xs inline-flex items-center justify-center min-w-[20px] shadow-sm">
                    {stats.reviewedCount}
                </span>
                )}
            </div>
            {activeTab === 'completed' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#444DDA] rounded-full"></span>
            )}
            </button>
        </div>
        </div>
                
            {/* แสดงข้อมูลตามแท็บที่เลือก */}
            <div>
            {activeTab === 'all' && renderAllReviews()}
            {activeTab === 'pending' && renderPendingOrders()}
            {activeTab === 'completed' && renderCompletedOrders()}
            </div>


{/* Modal สำหรับสร้าง/แก้ไขรีวิว */}
{showReviewModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
    <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-lg animate-scaleIn">
      <div className="p-5 border-b border-gray-100 relative">
        {/* ปุ่มปิดด้านขวาบน */}
        <button 
          onClick={handleCloseModal}
          className="absolute right-5 top-5 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* หัวข้อตรงกลาง */}
        <h2 className="text-xl font-medium text-gray-800 flex items-center gap-2 justify-center">
          {modalType === 'create' ? (
            <>
              <div className="p-1.5 bg-[#444DDA]/10 rounded-md">
                <FaPen className="text-[#444DDA]" size={12} />
              </div>
              เขียนรีวิว
            </>
          ) : (
            <>
              <div className="p-1.5 bg-[#FFC107]/10 rounded-md">
                <FaEdit className="text-[#FFC107]" size={12} />
              </div>
              แก้ไขรีวิว
            </>
          )}
        </h2>
      </div>
      
      <div className="p-5">
        {modalType === 'create' && selectedOrder && (
          <div className="mb-5 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center">
              {/* เปลี่ยนจากชื่อบริการเป็น TrackingNumber */}
              <h3 className="font-medium text-gray-800 flex items-center">
                <span className="mr-2 text-gray-500">รหัสออเดอร์:</span>
                <span className="text-[#444DDA]">
                  {selectedOrder.TrackingNumber || selectedOrder.orderNumber || selectedOrder._id.substring(0, 8)}
                </span>
              </h3>
              
              {/* ไอคอนด้านขวา */}
              <div className="w-12 h-12 rounded-full bg-[#444DDA]/10 flex items-center justify-center shadow-sm">
                <FaStore className="text-[#444DDA]" size={16} />
              </div>
            </div>
            
            {/* แสดงรายละเอียดออเดอร์ */}
            <div className="mt-3 flex flex-wrap gap-2">
              {/* แสดงวันที่ */}
              <div className="bg-white px-3 py-1.5 rounded-full border border-gray-200 text-sm shadow-sm">
                <span className="text-gray-500">วันที่: </span>
                <span className="font-medium text-gray-700">
                  {new Date(selectedOrder.completedAt || selectedOrder.updatedAt).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              {/* แสดงราคา */}
              <div className="bg-white px-3 py-1.5 rounded-full border border-gray-200 text-sm shadow-sm">
                <span className="text-gray-500">ราคา: </span>
                <span className="font-medium text-[#444DDA]">
                  ฿{(selectedOrder.TotalPrice || selectedOrder.total || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* แสดงจำนวนบริการแบบสรุป */}
            {selectedOrder.services && selectedOrder.services.length > 0 && (
              <div className="mt-3 bg-[#444DDA]/5 p-2 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">บริการทั้งหมด:</span> {selectedOrder.services.length} รายการ
                </p>
              </div>
            )}
          </div>
        )}

        {modalType === 'edit' && selectedReview && (
          <div className="mb-5 p-4 bg-gradient-to-r from-[#FFC107]/5 to-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center">
              {/* แสดง TrackingNumber */}
              <h3 className="font-medium text-gray-800 flex items-center">
                <span className="mr-2 text-gray-500">รหัสออเดอร์:</span>
                <span className="text-[#FFC107]">
                  {selectedReview.order?.TrackingNumber || selectedReview.order?.orderNumber || 
                   (selectedReview.order?._id && selectedReview.order._id.substring(0, 8)) || 'ไม่ระบุ'}
                </span>
              </h3>
              
              {/* ไอคอนด้านขวา */}
              <div className="w-12 h-12 rounded-full bg-[#FFC107]/10 flex items-center justify-center shadow-sm">
                <FaStar className="text-[#FFC107]" size={16} />
              </div>
            </div>
            
            {/* แสดงวันที่รีวิว */}
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="bg-white px-3 py-1.5 rounded-full border border-gray-200 text-sm shadow-sm">
                <span className="text-gray-500">วันที่รีวิว: </span>
                <span className="font-medium text-gray-700">
                  {new Date(selectedReview.createdAt).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              {/* แสดงคะแนนปัจจุบัน */}
              <div className="bg-white px-3 py-1.5 rounded-full border border-gray-200 text-sm shadow-sm flex items-center">
                <span className="text-gray-500 mr-1">คะแนนปัจจุบัน: </span>
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    i < selectedReview.rating 
                      ? <FaStar key={i} className="text-[#FFC107] text-xs" />
                      : <FaRegStar key={i} className="text-gray-300 text-xs" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* แสดง ReviewForm โดยส่ง props ตามประเภท Modal */}
        {modalType === 'create' && selectedOrder && (
          <ReviewForm 
            orderId={selectedOrder._id}
            onSuccess={handleReviewSuccess}
          />
        )}
        
        {modalType === 'edit' && selectedReview && (
          <ReviewForm 
            reviewId={selectedReview._id}
            onSuccess={handleReviewSuccess}
          />
        )}
      </div>
    </div>
  </div>
)}
        </>
      )}
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
    </div>
    
  );
}