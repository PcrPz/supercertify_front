'use client';

import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaStar, FaRegStar, FaEdit, FaTrash, FaEye, 
  FaCheckCircle, FaTimesCircle, FaSearch, FaFilter,
  FaChartBar, FaComments, FaCheck, FaDesktop,
  FaExclamationTriangle, FaInfoCircle, FaTimes
} from 'react-icons/fa';
import { getAllReviews, getReviewStats, adminUpdateReview, deleteReview } from '@/services/reviewsApi';

// Loading Component
const Spinner = () => (
  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
);

// Star Rating Component
const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className="text-yellow-500">
        {i <= rating ? <FaStar /> : <FaRegStar />}
      </span>
    );
  }
  return <div className="flex space-x-1">{stars}</div>;
};

// Custom Toast Component
const CustomToast = ({ message, icon }) => (
  <div className="flex items-start w-full">
    <div className="flex-shrink-0 mt-0.5">
      {icon}
    </div>
    <div className="ml-3 flex-1 pt-0.5">
      <p className="text-sm font-medium">{message}</p>
    </div>
  </div>
);
export default function AdminReviewsPage() {
  // States
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    publishedCount: 0,
    pendingCount: 0,
    averageRating: 0,
    featuredCount: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    minRating: 0
  });
  const [expandedReviews, setExpandedReviews] = useState({});

  // Custom Toast Functions
  const notify = {
    success: (message) => {
      toast.success(
        <CustomToast 
          message={message} 
        />,
        {
          className: "bg-green-50 border-l-4 border-green-500 text-green-800 shadow-md",
          progressClassName: "bg-green-500"
        }
      );
    },
    
    error: (message) => {
      toast.error(
        <CustomToast 
          message={message} 
        />,
        {
          className: "bg-red-50 border-l-4 border-red-500 text-red-800 shadow-md",
          progressClassName: "bg-red-500"
        }
      );
    },
    
    info: (message) => {
      toast.info(
        <CustomToast 
          message={message} 
        />,
        {
          className: "bg-blue-50 border-l-4 border-blue-500 text-blue-800 shadow-md",
          progressClassName: "bg-blue-500"
        }
      );
    },
    
    warning: (message) => {
      toast.warn(
        <CustomToast 
          message={message} 
          icon={<FaExclamationTriangle className="text-yellow-500 h-5 w-5" />} 
        />,
        {
          className: "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 shadow-md",
          progressClassName: "bg-yellow-500"
        }
      );
    }
  };
  // Fetch data on initial load and when filters change
  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage, filters]);

  // Fetch reviews and stats
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsResult = await getReviewStats();
      
      if (statsResult.success) {
        setStats({
          totalReviews: statsResult.data?.totalReviews || 0,
          publishedCount: statsResult.data?.publishedCount || 0,
          pendingCount: statsResult.data?.pendingCount || 0,
          averageRating: statsResult.data?.averageRating || 0,
          featuredCount: statsResult.data?.featuredCount || 0
        });
      }

      // Prepare options for API call
      const options = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      // Add filters if applicable
      console.log('🔍 Current filter status:', filters.status);
      
      if (filters.status === 'published') {
        options.isPublic = true;
      } else if (filters.status === 'pending') {
        options.isPublic = false;
      } else if (filters.status === 'featured') {
        options.isDisplayed = true;
      } else {
        console.log('👉 No specific status filter applied');
      }

      if (parseInt(filters.minRating) > 0) {
        options.minRating = parseInt(filters.minRating);
        console.log(`⭐ Setting minRating = ${options.minRating}`);
      }

      if (searchTerm) {
        options.search = searchTerm;
      }
      const reviewsResult = await getAllReviews(options);
      
      if (reviewsResult.success) {
        setReviews(reviewsResult.data || []);
        // Set pagination data
        if (reviewsResult.pagination) {
          setTotalPages(reviewsResult.pagination.totalPages || 1);
          console.log(`📄 Total pages: ${reviewsResult.pagination.totalPages || 1}`);
        } else {
          // Fallback if pagination not provided
          const calculatedPages = Math.ceil((reviewsResult.data?.length || 0) / itemsPerPage);
          setTotalPages(calculatedPages);
          console.log(`📄 Calculated total pages: ${calculatedPages}`);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      notify.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
      console.log('✅ Fetch completed');
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on search
    fetchData();
  };

  // Toggle review details expansion
  const toggleReviewDetails = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log(`🔍 Filter changed: ${name} = ${value}`);
    
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [name]: name === 'minRating' ? parseInt(value) : value
      };
      console.log('🔍 New filters state:', newFilters);
      return newFilters;
    });
    
    setCurrentPage(1); // Reset to first page when filters change
  };
  // Open view modal
  const handleViewReview = (review) => {
    setSelectedReview(review);
    setModalType('view');
    setShowModal(true);
  };

  // Open edit modal - แก้ไขให้แปลงค่าเป็น boolean
  const handleEditReview = (review) => {
    console.log("แก้ไขรีวิว:", review);
    
    setSelectedReview({
      ...review,
      isPublicEdit: Boolean(review.isPublic), // แปลงเป็น boolean
      isDisplayedEdit: Boolean(review.isDisplayed) // แปลงเป็น boolean
    });
    
    setModalType('edit');
    setShowModal(true);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (review) => {
    console.log("จะลบรีวิว:", review);
    
    setSelectedReview(review);
    setModalType('delete');
    setShowModal(true);
  };

  // Update review status (publish/unpublish)
  const handleUpdateStatus = async (reviewId, isPublic) => {
    try {
      const response = await adminUpdateReview(reviewId, { isPublic });
      if (response.success) {
        notify.success(`สถานะรีวิวถูกเปลี่ยนเป็น${isPublic ? 'เผยแพร่' : 'ไม่เผยแพร่'}เรียบร้อยแล้ว`);
        fetchData(); // Refresh data
      } else {
        notify.error(response.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      }
    } catch (error) {
      console.error('Error updating review status:', error);
      notify.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  // Update review featured status
  const handleToggleFeatured = async (reviewId, isDisplayed) => {
    try {
      const response = await adminUpdateReview(reviewId, { isDisplayed });
      if (response.success) {
        notify.success(`รีวิว${isDisplayed ? 'ถูกเลือกให้แสดงบนหน้าเว็บหลัก' : 'ถูกนำออกจากหน้าเว็บหลัก'}เรียบร้อยแล้ว`);
        fetchData(); // Refresh data
      } else {
        notify.error(response.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      notify.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  // Handle modal input change - แก้ไขให้แปลงค่าเป็น boolean ที่ถูกต้อง
  const handleModalInputChange = (e) => {
    const { name, type, checked, value } = e.target;
    
    // จัดการกับแต่ละประเภท input ให้เหมาะสม
    let newValue;
    if (type === 'checkbox') {
      newValue = checked;
    } else if (name === 'isPublicEdit') {
      // แปลง string 'true'/'false' เป็น boolean
      newValue = value === 'true';
      console.log(`แปลงค่า ${value} เป็น boolean: ${newValue}`);
    } else {
      newValue = value;
    }
    
    setSelectedReview({
      ...selectedReview,
      [name]: newValue
    });
  };

  // Handle save edit - แก้ไขให้แปลงค่าเป็น boolean ที่ถูกต้อง
  const handleSaveEdit = async () => {
    if (!selectedReview) return;
    
    console.log("บันทึกการแก้ไข:", selectedReview);

    try {
      const updateData = {
        isPublic: Boolean(selectedReview.isPublicEdit), // แปลงเป็น boolean
        isDisplayed: Boolean(selectedReview.isDisplayedEdit) // แปลงเป็น boolean
      };
      
      console.log("ข้อมูลที่จะอัปเดต:", updateData);
      
      // ตรวจสอบว่ามีการส่ง ID ที่ถูกต้อง
      if (!selectedReview._id) {
        notify.error('ไม่พบ ID ของรีวิว');
        return;
      }
      
      const response = await adminUpdateReview(selectedReview._id, updateData);
      console.log("ผลลัพธ์การอัปเดต:", response);
      
      if (response.success) {
        notify.success('อัปเดตรีวิวสำเร็จ');
        setShowModal(false);
        fetchData(); // Refresh data
      } else {
        notify.error(response.message || 'เกิดข้อผิดพลาดในการอัปเดตรีวิว');
      }
    } catch (error) {
      console.error('Error saving review:', error);
      notify.error('เกิดข้อผิดพลาดในการอัปเดตรีวิว');
    }
  };

  // Handle delete review
  const handleDeleteReview = async () => {
    if (!selectedReview) return;
    
    console.log("ลบรีวิว:", selectedReview);

    try {
      // ตรวจสอบว่ามีการส่ง ID ที่ถูกต้อง
      if (!selectedReview._id) {
        notify.error('ไม่พบ ID ของรีวิว');
        return;
      }
      
      const response = await deleteReview(selectedReview._id);
      console.log("ผลลัพธ์การลบ:", response);
      
      if (response.success) {
        notify.success('ลบรีวิวสำเร็จ');
        setShowModal(false);
        fetchData(); // Refresh data
      } else {
        notify.error(response.message || 'เกิดข้อผิดพลาดในการลบรีวิว');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      notify.error('เกิดข้อผิดพลาดในการลบรีวิว');
    }
  };

  // Pagination controls
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Custom Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        // ปรับแต่ง style ของ container
        toastClassName="rounded-lg overflow-hidden shadow-lg"
        // ปรับแต่ง style ของปุ่มปิด
        closeButton={({ closeToast }) => (
          <button 
            onClick={closeToast} 
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}
      />

      {/* Header - แบบไม่มีสีพื้นหลัง */}
      <div className="bg-white p-6 shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 flex items-center text-gray-800">
            <FaComments className="mr-3 text-[#444DDA]" /> จัดการรีวิว
          </h1>
          <p className="text-gray-600 max-w-2xl">
            ดูและจัดการรีวิวจากผู้ใช้ทั้งหมด เพื่อปรับปรุงคุณภาพบริการและสร้างความประทับใจให้กับลูกค้า
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#444DDA] transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">รีวิวทั้งหมด</div>
                <div className="text-3xl font-bold text-gray-800">{stats.totalReviews}</div>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <FaChartBar className="h-6 w-6 text-[#444DDA]" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">รีวิวที่รวบรวมจากผู้ใช้ทั้งหมด</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">เผยแพร่แล้ว</div>
                <div className="text-3xl font-bold text-green-600">{stats.publishedCount}</div>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <FaCheck className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">รีวิวที่ได้รับการอนุมัติและเผยแพร่</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">แสดงหน้าหลัก</div>
                <div className="text-3xl font-bold text-purple-600">{stats.featuredCount || 0}</div>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <FaDesktop className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">รีวิวที่ถูกเลือกให้แสดงบนหน้าหลัก</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">คะแนนเฉลี่ย</div>
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-gray-800 mr-2">{stats.averageRating.toFixed(1)}</span>
                  <FaStar className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
              <div className="flex -space-x-1">
                {[...Array(Math.min(5, Math.round(stats.averageRating)))].map((_, i) => (
                  <div key={i} className="p-1 rounded-full bg-yellow-50 border-2 border-white">
                    <FaStar className="h-4 w-4 text-yellow-500" />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">จากรีวิวทั้งหมด {stats.totalReviews} รายการ</div>
          </div>
        </div>

        {/* Search and Filters - แบบใหม่ที่ดูทันสมัยขึ้น */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="ค้นหารีวิว..."
                    className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-transparent text-gray-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaSearch className="absolute left-4 top-3.5 text-gray-400" />
                </div>
                <button
                  type="submit"
                  className="bg-[#444DDA] text-white px-5 py-3 rounded-r-xl hover:bg-[#3339A9] transition duration-300 font-medium"
                >
                  ค้นหา
                </button>
              </form>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-transparent text-gray-700 appearance-none bg-white w-full sm:w-auto"
                >
                <option value="all">ทั้งหมด</option>
                <option value="published">เผยแพร่แล้ว</option>
                <option value="featured">แสดงหน้าหลัก</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                  <FaFilter className="h-4 w-4" />
                </div>
              </div>
              
              <div className="relative">
                <select
                  name="minRating"
                  value={filters.minRating}
                  onChange={handleFilterChange}
                  className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-transparent text-gray-700 appearance-none bg-white w-full sm:w-auto"
                >
                  <option value="0">คะแนนทั้งหมด</option>
                  <option value="5">5 ดาว</option>
                  <option value="4">4+ ดาว</option>
                  <option value="3">3+ ดาว</option>
                  <option value="2">2+ ดาว</option>
                  <option value="1">1+ ดาว</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-yellow-500">
                  <FaStar className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Reviews Table - ตารางแสดงรีวิวที่ปรับปรุงใหม่ */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-8 flex justify-center">
              <Spinner />
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaSearch className="text-gray-400 h-6 w-6" />
              </div>
              <p className="text-gray-500 mb-2">ไม่พบรีวิวที่ตรงกับเงื่อนไข</p>
              <p className="text-sm text-gray-400">ลองเปลี่ยนการค้นหาหรือตัวกรองแล้วลองใหม่อีกครั้ง</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสติดตาม</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รีวิว</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ข้อมูลผู้ใช้</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reviews.map((review) => (
                      <React.Fragment key={review._id}>
                        <tr className="hover:bg-gray-50 transition duration-150">
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-between">
                              <div className="bg-[#444DDA]/5 px-4 py-2.5 rounded-lg border border-[#444DDA]/20 shadow-sm">
                                <div className="text-[#444DDA] font-mono font-medium flex items-center">
                                  <svg className="w-4 h-4 mr-2 text-[#444DDA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                  </svg>
                                  <span>{review.orderDetails?.trackingNumber || 
                                  (review.order && review.order.TrackingNumber ? review.order.TrackingNumber : 
                                   review.order?._id?.substring(0, 8) || 'ไม่มีรหัส')}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              <div>
                                <div className="flex mb-1.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} className="text-yellow-500">
                                      {star <= review.rating ? <FaStar /> : <FaRegStar />}
                                    </span>
                                  ))}
                                  <button 
                                    onClick={() => toggleReviewDetails(review._id)}
                                    className="group relative ml-3"
                                    title="ดูรายละเอียดเพิ่มเติม"
                                  >
                                    <div className={`flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 ${
                                      expandedReviews[review._id] 
                                        ? 'bg-[#444DDA] text-white' 
                                        : 'bg-gray-100 text-gray-500 hover:bg-[#444DDA]/10 hover:text-[#444DDA]'
                                    }`}>
                                      {expandedReviews[review._id] ? 'ซ่อน' : 'แสดง'}
                                      <svg xmlns="http://www.w3.org/2000/svg" 
                                        className={`h-3.5 w-3.5 ml-0.5 transition-transform duration-300 ${expandedReviews[review._id] ? 'rotate-180' : ''}`} 
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </button>
                                </div>
                                <p className="text-sm text-gray-700 truncate max-w-xs">
                                  {review.comment?.substring(0, 60)}
                                  {review.comment?.length > 60 ? '...' : ''}
                                </p>
                                <div className="mt-1 text-xs text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString('th-TH', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {review.userDetails?.fullName || 
                                review.userDetails?.username || 
                                (review.user && typeof review.user === 'object' ? review.user.username : 'ผู้ใช้')}
                              </div>
                              <div className="text-gray-500 mt-1">
                                <span className="inline-flex items-center">
                                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {review.userDetails?.email || 
                                  (review.user && typeof review.user === 'object' ? review.user.email : 'ไม่มีอีเมล')}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex flex-col gap-1.5">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                                review.isPublic 
                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}>
                                {review.isPublic ? 'เผยแพร่' : 'ไม่เผยแพร่'}
                              </span>
                              
                              {review.isDisplayed && (
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                  แสดงหน้าหลัก
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleViewReview(review)}
                                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition duration-150"
                                title="ดูรายละเอียด"
                              >
                                <FaEye />
                              </button>
                              
                              <button
                                onClick={() => handleEditReview(review)}
                                className="p-2 bg-[#444DDA]/10 text-[#444DDA] rounded-lg hover:bg-[#444DDA]/20 transition duration-150"
                                title="แก้ไข"
                              >
                                <FaEdit />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteClick(review)}
                                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition duration-150"
                                title="ลบ"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded details - ปรับปรุงดีไซน์ */}
                        {expandedReviews[review._id] && (
                          <tr>
                            <td colSpan="5" className="px-0 py-0 border-b border-gray-200">
                              <div className="bg-gradient-to-r from-[#444DDA]/10 to-transparent py-6 border-l-4 border-[#444DDA]">
                                <div className="px-8">
                                  {/* ส่วนหัวของรายละเอียด */}
                                  <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center">
                                      <div className="mr-3">
                                        <div className="w-10 h-10 bg-[#444DDA] rounded-full flex items-center justify-center shadow-lg">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        </div>
                                      </div>
                                      <div>
                                        <h3 className="font-medium text-lg text-gray-800">รายละเอียดรีวิว</h3>
                                        <div className="flex items-center mt-1">
                                          <span className="px-2.5 py-0.5 bg-[#444DDA]/10 text-[#444DDA] text-xs rounded-full border border-[#444DDA]/20 font-mono">
                                            ID: {review._id.substring(0, 8)}...
                                          </span>
                                          <div className="w-1 h-1 bg-gray-300 rounded-full mx-2"></div>
                                          <span className="text-xs text-gray-500">
                                            สร้างเมื่อ: {new Date(review.createdAt).toLocaleDateString('th-TH', {
                                              day: 'numeric',
                                              month: 'long',
                                              year: 'numeric'
                                            })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleToggleFeatured(review._id, !review.isDisplayed)}
                                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 shadow-sm border flex items-center space-x-2 ${
                                        review.isDisplayed
                                          ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                          : 'bg-white text-gray-700 border-gray-200 hover:bg-[#444DDA]/5 hover:border-[#444DDA]/20 hover:text-[#444DDA]'
                                      }`}
                                    >
                                      {review.isDisplayed ? (
                                        <>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                          <span>ยกเลิกการแสดงหน้าหลัก</span>
                                        </>
                                      ) : (
                                        <>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                          <span>แสดงบนหน้าหลัก</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* คอลัมน์ซ้าย */}
                                    <div>
                                      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                        <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                                          <div className="w-5 h-5 bg-[#444DDA]/10 rounded-md flex items-center justify-center mr-2">
                                            <span className="w-1.5 h-1.5 bg-[#444DDA] rounded-full"></span>
                                          </div>
                                          ความคิดเห็น
                                        </h4>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                          <div className="flex mb-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <span key={star} className="text-yellow-500">
                                                {star <= review.rating ? <FaStar /> : <FaRegStar />}
                                              </span>
                                            ))}
                                            <span className="ml-2 text-sm text-gray-500">
                                              {new Date(review.createdAt).toLocaleDateString('th-TH', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                              })}
                                            </span>
                                          </div>
                                          <p className="text-gray-700 mt-2">
                                            {review.comment || 'ไม่มีความคิดเห็น'}
                                          </p>
                                        </div>
                                        
                                        {review.tags && review.tags.length > 0 && (
                                          <div className="mt-4">
                                            <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                                              <div className="w-5 h-5 bg-[#444DDA]/10 rounded-md flex items-center justify-center mr-2">
                                                <span className="w-1.5 h-1.5 bg-[#444DDA] rounded-full"></span>
                                              </div>
                                              แท็ก
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                              {review.tags.map((tag, index) => (
                                                <span key={index} className="px-3 py-1 bg-white text-gray-700 text-xs rounded-full border border-gray-200 shadow-sm">
                                                  {tag}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* คอลัมน์ขวา */}
                                    <div className="space-y-5">
                                      {/* ข้อมูลผู้ใช้ */}
                                      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                        <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                                          <div className="w-5 h-5 bg-[#444DDA]/10 rounded-md flex items-center justify-center mr-2">
                                            <span className="w-1.5 h-1.5 bg-[#444DDA] rounded-full"></span>
                                          </div>
                                          ข้อมูลผู้ใช้
                                        </h4>
                                        <div className="flex items-center">
                                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4 text-gray-500 border border-gray-100 shadow-sm overflow-hidden">
                                            {review.userDetails?.profilePicture ? (
                                              <img 
                                                src={review.userDetails.profilePicture} 
                                                alt="Profile" 
                                                className="w-12 h-12 rounded-full object-cover"
                                              />
                                            ) : (
                                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                              </svg>
                                            )}
                                          </div>
                                          <div>
                                            <p className="font-medium text-gray-800">
                                              {review.userDetails?.fullName || review.userDetails?.username || 'ไม่ระบุชื่อ'}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                              {review.userDetails?.email || 'ไม่ระบุอีเมล'}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* ข้อมูลออเดอร์ */}
                                      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                        <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                                          <div className="w-5 h-5 bg-[#444DDA]/10 rounded-md flex items-center justify-center mr-2">
                                            <span className="w-1.5 h-1.5 bg-[#444DDA] rounded-full"></span>
                                          </div>
                                          ข้อมูลออเดอร์
                                        </h4>
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                            <span className="text-gray-600">เลขออเดอร์:</span>
                                            <span className="font-medium text-[#444DDA]">
                                              {review.orderDetails?.trackingNumber || 'ไม่ระบุ'}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                            <span className="text-gray-600">บริการ:</span>
                                            <span className="font-medium">
                                              {review.orderDetails?.services?.[0]?.title || 'ไม่ระบุ'}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                            <span className="text-gray-600">ราคา:</span>
                                            <span className="font-medium">
                                              {review.orderDetails?.totalPrice ? `${review.orderDetails.totalPrice.toLocaleString()} บาท` : 'ไม่ระบุ'}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center py-1.5">
                                            <span className="text-gray-600">วันที่สั่งซื้อ:</span>
                                            <span className="font-medium">
                                              {review.orderDetails?.orderDate ? new Date(review.orderDetails.orderDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination - ปรับปรุงให้ดูทันสมัยขึ้น */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                      currentPage === 1
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-[#444DDA] bg-white hover:bg-[#444DDA]/10 border border-gray-200'
                    }`}
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium rounded-lg ${
                      currentPage === totalPages
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-[#444DDA] bg-white hover:bg-[#444DDA]/10 border border-gray-200'
                    }`}
                  >
                    ถัดไป
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      แสดง <span className="font-medium">{reviews.length}</span> รายการ
                      {totalPages > 1 && (
                        <span> (หน้า <span className="font-medium">{currentPage}</span> จาก <span className="font-medium">{totalPages}</span>)</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-3 py-2 rounded-l-lg text-sm font-medium border ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-500 hover:bg-[#444DDA]/10 border-gray-200 hover:text-[#444DDA]'
                        }`}
                      >
                        <span className="sr-only">First</span>
                        &laquo;
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-500 hover:bg-[#444DDA]/10 border-gray-200 hover:text-[#444DDA]'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        &lt;
                      </button>
                      
                      {/* Page numbers */}
                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        let pageNumber;
                        
                        if (totalPages <= 5) {
                          // If 5 or fewer pages, show all
                          pageNumber = index + 1;
                        } else if (currentPage <= 3) {
                          // Near the start
                          pageNumber = index + 1;
                        } else if (currentPage >= totalPages - 2) {
                          // Near the end
                          pageNumber = totalPages - 4 + index;
                        } else {
                          // In the middle
                          pageNumber = currentPage - 2 + index;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                              currentPage === pageNumber
                                ? 'z-10 bg-[#444DDA]/10 border-[#444DDA] text-[#444DDA]'
                                : 'bg-white border-gray-200 text-gray-500 hover:bg-[#444DDA]/5'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-500 hover:bg-[#444DDA]/10 border-gray-200 hover:text-[#444DDA]'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        &gt;
                      </button>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-3 py-2 rounded-r-lg text-sm font-medium border ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-500 hover:bg-[#444DDA]/10 border-gray-200 hover:text-[#444DDA]'
                        }`}
                      >
                        <span className="sr-only">Last</span>
                        &raquo;
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Modals - ปรับปรุงให้ดูทันสมัยและสวยงามขึ้น */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl animate-scaleIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 relative bg-gradient-to-r from-[#444DDA]/10 to-white">
              {/* ปุ่มปิดด้านขวาบน */}
              <button 
                onClick={() => setShowModal(false)}
                className="absolute right-5 top-5 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* หัวข้อตรงกลาง */}
              <h2 className="text-xl font-medium text-gray-800 flex items-center gap-2 justify-center">
                {modalType === 'view' && (
                  <>
                    <div className="p-2 bg-blue-50 rounded-full">
                      <FaEye className="text-blue-500" size={14} />
                    </div>
                    รายละเอียดรีวิว
                  </>
                )}
                {modalType === 'edit' && (
                  <>
                    <div className="p-2 bg-[#444DDA]/10 rounded-full">
                      <FaEdit className="text-[#444DDA]" size={14} />
                    </div>
                    แก้ไขรีวิว
                  </>
                )}
                {modalType === 'delete' && (
                  <>
                    <div className="p-2 bg-red-50 rounded-full">
                      <FaTrash className="text-red-500" size={14} />
                    </div>
                    ลบรีวิว
                  </>
                )}
              </h2>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              {/* View Modal Content */}
              {modalType === 'view' && selectedReview && (
                <div className="space-y-5">
                  {/* Review Order Card */}
                  <div className="p-5 bg-gradient-to-r from-[#444DDA]/5 to-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800 flex items-center">
                        <span className="mr-2 text-gray-500">รหัสออเดอร์:</span>
                        <span className="text-[#444DDA]">
                          {selectedReview.orderDetails?.trackingNumber || 
                          (selectedReview.order && typeof selectedReview.order === 'object' 
                          ? selectedReview.order.TrackingNumber || selectedReview.order._id?.substring(0, 8)
                          : selectedReview.order?.substring(0, 8) || 'ไม่ระบุ')}
                        </span>
                      </h3>
                      
                      <div className="w-12 h-12 rounded-full bg-[#444DDA]/10 flex items-center justify-center shadow-sm">
                        <FaStar className="text-[#444DDA]" size={16} />
                      </div>
                    </div>
                    
                    {/* Rating and Date */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-yellow-500">
                            {star <= selectedReview.rating ? <FaStar /> : <FaRegStar />}
                          </span>
                        ))}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(selectedReview.createdAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Review Comment */}
                  <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <span className="w-1.5 h-1.5 bg-[#444DDA] rounded-full mr-2"></span>
                      ความคิดเห็น
                    </h4>
                    <p className="text-gray-700 bg-[#444DDA]/5 p-4 rounded-lg">
                      {selectedReview.comment || 'ไม่มีความคิดเห็น'}
                    </p>
                  </div>
                  
                  {/* User and Service Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-1.5 h-1.5 bg-[#444DDA] rounded-full mr-2"></span>
                        ผู้ใช้
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedReview.userDetails?.fullName || 
                        (selectedReview.user && typeof selectedReview.user === 'object' 
                          ? selectedReview.user.username || selectedReview.user.email 
                          : 'ไม่ระบุ')}
                      </p>
                    </div>
                    
                    <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-1.5 h-1.5 bg-[#444DDA] rounded-full mr-2"></span>
                        บริการ
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedReview.orderDetails?.services?.[0]?.title || 
                        (selectedReview.order && selectedReview.order.services?.length > 0 
                          ? selectedReview.order.services[0].title 
                          : 'ไม่ระบุ')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badges */}
                  <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <span className="w-1.5 h-1.5 bg-[#444DDA] rounded-full mr-2"></span>
                      สถานะ
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1.5 text-sm rounded-full ${
                        selectedReview.isPublic 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        {selectedReview.isPublic ? 'เผยแพร่' : 'ไม่เผยแพร่'}
                      </span>
                      
                      {selectedReview.isDisplayed && (
                        <span className="px-3 py-1.5 text-sm rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          แสดงหน้าหลัก
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {selectedReview.tags && selectedReview.tags.length > 0 && (
                    <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-1.5 h-1.5 bg-[#444DDA] rounded-full mr-2"></span>
                        แท็ก
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedReview.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1.5 text-sm rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Edit Modal Content */}
              {modalType === 'edit' && selectedReview && (
                <div className="space-y-5">
                  {/* Review Order Card */}
                  <div className="p-5 bg-gradient-to-r from-[#444DDA]/5 to-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-800 flex items-center">
                        <span className="mr-2 text-gray-500">รหัสออเดอร์:</span>
                        <span className="text-[#444DDA]">
                          {selectedReview.orderDetails?.trackingNumber || 
                          (selectedReview.order && typeof selectedReview.order === 'object' 
                          ? selectedReview.order.TrackingNumber || selectedReview.order._id?.substring(0, 8)
                          : selectedReview.order?.substring(0, 8) || 'ไม่ระบุ')}
                        </span>
                      </h3>
                      
                      <div className="w-12 h-12 rounded-full bg-[#444DDA]/10 flex items-center justify-center shadow-sm">
                        <FaEdit className="text-[#444DDA]" size={16} />
                      </div>
                    </div>
                    
                    {/* Rating and Comment Preview */}
                    <div className="mt-3">
                      <div className="flex mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-yellow-500">
                            {star <= selectedReview.rating ? <FaStar /> : <FaRegStar />}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {selectedReview.comment || 'ไม่มีความคิดเห็น'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Edit Form */}
                  <div className="space-y-4">
                    {/* Status Selection */}
                    <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <span className="w-1.5 h-1.5 bg-[#444DDA] rounded-full mr-2"></span>
                        สถานะการเผยแพร่
                      </h4>
                      <select
                        name="isPublicEdit"
                        value={selectedReview.isPublicEdit.toString()}
                        onChange={handleModalInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-transparent"
                      >
                        <option value="true">เผยแพร่</option>
                        <option value="false">ไม่เผยแพร่</option>
                      </select>
                    </div>
                    
                    {/* Checkboxes */}
                    <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <span className="w-1.5 h-1.5 bg-[#444DDA] rounded-full mr-2"></span>
                        การตั้งค่าเพิ่มเติม
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-[#444DDA]/5 transition duration-150">
                          <input
                            id="isDisplayedEdit"
                            name="isDisplayedEdit"
                            type="checkbox"
                            checked={selectedReview.isDisplayedEdit}
                            onChange={handleModalInputChange}
                            className="h-4 w-4 text-[#444DDA] focus:ring-[#444DDA] border-gray-300 rounded"
                          />
                          <label htmlFor="isDisplayedEdit" className="ml-2 block text-sm text-gray-700 select-none">
                            แสดงบนหน้าหลัก
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Delete Modal Content */}
              {modalType === 'delete' && selectedReview && (
                <div className="space-y-5">
                  <div className="p-8 bg-red-50 rounded-xl border border-red-100 shadow-sm text-center">
                    <div className="mx-auto w-16 h-16 flex items-center justify-center bg-red-100 rounded-full mb-4">
                      <FaTrash className="text-red-500" size={24} />
                    </div>
                    
                    <h3 className="text-lg font-medium text-red-800 mb-2">ยืนยันการลบรีวิว</h3>
                    <p className="text-sm text-red-600">
                      คุณกำลังจะลบรีวิวนี้ซึ่งจะไม่สามารถกู้คืนได้ในภายหลัง คุณแน่ใจหรือไม่?
                    </p>
                  </div>
                  
                  <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                      ข้อมูลรีวิวที่จะลบ
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <div className="flex mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-yellow-500">
                            {star <= selectedReview.rating ? <FaStar /> : <FaRegStar />}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">
                        {selectedReview.comment || 'ไม่มีความคิดเห็น'}
                      </p>
                      <div className="mt-3 text-xs text-gray-500">
                        <p>ผู้ใช้: {selectedReview.userDetails?.fullName || 'ไม่ระบุ'}</p>
                        <p>วันที่: {new Date(selectedReview.createdAt).toLocaleDateString('th-TH')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              {modalType === 'view' && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ปิด
                  </button>
                </div>
              )}
                            
                {modalType === 'edit' && (
                    <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="px-6 py-3 bg-[#444DDA] text-white font-medium rounded-lg hover:bg-[#3339A9] transition-colors"
                    >
                        บันทึกการเปลี่ยนแปลง
                    </button>
                    </div>
                )}
                            
                {modalType === 'delete' && (
                    <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={handleDeleteReview}
                        className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                        ยืนยันการลบ
                    </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}