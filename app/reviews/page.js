'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaStar, FaRegStar, FaEdit, FaPen, FaChartBar } from 'react-icons/fa';
import { getReviewableOrders, getMyReviews, calculateAverageRating } from '@/services/reviewsApi';
import ReviewForm from '@/components/reviews/ReviewForm';

// ตัวเลือกที่ 1: สร้าง Loading Component แบบง่าย
const SimpleLoader = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin`}></div>
  );
};


export default function MyReviewsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingCount: 0,
    reviewedCount: 0,
    averageRating: 0,
    ratingDistribution: [0, 0, 0, 0, 0] // 1-5 ดาว
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' หรือ 'edit'

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

  // เปิด Modal สร้างรีวิว
  const handleCreateReview = (order) => {
    setSelectedOrder(order);
    setSelectedReview(null);
    setModalType('create');
    setShowReviewModal(true);
  };

  // เปิด Modal แก้ไขรีวิว
  const handleEditReview = (review) => {
    setSelectedReview(review);
    setSelectedOrder(null);
    setModalType('edit');
    setShowReviewModal(true);
  };

  // ปิด Modal
  const handleCloseModal = () => {
    setShowReviewModal(false);
    setSelectedOrder(null);
    setSelectedReview(null);
  };

  // เมื่อรีวิวสำเร็จ
  const handleReviewSuccess = () => {
    handleCloseModal();
    fetchData(); // โหลดข้อมูลใหม่
    toast.success(modalType === 'create' ? 'สร้างรีวิวสำเร็จ' : 'แก้ไขรีวิวสำเร็จ');
  };

  // แสดงคะแนนเป็นดาว
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className="text-yellow-500" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-500" />);
      }
    }
    return (
      <div className="flex">{stars}</div>
    );
  };

  // แสดงกราฟการกระจายของคะแนน
  const renderRatingDistribution = () => {
    const maxCount = Math.max(...stats.ratingDistribution);
    
    return (
      <div className="flex items-end h-16 space-x-2 mt-2">
        {stats.ratingDistribution.map((count, index) => {
          const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
          
          return (
            <div key={index} className="flex flex-col items-center">
              <div className="text-xs">{count}</div>
              <div 
                className="w-8 bg-blue-500 rounded-t" 
                style={{ height: `${height}%`, minHeight: count > 0 ? '4px' : '0' }}
              ></div>
              <div className="text-xs mt-1">{index + 1}★</div>
            </div>
          );
        })}
      </div>
    );
  };

  // แสดงรายการ Orders ที่รอรีวิว
  const renderPendingOrders = () => {
    if (pendingOrders.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">ไม่มีรายการที่รอรีวิว</p>
          <p className="text-sm text-gray-400 mt-2">รายการที่เสร็จสมบูรณ์แล้วจะปรากฏที่นี่เพื่อให้คุณรีวิว</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pendingOrders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-lg">{order.service?.name || 'บริการ'}</h3>
                <p className="text-sm text-gray-500">
                  รหัสออเดอร์: {order.orderNumber || order._id.substring(0, 8)}
                </p>
                <p className="text-sm text-gray-500">
                  วันที่เสร็จสมบูรณ์: {new Date(order.completedAt || order.updatedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <p className="font-medium mt-2">
                  ฿{order.total?.toLocaleString() || '0'}
                </p>
              </div>
              {order.service?.image && (
                <div className="w-16 h-16 rounded overflow-hidden">
                  <img 
                    src={order.service.image} 
                    alt={order.service.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => handleCreateReview(order)}
                className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center gap-2"
              >
                <FaPen size={14} />
                เขียนรีวิว
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // แสดงรายการรีวิวที่เคยทำไปแล้ว
  const renderMyReviews = () => {
    if (myReviews.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">คุณยังไม่มีรีวิว</p>
          <p className="text-sm text-gray-400 mt-2">รีวิวที่คุณเขียนจะปรากฏที่นี่</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myReviews.map((review) => (
          <div key={review._id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-lg">{review.order?.service?.name || 'บริการ'}</h3>
                <div className="mt-1">
                  {renderStars(review.rating)}
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            
            <div className="mt-3">
              <p className="text-gray-700 text-sm line-clamp-3">
                {review.comment || 'ไม่มีความคิดเห็นเพิ่มเติม'}
              </p>
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => handleEditReview(review)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md flex items-center justify-center gap-2"
              >
                <FaEdit size={14} />
                แก้ไขรีวิว
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // รวมแสดงทั้ง Orders ที่รอรีวิวและรีวิวที่ทำแล้ว
  const renderAllReviews = () => {
    if (pendingOrders.length === 0 && myReviews.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">ไม่มีข้อมูลรีวิว</p>
          <p className="text-sm text-gray-400 mt-2">เมื่อคุณทำรายการเสร็จสมบูรณ์ จะสามารถรีวิวได้ที่นี่</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {pendingOrders.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-4">รอการรีวิว ({pendingOrders.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingOrders.map((order) => (
                <div key={order._id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-l-yellow-500 border border-gray-200 hover:shadow-lg transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{order.service?.name || 'บริการ'}</h3>
                      <p className="text-sm text-gray-500">
                        รหัสออเดอร์: {order.orderNumber || order._id.substring(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        วันที่เสร็จสมบูรณ์: {new Date(order.completedAt || order.updatedAt).toLocaleDateString('th-TH')}
                      </p>
                      <p className="font-medium mt-2">
                        ฿{order.total?.toLocaleString() || '0'}
                      </p>
                    </div>
                    {order.service?.image && (
                      <div className="w-16 h-16 rounded overflow-hidden">
                        <img 
                          src={order.service.image} 
                          alt={order.service.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <button
                      onClick={() => handleCreateReview(order)}
                      className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center gap-2"
                    >
                      <FaPen size={14} />
                      เขียนรีวิว
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {myReviews.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-4">รีวิวของฉัน ({myReviews.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myReviews.map((review) => (
                <div key={review._id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-lg transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{review.order?.service?.name || 'บริการ'}</h3>
                      <div className="mt-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-gray-700 text-sm line-clamp-3">
                      {review.comment || 'ไม่มีความคิดเห็นเพิ่มเติม'}
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      onClick={() => handleEditReview(review)}
                      className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md flex items-center justify-center gap-2"
                    >
                      <FaEdit size={14} />
                      แก้ไขรีวิว
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">การรีวิวของฉัน</h1>
      
      {loading ? (
        <div className="flex justify-center items-center py-16">

          <SimpleLoader size="large" />

        </div>
      ) : (
        <>
          {/* สรุปข้อมูลรีวิว */}
          <div className="bg-white shadow-md rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <FaChartBar className="text-blue-500" />
                  สรุปข้อมูลรีวิว
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">รอการรีวิว</p>
                    <p className="text-xl font-bold">{stats.pendingCount} รายการ</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">รีวิวแล้ว</p>
                    <p className="text-xl font-bold">{stats.reviewedCount} รายการ</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">คะแนนเฉลี่ย</p>
                    <p className="text-xl font-bold flex items-center">
                      {stats.averageRating.toFixed(1)}
                      <FaStar className="text-yellow-500 ml-1" />
                    </p>
                  </div>
                </div>
              </div>
              
              {stats.reviewedCount > 0 && (
                <div className="w-full md:w-1/2">
                  <p className="text-sm text-gray-500 mb-1">การกระจายของคะแนน</p>
                  {renderRatingDistribution()}
                </div>
              )}
            </div>
          </div>
          
          {/* แท็บสำหรับเลือกดูข้อมูล */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex space-x-4">
              <button
                className={`pb-2 px-1 ${
                  activeTab === 'pending' 
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('pending')}
              >
                รอการรีวิว {stats.pendingCount > 0 && `(${stats.pendingCount})`}
              </button>
              <button
                className={`pb-2 px-1 ${
                  activeTab === 'completed' 
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('completed')}
              >
                รีวิวแล้ว {stats.reviewedCount > 0 && `(${stats.reviewedCount})`}
              </button>
              <button
                className={`pb-2 px-1 ${
                  activeTab === 'all' 
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('all')}
              >
                ทั้งหมด
              </button>
            </div>
          </div>
          
          {/* แสดงข้อมูลตามแท็บที่เลือก */}
          <div className="mt-6">
            {activeTab === 'pending' && renderPendingOrders()}
            {activeTab === 'completed' && renderMyReviews()}
            {activeTab === 'all' && renderAllReviews()}
          </div>
          
          {/* Modal สำหรับสร้าง/แก้ไขรีวิว */}
          {showReviewModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-semibold">
                    {modalType === 'create' ? 'เขียนรีวิว' : 'แก้ไขรีวิว'}
                  </h2>
                </div>
                
                <div className="p-4">
                  {modalType === 'create' && selectedOrder && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h3 className="font-medium">{selectedOrder.service?.name}</h3>
                      <p className="text-sm text-gray-500">
                        รหัสออเดอร์: {selectedOrder.orderNumber || selectedOrder._id.substring(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ราคา: ฿{selectedOrder.total?.toLocaleString() || '0'}
                      </p>
                    </div>
                  )}
                  
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
                
                <div className="p-4 border-t flex justify-end">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}