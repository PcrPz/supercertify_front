'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { createReview, updateReview, getReviewById } from '@/services/reviewsApi';

export default function ReviewForm({ orderId, reviewId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rating: 0,
    comment: ''
  });
  const [errors, setErrors] = useState({});
  const [isEdit, setIsEdit] = useState(false);

  // ดึงข้อมูล Review กรณีแก้ไข
  useEffect(() => {
    const fetchReview = async () => {
      if (reviewId) {
        setIsEdit(true);
        setLoading(true);
        try {
          const response = await getReviewById(reviewId);
          if (response.success && response.data) {
            setFormData({
              rating: response.data.rating,
              comment: response.data.comment || ''
            });
          } else {
            toast.error('ไม่สามารถดึงข้อมูล Review ได้');
          }
        } catch (error) {
          console.error('Error fetching review:', error);
          toast.error('เกิดข้อผิดพลาดในการดึงข้อมูล Review');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchReview();
  }, [reviewId]);

  // จัดการเมื่อมีการเปลี่ยนแปลงข้อมูลใน form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // ล้าง error เมื่อมีการแก้ไขข้อมูล
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // จัดการเมื่อคลิกที่ดาว
  const handleRatingClick = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));

    // ล้าง error เมื่อมีการแก้ไขคะแนน
    if (errors.rating) {
      setErrors(prev => ({
        ...prev,
        rating: null
      }));
    }
  };

  // ตรวจสอบความถูกต้องของข้อมูล
  const validateForm = () => {
    const newErrors = {};

    if (!formData.rating || formData.rating < 1) {
      newErrors.rating = 'กรุณาให้คะแนนความพึงพอใจ';
    }

    if (!formData.comment.trim()) {
      newErrors.comment = 'กรุณากรอกความคิดเห็น';
    } else if (formData.comment.trim().length < 10) {
      newErrors.comment = 'ความคิดเห็นต้องมีความยาวอย่างน้อย 10 ตัวอักษร';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // จัดการเมื่อกดปุ่ม Submit
const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('Form submitted with data:', formData);

  if (!validateForm()) {
    console.log('Form validation failed');
    return;
  }

  console.log('Form validated successfully, preparing to send API request');
  setLoading(true);
  
  try {
    let response;

    if (isEdit) {
      // อัปเดต Review
      console.log('Updating review with id:', reviewId, 'and data:', formData);
      response = await updateReview(reviewId, formData);
    } else {
      // สร้าง Review ใหม่
      console.log('Creating new review for orderId:', orderId, 'with data:', formData);
      response = await createReview({
        orderId,
        ...formData
      });
    }

    console.log('API response:', response);

    if (response.success) {
      console.log('Review operation successful');
      
      // แสดงการแจ้งเตือนใน ReviewForm
      toast.success(isEdit ? 'อัปเดตรีวิวสำเร็จ' : 'ส่งรีวิวสำเร็จ', {
        position: "top-right",
        autoClose: 3000
      });
      
      // ตรวจสอบก่อนเรียกใช้ callback
      console.log('Checking onSuccess callback:', onSuccess);
      if (typeof onSuccess === 'function') {
        console.log('Calling onSuccess callback with data:', response.data);
        onSuccess(response.data);
      } else {
        console.warn('onSuccess is not a function or not provided');
      }
    } else {
      console.error('Review operation failed:', response.message);
      toast.error(response.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    toast.error('เกิดข้อผิดพลาดในการส่งรีวิว กรุณาลองใหม่อีกครั้ง');
  } finally {
    setLoading(false);
  }
};

  // สร้าง component แสดงดาว
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= formData.rating) {
        stars.push(
          <FaStar
            key={i}
            className="text-[#FFC107] text-3xl cursor-pointer"
            onClick={() => handleRatingClick(i)}
          />
        );
      } else {
        stars.push(
          <FaRegStar
            key={i}
            className="text-gray-300 text-3xl cursor-pointer"
            onClick={() => handleRatingClick(i)}
          />
        );
      }
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-lg">
      <form onSubmit={handleSubmit}>
        {/* คะแนนความพึงพอใจ */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-3 font-medium">ให้คะแนนความพึงพอใจ</label>
          <div className="flex space-x-3">
            {renderStars()}
          </div>
          {errors.rating && (
            <p className="text-red-500 text-sm mt-2">{errors.rating}</p>
          )}
        </div>
        
        {/* ความคิดเห็น */}
        <div className="mb-6">
          <label htmlFor="comment" className="block text-gray-700 mb-3 font-medium">
            ความคิดเห็นเพิ่มเติม
          </label>
          <textarea
            id="comment"
            name="comment"
            rows="4"
            value={formData.comment}
            onChange={handleChange}
            className={`w-full px-4 py-3 border ${
              errors.comment ? 'border-red-500' : 'border-gray-200'
            } rounded-lg focus:outline-none focus:ring-1 focus:ring-[#444DDA] resize-none text-gray-700`}
            placeholder="แบ่งปันประสบการณ์ของคุณ..."
          ></textarea>
          {errors.comment && (
            <p className="text-red-500 text-sm mt-2">{errors.comment}</p>
          )}
        </div>
        
        {/* ปุ่มส่ง */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2.5 bg-[#444DDA] text-white rounded-full hover:bg-[#444DDA]/90 focus:outline-none transition-colors shadow-sm ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังดำเนินการ...
              </span>
            ) : isEdit ? 'บันทึกการแก้ไข' : 'ส่งรีวิว'}
          </button>
        </div>
      </form>
    </div>
  );
}