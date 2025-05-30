
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getOrderById, uploadResultFile } from '@/services/apiService';
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  FileText,
  File,
  Clock
} from 'lucide-react';

export default function AddResultForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.orderId;
  const initialCandidateId = searchParams.get('candidateId');
  const router = useRouter();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
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
        
        // ถ้ามี candidates ให้เลือก candidate ตาม URL param หรือคนแรกเป็นค่าเริ่มต้น
        if (orderData.candidates && orderData.candidates.length > 0) {
          if (initialCandidateId) {
            const candidate = orderData.candidates.find(c => c._id === initialCandidateId);
            if (candidate) {
              setSelectedCandidate(candidate);
            } else {
              setSelectedCandidate(orderData.candidates[0]);
            }
          } else {
            setSelectedCandidate(orderData.candidates[0]);
          }
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
  }, [orderId, initialCandidateId]);
  
  const handleCandidateChange = (candidateId) => {
    const candidate = order.candidates.find(c => c._id === candidateId);
    setSelectedCandidate(candidate);
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // ตรวจสอบขนาดไฟล์ (10MB = 10 * 1024 * 1024 bytes)
      if (file.size > 10 * 1024 * 1024) {
        setError('ขนาดไฟล์เกิน 10MB กรุณาเลือกไฟล์ขนาดเล็กกว่า');
        return;
      }
      
      // ตรวจสอบประเภทไฟล์
      const allowedTypes = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        setError('ประเภทไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์ PDF, DOC, DOCX, JPG, JPEG หรือ PNG');
        return;
      }
      
      setSelectedFile(file);
      setError(null); // ล้างข้อความ error เมื่อไฟล์ถูกต้อง
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCandidate) {
      setError('กรุณาเลือกผู้สมัคร');
      return;
    }
    
    if (!selectedFile) {
      setError('กรุณาเลือกไฟล์ผลการตรวจสอบ');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('resultNotes', resultNote);
    formData.append('resultStatus', resultStatus);
    
    setUploadProgress({ status: 'uploading', progress: 0 });
    
    try {
      console.log(`⬆️ Submitting form, uploading result for candidate ${selectedCandidate._id} in order ${orderId}`);
      
      // สร้าง mock progress เพื่อ UX ที่ดีขึ้น
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev && prev.progress < 90) {
            return { ...prev, progress: prev.progress + 10 };
          }
          return prev;
        });
      }, 500);
      
      // แน่ใจว่ามีการส่ง orderId ไปด้วย!
      const result = await uploadResultFile(selectedCandidate._id, formData, orderId);
      
      clearInterval(progressInterval);
      console.log(`✅ Upload result:`, result);
      
      if (result.success) {
        // ตรวจสอบว่า candidate ที่เหลือมีกี่คนที่ยังไม่มีผลการตรวจสอบ
        const remainingCandidates = order.candidates.filter(c => 
          c._id !== selectedCandidate._id && !c.result
        ).length;
        
        if (remainingCandidates > 0) {
          setUploadProgress({ 
            status: 'success', 
            progress: 100,
            message: `อัปโหลดสำเร็จ ยังเหลืออีก ${remainingCandidates} คนที่ยังไม่มีผลการตรวจสอบ` 
          });
          
          // ยังมี candidates ที่เหลือ ให้รีโหลดหน้าปัจจุบัน
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setUploadProgress({ 
            status: 'success', 
            progress: 100,
            message: 'อัปโหลดสำเร็จ ผลการตรวจสอบครบทุกคนแล้ว ระบบจะส่งอีเมลแจ้งเตือนไปยังลูกค้า' 
          });
          
          // ครบทุกคนแล้ว ให้ redirect ไปที่หน้า dashboard/[orderId]
          setTimeout(() => {
            router.push(`/admin/dashboard/${orderId}`);
          }, 2000);
        }
      } else {
        setUploadProgress({ 
          status: 'error', 
          progress: 100,
          message: result.message || 'เกิดข้อผิดพลาดในการอัปโหลด' 
        });
      }
    } catch (err) {
      console.error('Error uploading result:', err);
      setUploadProgress({ 
        status: 'error', 
        progress: 100,
        message: 'เกิดข้อผิดพลาดในการอัปโหลดผลการตรวจสอบ' 
      });
    }
  };
  
  const getFileIcon = (fileName) => {
    if (!fileName) return <File className="h-4 w-4" />;
    
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <FileText className="h-4 w-4 text-green-500" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };
  
  // แสดงวันที่ในรูปแบบที่อ่านง่าย
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    
    const months = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    
    const date = new Date(dateString);
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear() + 543;
    
    return `${day} ${month} ${year}`;
  };
  
  // แสดงผลหน้า
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#444DDA] mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  if (error && !order) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-md">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
        <Link 
          href="/admin/dashboard"
          className="px-4 py-2 bg-[#444DDA] text-white rounded-md hover:bg-[#3B43BF] transition-colors inline-flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปหน้า Dashboard
        </Link>
      </div>
    );
  }
  
  if (!order || order.OrderStatus !== 'processing') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-[#FFC107]/20 border-l-4 border-[#FFC107] p-4 mb-4 rounded-r-md">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
            <p className="text-sm text-amber-800">
              คำสั่งซื้อนี้ไม่อยู่ในสถานะ "กำลังดำเนินการ" จึงไม่สามารถเพิ่มผลการตรวจสอบได้
            </p>
          </div>
        </div>
        <Link 
          href="/admin/dashboard"
          className="px-4 py-2 bg-[#444DDA] text-white rounded-md hover:bg-[#3B43BF] transition-colors inline-flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปหน้า Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href={`/admin/dashboard/${orderId}`} className="text-gray-500 hover:text-[#444DDA] transition-colors mr-3">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">เพิ่มผลการตรวจสอบ</h1>
          </div>
        </div>
        
        {/* Order Information Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center border-b border-gray-100 pb-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#444DDA]/10 flex items-center justify-center mr-4">
              <FileText className="h-5 w-5 text-[#444DDA]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">ข้อมูลคำขอตรวจสอบ</h2>
              <p className="text-sm text-gray-500">รหัสคำขอ: {order.TrackingNumber}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">วันที่สร้าง</p>
              <p className="font-medium">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">ประเภท</p>
              <p className="font-medium">
                {order.OrderType === 'personal' ? 'บุคคล' : 'บริษัท'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">ราคารวม</p>
              <p className="font-medium text-[#444DDA]">
                {(order.TotalPrice || 0).toLocaleString()} บาท
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">สถานะ</p>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFC107]/20 text-amber-800">
                <Clock className="h-3.5 w-3.5 mr-1" />
                กำลังดำเนินการ
              </span>
            </div>
          </div>
        </div>
        
        {/* Upload Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center border-b border-gray-100 pb-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#444DDA]/10 flex items-center justify-center mr-4">
              <Upload className="h-5 w-5 text-[#444DDA]" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">เพิ่มผลการตรวจสอบ</h2>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          {uploadProgress && (
            <div className={`p-4 mb-6 rounded-md ${
              uploadProgress.status === 'success' ? 'bg-green-50 border-l-4 border-green-500' : 
              uploadProgress.status === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
              'bg-blue-50 border-l-4 border-[#444DDA]'
            }`}>
              <div className="flex">
                {uploadProgress.status === 'uploading' && (
                  <div className="mr-2 flex-shrink-0">
                    <svg className="animate-spin h-5 w-5 text-[#444DDA]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                {uploadProgress.status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                )}
                {uploadProgress.status === 'error' && (
                  <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                )}
                <div>
                  <p className={`text-sm ${
                    uploadProgress.status === 'success' ? 'text-green-700' : 
                    uploadProgress.status === 'error' ? 'text-red-700' :
                    'text-[#444DDA]'
                  }`}>
                    {uploadProgress.message || 'กำลังอัปโหลด...'}
                  </p>
                  
                  {uploadProgress.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div 
                        className="bg-[#444DDA] h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกผู้สมัคร
              </label>
              <div className="relative">
                <select
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-[#444DDA] appearance-none"
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ไฟล์ผลการตรวจสอบ
              </label>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                selectedFile ? 'border-[#444DDA] bg-[#444DDA]/5' : 'border-gray-300 hover:border-[#444DDA]'
              }`}>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  required={!selectedFile}
                  id="result-file-input"
                  onChange={handleFileChange}
                />
                <label htmlFor="result-file-input" className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center">
                    {selectedFile ? (
                      <div className="w-16 h-16 rounded-full bg-[#444DDA]/10 flex items-center justify-center mb-3">
                        <CheckCircle className="h-7 w-7 text-[#444DDA]" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Upload className="h-7 w-7 text-gray-400" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 mb-1">
                      {selectedFile ? 'คลิกเพื่อเปลี่ยนไฟล์' : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่'}
                    </span>
                    <span className="text-xs text-gray-500">
                      รองรับไฟล์: PDF, DOC, DOCX, JPG, JPEG, PNG (ขนาดไม่เกิน 10MB)
                    </span>
                  </div>
                </label>
              </div>
              
              {/* แสดงไฟล์ที่เลือก */}
              {selectedFile && (
                <div className="mt-3 p-3 bg-[#444DDA]/5 rounded-lg border border-[#444DDA]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getFileIcon(selectedFile.name)}
                      <span className="ml-2 text-sm font-medium text-gray-700">{selectedFile.name}</span>
                      <span className="ml-2 text-xs text-gray-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSelectedFile(null)} 
                      className="text-gray-400 hover:text-red-500"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเหตุ
              </label>
              <textarea
                value={resultNote}
                onChange={(e) => setResultNote(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-[#444DDA]"
                rows="3"
                placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับผลการตรวจสอบ"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                สถานะผลการตรวจสอบ
              </label>
              <div className="flex gap-4">
                <label className="relative rounded-full p-0.5 overflow-hidden">
                  <input
                    type="radio"
                    className="sr-only"
                    name="resultStatus"
                    value="pass"
                    checked={resultStatus === 'pass'}
                    onChange={() => setResultStatus('pass')}
                  />
                  <div className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    resultStatus === 'pass' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      ผ่าน
                    </div>
                  </div>
                </label>
                
                <label className="relative rounded-full p-0.5 overflow-hidden">
                  <input
                    type="radio"
                    className="sr-only"
                    name="resultStatus"
                    value="fail"
                    checked={resultStatus === 'fail'}
                    onChange={() => setResultStatus('fail')}
                  />
                  <div className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    resultStatus === 'fail' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 mr-1.5" />
                      ไม่ผ่าน
                    </div>
                  </div>
                </label>
                
                <label className="relative rounded-full p-0.5 overflow-hidden">
                  <input
                    type="radio"
                    className="sr-only"
                    name="resultStatus"
                    value="pending"
                    checked={resultStatus === 'pending'}
                    onChange={() => setResultStatus('pending')}
                  />
                  <div className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    resultStatus === 'pending' 
                      ? 'bg-[#FFC107]/20 text-amber-800' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1.5" />
                      รอผล
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Link 
                href={`/admin/dashboard/${orderId}`}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium inline-flex items-center"
              >
                ยกเลิก
              </Link>
              
              <button
                type="submit"
                disabled={uploadProgress?.status === 'uploading'}
                className={`px-5 py-2.5 rounded-lg transition-colors text-sm font-medium flex items-center ${
                  uploadProgress?.status === 'uploading'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#444DDA] text-white hover:bg-[#3B43BF] shadow-md hover:shadow-lg'
                }`}
              >
                {uploadProgress?.status === 'uploading' ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังอัปโหลด...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    บันทึกผลการตรวจสอบ
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}