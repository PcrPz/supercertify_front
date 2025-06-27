'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  getOrderById, 
  uploadServiceResult, 
  uploadSummaryResult,
  getServiceNames,
  getServiceResult
} from '@/services/apiService';
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  FileText,
  File,
  Clock,
  Trash2,
  Eye,
  Download,
  Award,
  BookOpen,
  ClipboardList,
  ChevronDown,
  Check,
  X
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
  const [serviceNames, setServiceNames] = useState({});
  
  // Service Results
  const [serviceFiles, setServiceFiles] = useState({});
  const [serviceNotes, setServiceNotes] = useState({});
  const [serviceStatuses, setServiceStatuses] = useState({});
  const [existingServiceResults, setExistingServiceResults] = useState({});
  
  // Current selected service for upload
  const [selectedServiceForUpload, setSelectedServiceForUpload] = useState(null);
  
  // Summary Result
  const [selectedFilesForSummary, setSelectedFilesForSummary] = useState({});
  const [summaryCombinedPDF, setSummaryCombinedPDF] = useState(null);
  const [summaryNote, setSummaryNote] = useState('');
  const [summaryStatus, setSummaryStatus] = useState('pass');
  
  const [uploadProgress, setUploadProgress] = useState(null);
  const [activeTab, setActiveTab] = useState('services');
  const fileInputRef = useRef(null);
  
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        const [orderData, serviceNamesData] = await Promise.all([
          getOrderById(orderId),
          getServiceNames()
        ]);
        
        setOrder(orderData);
        setServiceNames(serviceNamesData);
        
        if (orderData.candidates && orderData.candidates.length > 0) {
          let candidate;
          if (initialCandidateId) {
            candidate = orderData.candidates.find(c => c._id === initialCandidateId);
          }
          if (!candidate) {
            candidate = orderData.candidates[0];
          }
          
          setSelectedCandidate(candidate);
          await initializeServiceData(candidate);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('ไม่สามารถดึงข้อมูลได้');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [orderId, initialCandidateId]);

  // เพิ่ม useEffect ใหม่นี้หลังจาก useEffect ที่ดึงข้อมูล Order
useEffect(() => {
  if (order && order.candidates && !order.orderCompletion) {
    // หาจำนวน candidates ที่มีผลครบถ้วนแล้ว
    const completedCandidates = order.candidates.filter(candidate => {
      // ถ้ามี result ถือว่าเสร็จสมบูรณ์
      if (candidate.result) return true;
      
      // หรือถ้ามีผลครบทุกบริการ
      if (candidate.serviceResults && candidate.services) {
        const completedServices = candidate.services.filter(service => {
          const serviceId = service.id || service._id;
          return candidate.serviceResults.some(result => 
            (result.serviceId === serviceId) || 
            (result.serviceId.toString && result.serviceId.toString() === serviceId.toString())
          );
        }).length;
        
        return completedServices >= candidate.services.length;
      }
      
      return false;
    }).length;
    
    // คำนวณเปอร์เซ็นต์
    const percentage = order.candidates.length > 0 
      ? Math.round((completedCandidates / order.candidates.length) * 100)
      : 0;
    
    // อัปเดตข้อมูล
    setOrder(prev => ({
      ...prev,
      orderCompletion: {
        completedCandidates,
        totalCandidates: order.candidates.length,
        percentage,
        isComplete: completedCandidates === order.candidates.length
      }
    }));
  }
}, [order?.candidates]);

  const initializeServiceData = async (candidate) => {
    if (!candidate || !candidate.services) return;
    
    const initialServiceFiles = {};
    const initialServiceNotes = {};
    const initialServiceStatuses = {};
    const initialExistingResults = {};
    const initialSelectedForSummary = {};
    
    candidate.services.forEach(service => {
      const serviceId = service.id || service._id;
      initialServiceFiles[serviceId] = null;
      initialServiceNotes[serviceId] = '';
      initialServiceStatuses[serviceId] = 'pass';
      initialSelectedForSummary[serviceId] = false;
    });
    
    if (candidate.serviceResults && Array.isArray(candidate.serviceResults)) {
      for (const result of candidate.serviceResults) {
        if (result && result.serviceId) {
          const serviceId = result.serviceId.toString();
          initialExistingResults[serviceId] = result;
          initialServiceNotes[serviceId] = result.resultNotes || '';
          initialServiceStatuses[serviceId] = result.resultStatus || 'pass';
          initialSelectedForSummary[serviceId] = true;
        }
      }
    }
    
    setExistingServiceResults(initialExistingResults);
    setServiceFiles(initialServiceFiles);
    setServiceNotes(initialServiceNotes);
    setServiceStatuses(initialServiceStatuses);
    setSelectedFilesForSummary(initialSelectedForSummary);
    
    if (candidate.services.length > 0) {
      setSelectedServiceForUpload(candidate.services[0].id || candidate.services[0]._id);
    }
  };
  
  const handleCandidateChange = async (candidateId) => {
    const candidate = order.candidates.find(c => c._id === candidateId);
    setSelectedCandidate(candidate);
    await initializeServiceData(candidate);
    
    setSummaryCombinedPDF(null);
    setSummaryNote('');
    setSummaryStatus('pass');
  };

const handleFileChange = (files) => {
  if (!files || files.length === 0 || !selectedServiceForUpload) return;
  
  const file = files[0];
  
  if (file.size > maxFileSize) {
    setError(`ไฟล์ ${file.name} มีขนาดเกิน 50MB`);
    return;
  }
  
  const allowedTypes = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  if (!allowedTypes.includes(fileExtension)) {
    setError(`ไฟล์ ${file.name} ประเภทไม่ถูกต้อง`);
    return;
  }
  
  console.log(`กำลังอัปเดตไฟล์สำหรับ serviceId: ${selectedServiceForUpload}`);
  
  // สร้างออบเจ็กต์ใหม่ทั้งหมดแทนการอัปเดตแบบเดิม
  const updatedFiles = { ...serviceFiles };
  updatedFiles[selectedServiceForUpload] = file;
  setServiceFiles(updatedFiles);
  
  setSelectedFilesForSummary(prev => ({
    ...prev,
    [selectedServiceForUpload]: true
  }));
  
  setError(null);
};
  
  const removeCurrentFile = () => {
    if (!selectedServiceForUpload) return;
    
    setServiceFiles(prev => ({
      ...prev,
      [selectedServiceForUpload]: null
    }));
  };

  // Helper functions
  const getServiceName = (serviceId) => {
    return serviceNames[serviceId]?.Service_Title || `บริการ #${serviceId}`;
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
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
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

  // Render Service Tab
  const renderServiceTab = () => {
    const candidateServices = selectedCandidate?.services || [];
    const currentFile = selectedServiceForUpload ? serviceFiles[selectedServiceForUpload] : null;
    const currentExisting = selectedServiceForUpload ? existingServiceResults[selectedServiceForUpload] : null;
    const currentNote = selectedServiceForUpload ? serviceNotes[selectedServiceForUpload] || '' : '';
    const currentStatus = selectedServiceForUpload ? serviceStatuses[selectedServiceForUpload] || 'pass' : 'pass';

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#444DDA]/10 to-blue-50 rounded-2xl p-6 border border-[#444DDA]/20">
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 rounded-full bg-[#444DDA]/10 flex items-center justify-center mr-4">
              <BookOpen className="h-6 w-6 text-[#444DDA]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">อัปโหลดผลการตรวจสอบแยกตามบริการ</h3>
              <p className="text-gray-600 text-sm mt-1">เลือกบริการและอัปโหลดผลการตรวจสอบ (1 บริการต่อ 1 ไฟล์)</p>
            </div>
          </div>
        </div>

        {/* Service Selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">เลือกบริการที่ต้องการอัปโหลดผล</h4>
          
          <div className="relative">
            <select
              value={selectedServiceForUpload || ''}
              onChange={(e) => setSelectedServiceForUpload(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-[#444DDA] appearance-none"
            >
              <option value="">-- เลือกบริการ --</option>
              {candidateServices.map(service => {
                const serviceId = service.id || service._id;
                const serviceName = getServiceName(serviceId);
                const hasExisting = existingServiceResults[serviceId];
                const hasNew = serviceFiles[serviceId];
                
                return (
                  <option key={serviceId} value={serviceId}>
                    {serviceName} {hasExisting ? '(มีผลอยู่แล้ว)' : ''} {hasNew ? '(มีไฟล์ใหม่)' : ''}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Upload Area */}
{selectedServiceForUpload && (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between mb-4">
      <h4 className="text-lg font-semibold text-gray-800">
        อัปโหลดผลสำหรับ: {getServiceName(selectedServiceForUpload)}
      </h4>
      {currentExisting && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-4 w-4 mr-1" />
          มีผลอยู่แล้ว
        </span>
      )}
    </div>
    
    {/* เพิ่มข้อความแจ้งเตือนตรงนี้ */}
    {!serviceFiles[selectedServiceForUpload] && !existingServiceResults[selectedServiceForUpload] && (
      <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
          <p className="text-sm text-amber-700">
            กรุณาอัปโหลดไฟล์ผลการตรวจสอบสำหรับบริการนี้
          </p>
        </div>
      </div>
    )}

{/* Existing Result Info - ปรับปรุงใหม่ */}
            {currentExisting && (
              <div className="mb-6 p-6 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <h5 className="text-sm font-semibold text-green-800">ผลการตรวจสอบที่มีอยู่แล้ว</h5>
                  </div>
                </div>

                {/* แสดงข้อมูลผลเดิม */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1">สถานะปัจจุบัน</label>
                    <div className="flex items-center">
                      {currentExisting.resultStatus === 'pass' ? (
                        <div className="flex items-center text-[#444DDA]">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">ผ่าน</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <XCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">ไม่ผ่าน</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1">ไฟล์ปัจจุบัน</label>
                    {currentExisting.resultFile ? (
                      <a 
                        href={currentExisting.resultFile} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:underline"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        {currentExisting.fileName || 'ดูไฟล์ผลการตรวจสอบ'}
                        <Eye className="h-3 w-3 ml-1" />
                      </a>
                    ) : (
                      <span className="text-sm text-gray-500">ไม่มีไฟล์</span>
                    )}
                  </div>
                </div>

                {/* แสดงหมายเหตุเดิม */}
                {currentExisting.resultNotes && (
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-green-700 mb-1">หมายเหตุปัจจุบัน</label>
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <p className="text-sm text-gray-700">{currentExisting.resultNotes}</p>
                    </div>
                  </div>
                )}

                {/* ปุ่มแก้ไข */}
                <div className="flex items-center justify-between pt-3 border-t border-green-200">
                  <p className="text-xs text-green-700">
                  หากต้องการอัปเดต ให้อัปโหลดไฟล์ใหม่หรือแก้ไขข้อมูลด้านล่าง
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // เติมข้อมูลเดิมลงใน form เพื่อแก้ไข
                      setServiceNotes(prev => ({
                        ...prev,
                        [selectedServiceForUpload]: currentExisting.resultNotes || ''
                      }));
                      setServiceStatuses(prev => ({
                        ...prev,
                        [selectedServiceForUpload]: currentExisting.resultStatus || 'pass'
                      }));
                    }}
                    className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    นำข้อมูลเดิมมาแก้ไข
                  </button>
                </div>
              </div>
            )}

            {/* File Upload - ปรับคำอธิบาย */}
            <div className="mb-6">
              {!currentFile ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#444DDA] hover:bg-[#444DDA]/5 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium mb-1">
                    {currentExisting ? 'คลิกเพื่อเปลี่ยนไฟล์ผลการตรวจสอบ' : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่'}
                  </p>
                  <p className="text-sm text-gray-500">
                    รองรับ PDF, DOC, DOCX, JPG, PNG (สูงสุด 50MB)
                    {currentExisting && <br />}
                    {currentExisting && <span className="text-black"> ไฟล์ใหม่จะแทนที่ไฟล์เดิม</span>}
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getFileIcon(currentFile.name)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">{currentFile.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(currentFile.size)}</p>
                        {currentExisting && (
                          <p className="text-xs text-amber-600 mt-1">🔄 จะแทนที่ไฟล์เดิม</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        เปลี่ยนไฟล์
                      </button>
                      <button
                        type="button"
                        onClick={removeCurrentFile}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={currentExisting ? "ยกเลิกการเปลี่ยนไฟล์" : "ลบไฟล์"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเหตุสำหรับ {getServiceName(selectedServiceForUpload)}
              </label>
              <textarea
                value={currentNote}
                onChange={(e) => setServiceNotes(prev => ({
                  ...prev,
                  [selectedServiceForUpload]: e.target.value
                }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-[#444DDA] resize-none"
                rows="3"
                placeholder="หมายเหตุเพิ่มเติม..."
              />
            </div>

            {/* Status - เหลือแค่ ผ่าน/ไม่ผ่าน */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                สถานะผลการตรวจสอบ
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'pass', label: 'ผ่าน', icon: CheckCircle, color: '#444DDA' },
                  { value: 'fail', label: 'ไม่ผ่าน', icon: XCircle, color: '#dc2626' }
                ].map(({ value, label, icon: Icon, color }) => (
                  <label key={value} className="relative cursor-pointer">
                    <input
                      type="radio"
                      className="sr-only"
                      name={`status-${selectedServiceForUpload}`}
                      value={value}
                      checked={currentStatus === value}
                      onChange={() => setServiceStatuses(prev => ({
                        ...prev,
                        [selectedServiceForUpload]: value
                      }))}
                    />
                    <div className={`p-4 rounded-xl border-2 transition-all ${
                      currentStatus === value 
                        ? `border-[${color}] bg-[${color}]/10` 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`} style={{
                      borderColor: currentStatus === value ? color : '',
                      backgroundColor: currentStatus === value ? `${color}1A` : ''
                    }}>
                      <div className="flex items-center justify-center">
                        <Icon className={`h-6 w-6 mr-2`} style={{
                          color: currentStatus === value ? color : '#9CA3AF'
                        }} />
                        <span className={`text-sm font-semibold`} style={{
                          color: currentStatus === value ? color : '#6B7280'
                        }}>
                          {label}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Include in Summary */}
            <div className="border-t border-gray-100 pt-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#444DDA] rounded border-gray-300 focus:ring-[#444DDA]"
                  checked={selectedFilesForSummary[selectedServiceForUpload] || false}
                  onChange={(e) => setSelectedFilesForSummary(prev => ({
                    ...prev,
                    [selectedServiceForUpload]: e.target.checked
                  }))}
                  disabled={!currentFile && !currentExisting}
                />
                <span className="ml-2 text-sm text-gray-700">
                  รวมไฟล์นี้ในรายงานสรุป
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Services Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">ภาพรวมบริการทั้งหมด</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidateServices.map(service => {
              const serviceId = service.id || service._id;
              const serviceName = getServiceName(serviceId);
              const hasExisting = existingServiceResults[serviceId];
              const hasNew = serviceFiles[serviceId];
              const isSelected = selectedServiceForUpload === serviceId;
              
              return (
                <div 
                  key={serviceId}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-[#444DDA] bg-[#444DDA]/10' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedServiceForUpload(serviceId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{serviceName}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        {hasExisting && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            มีผลแล้ว
                          </span>
                        )}
                        {hasNew && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <Upload className="h-3 w-3 mr-1" />
                            ไฟล์ใหม่
                          </span>
                        )}
                        {!hasExisting && !hasNew && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            <X className="h-3 w-3 mr-1" />
                            ยังไม่มีผล
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#444DDA] flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render Summary Tab
  const renderSummaryTab = () => {
    const candidateServices = selectedCandidate?.services || [];
    
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FFC107]/10 to-orange-50 rounded-2xl p-6 border border-[#FFC107]/30">
          <div className="flex items-center mb-3">
            <div className="w-12 h-12 rounded-full bg-[#FFC107]/20 flex items-center justify-center mr-4">
              <Award className="h-6 w-6 text-[#FFC107]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">รายงานสรุปการตรวจสอบ</h3>
              <p className="text-gray-600 text-sm mt-1">สร้างรายงานสรุปรวมที่รวมผลการตรวจสอบทุกบริการที่เลือกไว้</p>
            </div>
          </div>
        </div>

{/* Service Selection for Summary - แสดงผลที่มีอยู่แล้ว */}
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
    <ClipboardList className="h-5 w-5 text-[#FFC107] mr-2" />
    บริการที่จะรวมในรายงานสรุป
  </h4>
  
  {/* ถ้ามีรายงานสรุปอยู่แล้ว แสดงส่วนนี้ */}
  {selectedCandidate && selectedCandidate.summaryResult && (
    <div className="mb-6 p-6 bg-green-50 rounded-xl border border-green-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <h5 className="text-sm font-semibold text-green-800">ผลการตรวจสอบรวมที่มีอยู่แล้ว</h5>
        </div>
      </div>

      {/* แสดงข้อมูลผลเดิม */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-green-700 mb-1">สถานะปัจจุบัน</label>
          <div className="flex items-center">
            {selectedCandidate.summaryResult.overallStatus === 'pass' ? (
              <div className="flex items-center text-[#444DDA]">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">ผ่าน</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <XCircle className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">ไม่ผ่าน</span>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-green-700 mb-1">ไฟล์รายงานสรุป</label>
          {selectedCandidate.summaryResult.resultFile ? (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm text-gray-700">
                  {selectedCandidate.summaryResult.resultFileName || 'รายงานสรุป.pdf'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <a 
                  href={selectedCandidate.summaryResult.resultFile} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-blue-600 hover:underline bg-blue-50 px-2.5 py-1 rounded-lg"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  ดูไฟล์
                </a>
                <a 
                  href={selectedCandidate.summaryResult.resultFile}
                  download
                  className="inline-flex items-center text-xs text-blue-600 hover:underline bg-blue-50 px-2.5 py-1 rounded-lg"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  ดาวน์โหลด
                </a>
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-500">ไม่มีไฟล์</span>
          )}
        </div>
      </div>

      {/* แสดงหมายเหตุเดิม */}
      {selectedCandidate.summaryResult.notes && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-green-700 mb-1">หมายเหตุปัจจุบัน</label>
          <div className="bg-white p-3 rounded-lg border border-green-200">
            <p className="text-sm text-gray-700">{selectedCandidate.summaryResult.notes}</p>
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-green-200">
        <p className="text-xs text-green-700">
          การสร้างรายงานสรุปใหม่จะแทนที่รายงานสรุปเดิม
        </p>
      </div>
    </div>
  )}
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {candidateServices.map(service => {
      const serviceId = service.id || service._id;
      const serviceName = getServiceName(serviceId);
      const file = serviceFiles[serviceId];
      const existingResult = existingServiceResults[serviceId];
      const isSelected = selectedFilesForSummary[serviceId];
      const hasFile = file || existingResult;
      
      return (
        <div 
          key={serviceId} 
          className={`p-4 rounded-xl border-2 transition-all ${
            isSelected && hasFile
              ? 'border-[#FFC107] bg-[#FFC107]/10' 
              : hasFile
              ? 'border-gray-200 bg-gray-50 hover:border-gray-300'
              : 'border-gray-200 bg-gray-50 opacity-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <input
                type="checkbox"
                className="w-4 h-4 text-[#FFC107] rounded border-gray-300 focus:ring-[#FFC107]"
                checked={isSelected || false}
                onChange={(e) => setSelectedFilesForSummary(prev => ({
                  ...prev,
                  [serviceId]: e.target.checked
                }))}
                disabled={!hasFile}
              />
              <div className="ml-3 flex-1">
                <p className={`font-medium text-sm ${
                  isSelected && hasFile ? 'text-[#FFC107]' : 'text-gray-700'
                }`}>
                  {serviceName}
                </p>
                <div className="flex items-center mt-1">
                  {file && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                      <Upload className="h-3 w-3 mr-1" />
                      ไฟล์ใหม่
                    </span>
                  )}
                  {existingResult && !file && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      ไฟล์เดิม
                    </span>
                  )}
                  {!hasFile && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      ไม่มีไฟล์
                    </span>
                  )}
                </div>
              </div>
            </div>
            {isSelected && hasFile && (
              <div className="w-6 h-6 rounded-full bg-[#FFC107] flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
</div>
{/* PDF Generation */}
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
  <h4 className="text-lg font-semibold text-gray-800 mb-4">สร้างรายงานสรุป PDF</h4>
  
  {selectedCandidate && selectedCandidate.summaryResult && !summaryCombinedPDF && (
    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mb-4">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-blue-500 mr-2" />
        <p className="text-sm text-blue-700">
          มีรายงานสรุปอยู่แล้ว การสร้างรายงานใหม่จะแทนที่รายงานเดิม
        </p>
      </div>
    </div>
  )}
  
  <div className="flex gap-3 mb-4">
    <button
      type="button"
      onClick={generateSummaryPDF}
      disabled={
        uploadProgress?.status === 'processing' ||
        !Object.entries(selectedFilesForSummary).some(
          ([serviceId, isSelected]) => isSelected && 
          (serviceFiles[serviceId] || existingServiceResults[serviceId])
        )
      }
      className={`px-6 py-3 rounded-xl transition-all font-medium flex items-center ${
        uploadProgress?.status === 'processing' ||
        !Object.entries(selectedFilesForSummary).some(
          ([serviceId, isSelected]) => isSelected && 
          (serviceFiles[serviceId] || existingServiceResults[serviceId])
        )
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-[#FFC107] text-white hover:bg-[#FFC107]/90 shadow-lg hover:shadow-xl'
      }`}
    >
      <FileText className="h-5 w-5 mr-2" />
      สร้างรายงานสรุป
    </button>
    
    {summaryCombinedPDF && (
      <>
        <button
          type="button"
          onClick={() => {
            const url = URL.createObjectURL(summaryCombinedPDF);
            window.open(url, '_blank');
          }}
          className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center shadow-lg hover:shadow-xl"
        >
          <Eye className="h-5 w-5 mr-2" />
          ดูตัวอย่าง
        </button>
        <button
          type="button"
          onClick={() => {
            const url = URL.createObjectURL(summaryCombinedPDF);
            const a = document.createElement('a');
            a.href = url;
            a.download = `สรุปการตรวจสอบ_${selectedCandidate?.C_FullName || 'candidate'}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center shadow-lg hover:shadow-xl"
        >
          <Download className="h-5 w-5 mr-2" />
          ดาวน์โหลด
        </button>
      </>
    )}
    
    {/* แสดงลิงก์ดูไฟล์เดิม (ถ้ามี) และยังไม่ได้สร้างไฟล์ใหม่ */}
    {selectedCandidate && selectedCandidate.summaryResult && selectedCandidate.summaryResult.resultFile && 
     !summaryCombinedPDF && (
      <a 
        href={selectedCandidate.summaryResult.resultFile} 
        target="_blank" 
        rel="noopener noreferrer"
        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium flex items-center"
      >
        <Eye className="h-5 w-5 mr-2" />
        ดูรายงานเดิม
      </a>
    )}
  </div>
  
  {summaryCombinedPDF && (
    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
      <div className="flex items-center">
        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
        <span className="text-sm text-green-700">
          รายงานสรุปสร้างเสร็จแล้ว! ขนาด: {formatFileSize(summaryCombinedPDF.size)}
        </span>
      </div>
    </div>
  )}
</div>
        
        {/* Summary Notes and Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-6">ข้อมูลเพิ่มเติมสำหรับรายงานสรุป</h4>
          
          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมายเหตุรายงานสรุป
            </label>
            <textarea
              value={summaryNote}
              onChange={(e) => setSummaryNote(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-[#FFC107] resize-none"
              rows="4"
              placeholder="หมายเหตุสำหรับรายงานสรุปการตรวจสอบประวัติโดยรวม..."
            />
          </div>
          
          {/* Status - เหลือแค่ ผ่าน/ไม่ผ่าน */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              สถานะผลการตรวจสอบโดยรวม
            </label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'pass', label: 'ผ่าน', icon: CheckCircle, color: '#444DDA' },
                { value: 'fail', label: 'ไม่ผ่าน', icon: XCircle, color: '#dc2626' }
              ].map(({ value, label, icon: Icon, color }) => (
                <label key={value} className="relative cursor-pointer">
                  <input
                    type="radio"
                    className="sr-only"
                    name="summary-status"
                    value={value}
                    checked={summaryStatus === value}
                    onChange={() => setSummaryStatus(value)}
                  />
                  <div className={`p-4 rounded-xl border-2 transition-all ${
                    summaryStatus === value 
                      ? `border-[${color}] bg-[${color}]/10` 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`} style={{
                    borderColor: summaryStatus === value ? color : '',
                    backgroundColor: summaryStatus === value ? `${color}1A` : ''
                  }}>
                    <div className="flex items-center justify-center">
                      <Icon className={`h-6 w-6 mr-2`} style={{
                        color: summaryStatus === value ? color : '#9CA3AF'
                      }} />
                      <span className={`text-sm font-semibold`} style={{
                        color: summaryStatus === value ? color : '#6B7280'
                      }}>
                        {label}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Generate Summary PDF function
  const generateSummaryPDF = async () => {
    const selectedServiceIds = Object.keys(selectedFilesForSummary).filter(
      serviceId => selectedFilesForSummary[serviceId] && 
      (serviceFiles[serviceId] || existingServiceResults[serviceId])
    );
    
    if (selectedServiceIds.length === 0) {
      setError('กรุณาเลือกอย่างน้อย 1 บริการสำหรับรายงานสรุป');
      return;
    }
    
    try {
      setUploadProgress({ 
        status: 'processing', 
        progress: 0, 
        message: 'กำลังสร้างรายงานสรุป...' 
      });
      
      const { PDFDocument, rgb } = await import('pdf-lib');
      const combinedPdf = await PDFDocument.create();
      
      const coverImageBlob = await generateCoverPageImage(selectedServiceIds);
      const coverImageBytes = await coverImageBlob.arrayBuffer();
      const coverImage = await combinedPdf.embedPng(coverImageBytes);
      
      const coverPage = combinedPdf.addPage([595.28, 841.89]);
      coverPage.drawImage(coverImage, {
        x: 0,
        y: 0,
        width: 595.28,
        height: 841.89
      });
      
      for (let i = 0; i < selectedServiceIds.length; i++) {
        const serviceId = selectedServiceIds[i];
        const serviceFile = serviceFiles[serviceId];
        const existingResult = existingServiceResults[serviceId];
        const serviceName = getServiceName(serviceId);
        
        setUploadProgress({ 
          status: 'processing', 
          progress: (i / selectedServiceIds.length) * 100, 
          message: `กำลังรวมไฟล์ ${i + 1}/${selectedServiceIds.length}: ${serviceName}` 
        });
        
        try {
          if (serviceFile) {
            if (serviceFile.type === 'application/pdf') {
              const arrayBuffer = await serviceFile.arrayBuffer();
              const pdf = await PDFDocument.load(arrayBuffer);
              const pages = await combinedPdf.copyPages(pdf, pdf.getPageIndices());
              pages.forEach(page => combinedPdf.addPage(page));
            } else if (serviceFile.type.startsWith('image/')) {
              const arrayBuffer = await serviceFile.arrayBuffer();
              let image;
              
              if (serviceFile.type === 'image/jpeg' || serviceFile.type === 'image/jpg') {
                image = await combinedPdf.embedJpg(arrayBuffer);
              } else if (serviceFile.type === 'image/png') {
                image = await combinedPdf.embedPng(arrayBuffer);
              }
              
              if (image) {
                const page = combinedPdf.addPage([595.28, 841.89]);
                const { width, height } = image.scale(0.5);
                page.drawImage(image, {
                  x: (595.28 - width) / 2,
                  y: (841.89 - height) / 2,
                  width: width,
                  height: height,
                });
              }
            }
          } else if (existingResult && existingResult.resultFile) {
            try {
              const response = await fetch(existingResult.resultFile);
              const fileData = await response.arrayBuffer();
              const contentType = response.headers.get('content-type');
              
              if (contentType?.includes('pdf')) {
                const pdf = await PDFDocument.load(fileData);
                const pages = await combinedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => combinedPdf.addPage(page));
              } else if (contentType?.includes('image')) {
                let image;
                
                if (contentType.includes('jpeg') || contentType.includes('jpg')) {
                  image = await combinedPdf.embedJpg(fileData);
                } else if (contentType.includes('png')) {
                  image = await combinedPdf.embedPng(fileData);
                }
                
                if (image) {
                  const page = combinedPdf.addPage([595.28, 841.89]);
                  const { width, height } = image.scale(0.5);
                  page.drawImage(image, {
                    x: (595.28 - width) / 2,
                    y: (841.89 - height) / 2,
                    width: width,
                    height: height,
                  });
                }
              }
            } catch (err) {
              console.warn(`ไม่สามารถรวมไฟล์เดิมของ ${serviceName}:`, err);
            }
          }
        } catch (err) {
          console.warn(`ไม่สามารถรวมไฟล์ ${serviceName}:`, err);
        }
      }
      
      const pdfBytes = await combinedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setSummaryCombinedPDF(blob);
      
      setUploadProgress({ 
        status: 'success', 
        progress: 100, 
        message: `สร้างรายงานสรุปสำเร็จ! ขนาด: ${formatFileSize(blob.size)}` 
      });
      
    } catch (err) {
      console.error('Error generating summary PDF:', err);
      setUploadProgress({ 
        status: 'error', 
        progress: 100, 
        message: 'เกิดข้อผิดพลาดในการสร้างรายงานสรุป' 
      });
    }
  };

  // Generate Cover Page Image
  const generateCoverPageImage = async (selectedServiceIds) => {
    const canvas = document.createElement('canvas');
    canvas.width = 2480;
    canvas.height = 3508;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#444DDA';
    ctx.lineWidth = 8;
    ctx.strokeRect(80, 80, canvas.width - 160, canvas.height - 160);
    
    ctx.strokeStyle = '#444DDA';
    ctx.lineWidth = 2;
    ctx.strokeRect(120, 120, canvas.width - 240, canvas.height - 240);
    
    let logoBottomY = 400;
    
    try {
      const logoUrl = '/LogoSC.png';
      const logoImage = await loadImage(logoUrl);
      
      const logoWidth = 600;
      const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
      
      ctx.drawImage(
        logoImage, 
        (canvas.width - logoWidth) / 2, 
        200, 
        logoWidth, 
        logoHeight
      );
      
      logoBottomY = 200 + logoHeight + 100;
    } catch (error) {
      console.warn('ไม่สามารถโหลด Logo ได้:', error);
      logoBottomY = 400;
    }
    
    const lineGradient = ctx.createLinearGradient(400, 0, canvas.width - 400, 0);
    lineGradient.addColorStop(0, 'rgba(68, 77, 218, 0)');
    lineGradient.addColorStop(0.5, 'rgba(68, 77, 218, 1)');
    lineGradient.addColorStop(1, 'rgba(68, 77, 218, 0)');
    
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(400, logoBottomY);
    ctx.lineTo(canvas.width - 400, logoBottomY);
    ctx.stroke();
    
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    
    ctx.font = '80px "Segoe UI", Tahoma, Geneva, sans-serif';
    ctx.fillText('รายงาน', canvas.width / 2, logoBottomY + 150);
    
    ctx.font = 'bold 120px "Segoe UI", Tahoma, Geneva, sans-serif';
    ctx.fillText('การตรวจสอบประวัติ', canvas.width / 2, logoBottomY + 300);
    
    const candidateName = selectedCandidate?.C_FullName || 'PPPP';
    const candidateEmail = selectedCandidate?.C_Email || 'PPP@gmail.com';
    const companyName = selectedCandidate?.C_Company_Name || '';
    
    const infoY = logoBottomY + 500;
    ctx.fillStyle = '#333';
    
    ctx.font = '70px "Segoe UI", Arial, sans-serif';
    ctx.fillText('รายงานสำหรับ', canvas.width / 2, infoY);
    
    ctx.font = 'bold 100px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#444DDA';
    ctx.fillText(candidateName, canvas.width / 2, infoY + 120);
    
    ctx.fillStyle = '#555';
    ctx.font = '50px "Segoe UI", Arial, sans-serif';
    ctx.fillText(candidateEmail, canvas.width / 2, infoY + 200);
    
    if (companyName) {
      ctx.fillStyle = '#666';
      ctx.font = '50px "Segoe UI", Arial, sans-serif';
      ctx.fillText(companyName, canvas.width / 2, infoY + 280);
    }
    
    ctx.fillStyle = '#444';
    ctx.font = '60px "Segoe UI", Arial, sans-serif';
    const currentDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    ctx.fillText(`วันที่ออกรายงาน: ${currentDate}`, canvas.width / 2, infoY + 360);
    
    ctx.fillStyle = '#555';
    ctx.font = '45px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`เลขที่คำขอ: ${order?.TrackingNumber || 'SCT51351325477'}`, canvas.width / 2, infoY + 450);
    
    const serviceBoxY = infoY + 550;
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 80px "Segoe UI", Arial, sans-serif';
    ctx.fillText('รายการตรวจสอบ', canvas.width / 2, serviceBoxY);
    
    const serviceLineGradient = ctx.createLinearGradient(700, 0, canvas.width - 700, 0);
    serviceLineGradient.addColorStop(0, 'rgba(68, 77, 218, 0)');
    serviceLineGradient.addColorStop(0.5, 'rgba(68, 77, 218, 1)');
    serviceLineGradient.addColorStop(1, 'rgba(68, 77, 218, 0)');
    
    ctx.strokeStyle = serviceLineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(700, serviceBoxY + 30);
    ctx.lineTo(canvas.width - 700, serviceBoxY + 30);
    ctx.stroke();
    
    const serviceListBoxX = 640;
    const serviceListBoxY = serviceBoxY + 100;
    const serviceListBoxWidth = 1200;
    
    ctx.textAlign = 'left';
    let yPos = serviceListBoxY;
    
    const headerGradient = ctx.createLinearGradient(serviceListBoxX, 0, serviceListBoxX + serviceListBoxWidth, 0);
    headerGradient.addColorStop(0, '#3b43bf');
    headerGradient.addColorStop(1, '#444DDA');
    
    ctx.fillStyle = headerGradient;
    ctx.fillRect(serviceListBoxX, yPos, serviceListBoxWidth, 90);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 50px "Segoe UI", Arial, sans-serif';
    ctx.fillText('บริการตรวจสอบ', serviceListBoxX + 60, yPos + 60);
    ctx.textAlign = 'center';
    ctx.fillText('ผลการตรวจสอบ', serviceListBoxX + serviceListBoxWidth - 250, yPos + 60);
    
    yPos += 90;
    
    // วาดรายการตรวจสอบ - ใช้สีใหม่
    selectedServiceIds.forEach((serviceId, index) => {
      const serviceName = getServiceName(serviceId);
      const status = serviceStatuses[serviceId] || 'pass';
      
      if (index % 2 === 0) {
        ctx.fillStyle = '#f8f9fa';
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fillRect(serviceListBoxX, yPos, serviceListBoxWidth, 90);
      
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.strokeRect(serviceListBoxX, yPos, serviceListBoxWidth, 90);
      
      ctx.textAlign = 'left';
      ctx.fillStyle = '#333';
      ctx.font = '45px "Segoe UI", Arial, sans-serif';
      
      let displayName = serviceName;
      if (displayName.length > 30) {
        displayName = displayName.substring(0, 27) + '...';
      }
      
      ctx.fillText(displayName, serviceListBoxX + 60, yPos + 60);
      
      ctx.textAlign = 'center';
      let statusText = 'ผ่าน';
      
      if (status === 'pass') {
        statusText = 'ผ่าน';
        ctx.fillStyle = '#444DDA';
      } else if (status === 'fail') {
        statusText = 'ไม่ผ่าน';
        ctx.fillStyle = '#dc2626';
      } else {
        statusText = 'ผ่าน';
        ctx.fillStyle = '#444DDA';
      }
      
      ctx.font = 'bold 40px "Segoe UI", Arial, sans-serif';
      ctx.fillText(statusText, serviceListBoxX + serviceListBoxWidth - 250, yPos + 60);
      
      yPos += 90;
    });
    
    const footerY = Math.max(yPos + 300, canvas.height - 300);
    
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(500, footerY);
    ctx.lineTo(canvas.width - 500, footerY);
    ctx.stroke();
    
    ctx.font = '40px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('รายงานฉบับนี้เป็นส่วนหนึ่งของบริการตรวจสอบประวัติ SuperCertify', canvas.width / 2, canvas.height - 200);
    
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png', 1.0);
    });
  };

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => {
        console.error('Error loading image:', e);
        reject(new Error(`ไม่สามารถโหลดรูปจาก ${url}`));
      };
      img.src = url;
    });
  }

// Submit function - ปรับปรุงให้รองรับการแก้ไข
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const hasServiceFiles = Object.values(serviceFiles).some(file => file !== null);
    const hasSummaryFile = summaryCombinedPDF !== null;
    const hasServiceUpdates = Object.keys(serviceNotes).some(serviceId => {
      const currentNote = serviceNotes[serviceId] || '';
      const currentStatus = serviceStatuses[serviceId] || 'pass';
      const existing = existingServiceResults[serviceId];
      
      // ตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่
      return existing && (
        currentNote !== (existing.resultNotes || '') ||
        currentStatus !== (existing.resultStatus || 'pass')
      );
    });
    
    if (!hasServiceFiles && !hasSummaryFile && !hasServiceUpdates) {
      setError('กรุณาอัปโหลดไฟล์ใหม่ หรือแก้ไขข้อมูลที่มีอยู่ หรือสร้างรายงานสรุป');
      return;
    }
    
    try {
      // 1. อัปโหลด/อัปเดตผลแต่ละ service
      if (hasServiceFiles || hasServiceUpdates) {
        setUploadProgress({ status: 'uploading', progress: 0, message: 'กำลังอัปโหลด/อัปเดตผลแต่ละบริการ...' });
        
        const services = selectedCandidate.services || [];
        let completedUploads = 0;
        let successCount = 0;
        
        for (let service of services) {
          const serviceId = service.id || service._id;
          const file = serviceFiles[serviceId];
          const currentNote = serviceNotes[serviceId] || '';
          const currentStatus = serviceStatuses[serviceId] || 'pass';
          const existing = existingServiceResults[serviceId];
          
          // ตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่
          const hasFileChange = file !== null;
          const hasDataChange = existing && (
            currentNote !== (existing.resultNotes || '') ||
            currentStatus !== (existing.resultStatus || 'pass')
          );
          
          // ข้ามถ้าไม่มีการเปลี่ยนแปลง
          if (!hasFileChange && !hasDataChange && !existing) {
            completedUploads++;
            continue;
          }
          
        if (!file) {
          console.log(`ไม่มีไฟล์สำหรับ ${getServiceName(serviceId)}, ข้าม...`);
          completedUploads++;
          continue;
        }
        
        const formData = new FormData();
        
          formData.append('file', file);
          // เพิ่มข้อมูลอื่นๆ
          formData.append('resultNotes', currentNote);
          formData.append('resultStatus', currentStatus);
          
          const actionType = existing ? 'อัปเดต' : 'อัปโหลด';
          console.log(`⬆️ ${actionType} service result for ${serviceId}`);
          
          const result = await uploadServiceResult(selectedCandidate._id, serviceId, formData);
          
          completedUploads++;
          if (result.success) {
            successCount++;
            setUploadProgress({ 
              status: 'uploading', 
              progress: (completedUploads / services.length) * 50, 
              message: `${actionType}บริการ ${completedUploads}/${services.length} สำเร็จ` 
            });
          } else {
            throw new Error(`ไม่สามารถ${actionType}ผลของ ${getServiceName(serviceId)} ได้: ${result.message}`);
          }
        }
        
        if (successCount === 0 && completedUploads < services.length) {
          throw new Error('ไม่มีการอัปโหลด/อัปเดตใดสำเร็จ');
        }
      }
      
  // 2. อัปโหลดผลสรุป (Summary)
    if (hasSummaryFile) {
      setUploadProgress({ 
        status: 'uploading', 
        progress: 50, 
        message: 'กำลังอัปโหลดรายงานสรุป...' 
      });
      
      const formData = new FormData();
      const fileName = `สรุปการตรวจสอบ_${selectedCandidate.C_FullName}.pdf`;
      formData.append('file', summaryCombinedPDF, fileName);
      formData.append('resultNotes', summaryNote);
      formData.append('overallStatus', summaryStatus);
      
      // ✅ ส่ง orderId เป็นพารามิเตอร์ที่ 3
      const result = await uploadSummaryResult(selectedCandidate._id, formData, orderId);
      
      if (!result.success) {
        throw new Error(result.message || 'ไม่สามารถอัปโหลดรายงานสรุปได้');
      }
    }
      
      // 3. สำเร็จ
      const hasUpdates = hasServiceUpdates || hasServiceFiles;
      const successMessage = hasUpdates 
        ? 'อัปเดต/อัปโหลดผลการตรวจสอบสำเร็จ!' 
        : 'อัปโหลดผลการตรวจสอบสำเร็จ!';
        
      setUploadProgress({ 
        status: 'success', 
        progress: 100, 
        message: successMessage
      });
      
      const remainingCandidates = order.candidates.filter(c => 
        c._id !== selectedCandidate._id && !c.result
      ).length;
      
      setTimeout(() => {
        if (remainingCandidates > 0) {
          window.location.reload();
        } else {
          router.push(`/admin/dashboard/${orderId}`);
        }
      }, 2000);
      
    } catch (err) {
      console.error('Error in submit:', err);
      setUploadProgress({ 
        status: 'error', 
        progress: 100, 
        message: err.message || 'เกิดข้อผิดพลาดในการบันทึกผล' 
      });
    }
  };

  // Loading states
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#444DDA] mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  if (error && !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6 rounded-r-xl">
            <div className="flex">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
          <Link 
            href="/admin/dashboard"
            className="inline-flex items-center px-6 py-3 bg-[#444DDA] text-white rounded-xl hover:bg-[#444DDA]/90 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            กลับไปหน้า Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  if (!order || order.OrderStatus !== 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 mb-6 rounded-r-xl">
            <div className="flex">
              <AlertTriangle className="h-6 w-6 text-amber-600 mr-3" />
              <p className="text-amber-800 font-medium">
                คำสั่งซื้อนี้ไม่อยู่ในสถานะ "กำลังดำเนินการ" จึงไม่สามารถเพิ่มผลการตรวจสอบได้
              </p>
            </div>
          </div>
          <Link 
            href="/admin/dashboard"
            className="inline-flex items-center px-6 py-3 bg-[#444DDA] text-white rounded-xl hover:bg-[#444DDA]/90 transition-colors shadow-sm"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            กลับไปหน้า Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Link 
              href={`/admin/dashboard/${orderId}`} 
              className="p-2 text-gray-500 hover:text-[#444DDA] hover:bg-white rounded-xl transition-all mr-4"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">เพิ่มผลการตรวจสอบ</h1>
              <p className="text-gray-600 mt-1">อัปโหลดผลการตรวจสอบแยกตามบริการและสร้างรายงานสรุป</p>
            </div>
          </div>
        </div>
        
 {/* Order Information Card - แก้ไข syntax error */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex items-center border-b border-gray-100 pb-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#444DDA]/10 flex items-center justify-center mr-4">
              <FileText className="h-6 w-6 text-[#444DDA]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">ข้อมูลคำขอตรวจสอบ</h2>
              <p className="text-gray-600">รหัสคำขอ: {order?.TrackingNumber}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">วันที่สร้าง</p>
              <p className="font-semibold text-gray-800">{formatDate(order?.createdAt)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">ประเภท</p>
              <p className="font-semibold text-gray-800">
                {order?.OrderType === 'personal' ? 'บุคคล' : 'บริษัท'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">ราคารวม</p>
              <p className="font-semibold text-[#444DDA]">
                {(order?.TotalPrice || 0).toLocaleString()} บาท
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">สถานะ</p>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                <Clock className="h-4 w-4 mr-1.5" />
                กำลังดำเนินการ
              </span>
            </div>
          </div>
        </div>
{/* เพิ่มส่วนแสดงความคืบหน้า - ใส่หลังจาก Order Information Card */}
{order && (
  <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
    <div className="flex items-center mb-6">
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
        <FileText className="h-6 w-6 text-blue-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-800">ความคืบหน้าการอัปโหลดผล</h2>
        <p className="text-gray-600">
          {order.orderCompletion?.completedCandidates || 0} จาก {order.orderCompletion?.totalCandidates || order.candidates?.length || 0} คน 
          ({order.orderCompletion?.percentage || 0}%)
        </p>
      </div>
    </div>
    
    {/* Progress Bar รวม */}
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">ความคืบหน้ารวม</span>
        <span className="text-sm font-medium text-blue-600">
          {order.orderCompletion?.percentage || 0}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${order.orderCompletion?.percentage || 0}%` }}
        ></div>
      </div>
    </div>
    
    {/* รายการ Candidates */}
<div className="space-y-4">
  {(order.candidateDetails || order.candidates)?.map((candidate, index) => {
    // สร้างตัวแปรเพื่อรองรับทั้งรูปแบบข้อมูลเก่าและใหม่
    const candidateId = candidate.candidateId || candidate._id;
    const candidateName = candidate.candidateName || candidate.name || candidate.C_FullName || 'ไม่ระบุชื่อ';
    const candidateEmail = candidate.candidateEmail || candidate.C_Email || '';
    
    // ตรวจสอบว่าครบ 100% หรือไม่
    const isComplete = candidate.isComplete || Boolean(candidate.result);
    
    // คำนวณจำนวนบริการที่เสร็จแล้ว
    const completedServices = candidate.completedServices || 
                           (candidate.services?.filter(s => s.hasResult).length || 
                           (candidate.serviceResults?.length || 0));
    const totalServices = candidate.totalServices || (candidate.services?.length || 0);
    
    // คำนวณเปอร์เซ็นต์
    const completionPercentage = Math.round((completedServices / Math.max(totalServices, 1)) * 100) || 0;
    
    // เลือกสีตามสถานะ - ใช้สีเขียวสำหรับ 100%, สีเหลืองสำหรับระหว่างดำเนินการ
    const isFullyComplete = completionPercentage === 100;
    const borderColor = isFullyComplete ? 'border-green-200' : 'border-amber-200';
    const bgColor = isFullyComplete ? 'bg-green-50' : 'bg-amber-50';
    return (
      <div 
        key={candidateId} 
        className={`border rounded-xl overflow-hidden ${borderColor}`}
      >
        <div className={`px-4 py-3 flex items-center justify-between ${bgColor}`}>
          <div className="flex items-center">
            {isFullyComplete ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
            ) : (
              <Clock className="h-5 w-5 text-amber-500 mr-3" />
            )}
            <div>
              <h3 className="font-semibold text-gray-800">
                {index + 1}. {candidateName}
              </h3>
              <p className="text-xs text-gray-600">{candidateEmail}</p>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600">
              {completedServices}/{totalServices} บริการ
            </span>
          </div>
        </div>
            
        {/* Progress Bar ของแต่ละ Candidate */}
        <div className="px-4 py-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">ความคืบหน้า</span>
            <span className="text-xs font-medium text-blue-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
            
            {/* แสดงรายละเอียดของบริการ */}
            <div className="p-4 grid grid-cols-1 gap-2">
              {candidate.services && candidate.services.map(service => {
                // รองรับทั้งรูปแบบข้อมูลเก่าและใหม่
                const serviceId = service.serviceId || service.id || service._id;
                const serviceName = service.serviceName || getServiceName(serviceId);
                
                // ตรวจสอบว่ามีผลหรือไม่
                const hasResult = service.hasResult || 
                                 (candidate.serviceResults && 
                                  candidate.serviceResults.some(r => 
                                    (r.serviceId === serviceId) || 
                                    (r.serviceId.toString && r.serviceId.toString() === serviceId.toString())
                                  ));
                
                return (
                  <div 
                    key={serviceId} 
                    className={`p-3 rounded-lg text-sm ${
                      hasResult ? 'bg-green-100 border border-green-200' : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      {hasResult ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0" />
                      )}
                      <span className={`${hasResult ? 'text-green-700' : 'text-gray-700'}`}>
                        {serviceName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
        
        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          {uploadProgress && (
            <div className={`p-4 mb-6 rounded-xl ${
              uploadProgress.status === 'success' ? 'bg-green-50 border-l-4 border-green-500' : 
              uploadProgress.status === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
              'bg-blue-50 border-l-4 border-blue-500'
            }`}>
              <div className="flex">
                {(uploadProgress.status === 'uploading' || uploadProgress.status === 'processing') && (
                  <div className="mr-2 flex-shrink-0">
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                <div className="flex-1">
                  <p className={`text-sm ${
                    uploadProgress.status === 'success' ? 'text-green-700' : 
                    uploadProgress.status === 'error' ? 'text-red-700' :
                    'text-blue-700'
                  }`}>
                    {uploadProgress.message || 'กำลังดำเนินการ...'}
                  </p>
                  
                  {(uploadProgress.status === 'uploading' || uploadProgress.status === 'processing') && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. เลือกผู้สมัคร */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <label className="block text-lg font-semibold text-gray-800 mb-4">
                เลือกผู้สมัคร
              </label>
              <div className="relative">
                <select
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#444DDA] focus:border-[#444DDA] appearance-none shadow-sm"
                  value={selectedCandidate?._id || ''}
                  onChange={(e) => handleCandidateChange(e.target.value)}
                  required
                >
                  {order?.candidates?.map(candidate => (
                    <option 
                      key={candidate._id} 
                      value={candidate._id}
                      disabled={candidate.result !== null}
                    >
                      {candidate.C_FullName} ({candidate.C_Email})
                      {candidate.result !== null ? ' - มีผลการตรวจสอบแล้ว' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 h-5 w-5" />
              </div>
              
              {/* แสดงรายการ Services ของ Candidate ที่เลือก */}
              {selectedCandidate && selectedCandidate.services && (
                <div className="mt-4 p-4 bg-[#444DDA]/10 rounded-xl border border-[#444DDA]/20">
                  <h4 className="text-sm font-semibold text-[#444DDA] mb-3 flex items-center">
                    <Award className="h-4 w-4 mr-2" />
                    บริการที่ต้องตรวจสอบสำหรับ {selectedCandidate.C_FullName}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.services.map(service => {
                      const serviceId = service.id || service._id;
                      return (
                        <span key={serviceId} className="px-3 py-1.5 bg-[#444DDA]/20 text-[#444DDA] rounded-full text-xs font-medium">
                          {getServiceName(serviceId)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Tabs สำหรับ Services และ Summary */}
            {selectedCandidate && (
              <div>
                {/* Tab Navigation */}
                <div className="flex space-x-1 rounded-2xl bg-gray-100 p-1.5 mb-8">
                  <button
                    type="button"
                    onClick={() => setActiveTab('services')}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      activeTab === 'services'
                        ? 'bg-white text-[#444DDA] shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      ผลแต่ละบริการ ({selectedCandidate.services?.length || 0})
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      activeTab === 'summary'
                        ? 'bg-white text-[#444DDA] shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <Award className="h-4 w-4 mr-2" />
                      รายงานสรุป
                    </div>
                  </button>
                </div>
                
                {/* Tab Content */}
                {activeTab === 'services' && renderServiceTab()}
                {activeTab === 'summary' && renderSummaryTab()}
              </div>
            )}

            {/* 3. Submit Button */}
            <div className="flex justify-end gap-4 pt-8 border-t border-gray-200">
              <Link 
                href={`/admin/dashboard/${orderId}`}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium inline-flex items-center"
              >
                ยกเลิก
              </Link>
              
                  <button
                    type="submit"
                    disabled={
                      !selectedCandidate || 
                      (selectedServiceForUpload && !serviceFiles[selectedServiceForUpload] && !existingServiceResults[selectedServiceForUpload]) ||
                      uploadProgress?.status === 'uploading'
                    }
                    className={`px-6 py-3 rounded-xl transition-all font-medium flex items-center ${
                      !selectedCandidate || 
                      (selectedServiceForUpload && !serviceFiles[selectedServiceForUpload] && !existingServiceResults[selectedServiceForUpload]) ||
                      uploadProgress?.status === 'uploading'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#444DDA] text-white hover:bg-[#444DDA]/90 shadow-lg hover:shadow-xl'
                    }`}
                  >
                {uploadProgress?.status === 'uploading' ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังอัปโหลด...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
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