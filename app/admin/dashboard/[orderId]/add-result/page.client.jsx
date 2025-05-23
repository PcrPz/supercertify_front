// app/admin/dashboard/[orderId]/add-result/page.client.jsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getOrderById, uploadResultFile } from '@/services/apiService';
import Link from 'next/link';

export default function AddResultClient({ orderId }) {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [resultNote, setResultNote] = useState('');
  const [resultStatus, setResultStatus] = useState('pass');
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        setLoading(true);
        const orderData = await getOrderById(orderId);
        setOrder(orderData);
        
        // ถ้ามี candidates ให้เลือก candidate แรกเป็นค่าเริ่มต้น
        if (orderData.candidates && orderData.candidates.length > 0) {
          setSelectedCandidate(orderData.candidates[0]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrderDetails();
  }, [orderId]);
  
  const handleCandidateChange = (candidateId) => {
    const candidate = order.candidates.find(c => c._id === candidateId);
    setSelectedCandidate(candidate);
  };
  
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!selectedCandidate) {
    setError('กรุณาเลือกผู้สมัคร');
    return;
  }
  
  if (!fileInputRef.current.files[0]) {
    setError('กรุณาเลือกไฟล์ผลการตรวจสอบ');
    return;
  }
  
  const file = fileInputRef.current.files[0];
  const formData = new FormData();
  formData.append('file', file);
  formData.append('resultNotes', resultNote);
  formData.append('resultStatus', resultStatus);
  
  setUploadProgress({ status: 'uploading', progress: 0 });
  
  try {
    console.log(`⬆️ Submitting form, uploading result for candidate ${selectedCandidate._id} in order ${orderId}`);
    
    // แน่ใจว่ามีการส่ง orderId ไปด้วย!
    const result = await uploadResultFile(selectedCandidate._id, formData, orderId);
    
    console.log(`✅ Upload result:`, result);
    
    if (result.success) {
      // ตรวจสอบว่า candidate ที่เหลือมีกี่คนที่ยังไม่มีผลการตรวจสอบ
      const remainingCandidates = order.candidates.filter(c => 
        c._id !== selectedCandidate._id && c.result === null
      ).length;
      
      if (remainingCandidates > 0) {
        setUploadProgress({ 
          status: 'success', 
          message: `อัปโหลดสำเร็จ ยังเหลืออีก ${remainingCandidates} คนที่ยังไม่มีผลการตรวจสอบ` 
        });
        
        // ยังมี candidates ที่เหลือ ให้รีโหลดหน้าปัจจุบัน
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setUploadProgress({ 
          status: 'success', 
          message: 'อัปโหลดสำเร็จ ผลการตรวจสอบครบทุกคนแล้ว ระบบจะส่งอีเมลแจ้งเตือนไปยังลูกค้า' 
        });
        
        // ครบทุกคนแล้ว ให้ redirect ไปที่หน้า dashboard/[orderId]
        setTimeout(() => {
          router.push(`/admin/dashboard/${orderId}`);
        }, 2000);
      }
    } else {
      setUploadProgress({ status: 'error', message: result.message });
    }
  } catch (err) {
    console.error('Error uploading result:', err);
    setUploadProgress({ status: 'error', message: 'เกิดข้อผิดพลาดในการอัปโหลดผลการตรวจสอบ' });
  }
};
  
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  if (error && !order) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <Link 
          href="/admin/dashboard"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          กลับไปหน้า Dashboard
        </Link>
      </div>
    );
  }
  
  if (!order ) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                คำสั่งซื้อนี้ไม่อยู่ในสถานะ "กำลังดำเนินการ" จึงไม่สามารถเพิ่มผลการตรวจสอบได้
              </p>
            </div>
          </div>
        </div>
        <Link 
          href="/admin/dashboard"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          กลับไปหน้า Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">เพิ่มผลการตรวจสอบ</h1>
        <Link 
          href={`/admin/dashboard/${orderId}`}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          กลับไปหน้ารายละเอียด
        </Link>
      </div>
      
      {/* Order Information */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">ข้อมูลคำสั่งซื้อ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">รหัสคำสั่งซื้อ</p>
            <p className="font-medium">{order.TrackingNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">วันที่สร้าง</p>
            <p className="font-medium">
              {new Date(order.createdAt).toLocaleString('th-TH')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ประเภท</p>
            <p className="font-medium">
              {order.OrderType === 'personal' ? 'บุคคล' : 'บริษัท'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ราคารวม</p>
            <p className="font-medium">
              {(order.TotalPrice || 0).toLocaleString()} บาท
            </p>
          </div>
        </div>
      </div>
      
      {/* Upload Form */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">เพิ่มผลการตรวจสอบ</h2>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {uploadProgress && (
          <div className={`p-4 mb-4 rounded-md ${
            uploadProgress.status === 'success' ? 'bg-green-50 border-l-4 border-green-500' : 
            uploadProgress.status === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
            'bg-blue-50 border-l-4 border-blue-500'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {uploadProgress.status === 'uploading' && (
                  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {uploadProgress.status === 'success' && (
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {uploadProgress.status === 'error' && (
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm ${
                  uploadProgress.status === 'success' ? 'text-green-700' : 
                  uploadProgress.status === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  {uploadProgress.message || 'กำลังอัปโหลด...'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกผู้สมัคร
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={selectedCandidate?._id || ''}
              onChange={(e) => handleCandidateChange(e.target.value)}
              required
            >
              {order.candidates.map(candidate => (
                <option 
                  key={candidate._id} 
                  value={candidate._id}
                  disabled={candidate.result !== null} // ถ้ามี result แล้วจะเลือกไม่ได้
                >
                  {candidate.C_FullName} ({candidate.C_Email})
                  {candidate.result !== null ? ' - มีผลการตรวจสอบแล้ว' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ไฟล์ผลการตรวจสอบ
            </label>
            <input
              type="file"
              ref={fileInputRef}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              รองรับไฟล์: PDF, DOC, DOCX, JPG, JPEG, PNG (ขนาดไม่เกิน 10MB)
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมายเหตุ
            </label>
            <textarea
              value={resultNote}
              onChange={(e) => setResultNote(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับผลการตรวจสอบ"
            ></textarea>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะผลการตรวจสอบ
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  name="resultStatus"
                  value="pass"
                  checked={resultStatus === 'pass'}
                  onChange={() => setResultStatus('pass')}
                />
                <span className="ml-2 text-gray-700">ผ่าน</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  name="resultStatus"
                  value="fail"
                  checked={resultStatus === 'fail'}
                  onChange={() => setResultStatus('fail')}
                />
                <span className="ml-2 text-gray-700">ไม่ผ่าน</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio h-4 w-4 text-blue-600"
                  name="resultStatus"
                  value="pending"
                  checked={resultStatus === 'pending'}
                  onChange={() => setResultStatus('pending')}
                />
                <span className="ml-2 text-gray-700">รอผล</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Link 
              href={`/admin/dashboard/${orderId}`}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-2"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={uploadProgress?.status === 'uploading'}
            >
              {uploadProgress?.status === 'uploading' ? 'กำลังอัปโหลด...' : 'บันทึกผลการตรวจสอบ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}