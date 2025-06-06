'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrderById, uploadDocument, getServices, getUploadedDocuments } from '@/services/apiService';
import Image from 'next/image';

export default function DocumentUploadPage() {
  const params = useParams();
  const router = useRouter();
  const { orderId, candidateId } = params;
  
  const [candidate, setCandidate] = useState(null);
  const [services, setServices] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [existingDocuments, setExistingDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (!orderId || !candidateId) {
      setError('Missing order ID or candidate ID');
      setLoading(false);
      return;
    }
    
    async function fetchData() {
      try {
        // 1. ดึงข้อมูล Order และ Candidate
        const orderData = await getOrderById(orderId);
        
        if (!orderData || !orderData.candidates) {
          throw new Error('Invalid order data');
        }
        
        const candidateData = orderData.candidates.find(c => c._id === candidateId);
        
        if (!candidateData) {
          throw new Error('Candidate not found');
        }
        
        setCandidate(candidateData);
        
        // 2. ดึงข้อมูลบริการ
        const allServices = await getServices();
        
        // 3. ดึงเอกสารที่อัปโหลดแล้วของ candidate
        const uploadedDocsData = await getUploadedDocuments(candidateId);
        const uploadedServiceDocs = uploadedDocsData.serviceDocuments || [];
        
        // สร้าง map ของเอกสารที่มีอยู่แล้ว
        const existingDocsMap = {};
        uploadedServiceDocs.forEach(serviceDocs => {
          serviceDocs.documents.forEach(doc => {
            const key = `${serviceDocs.service._id}_${doc.documentType}`;
            existingDocsMap[key] = {
              id: doc._id,
              path: doc.filePath,
              name: doc.fileName,
              isPreview: doc.filePath.toLowerCase().endsWith('.jpg') || 
                         doc.filePath.toLowerCase().endsWith('.jpeg') || 
                         doc.filePath.toLowerCase().endsWith('.png'),
              uploadedAt: doc.uploadedAt
            };
          });
        });
        
        setExistingDocuments(existingDocsMap);
        
        // 4. สร้างรายการบริการและเอกสารที่ต้องการ
        const candidateServices = [];
        
        if (candidateData.services && Array.isArray(candidateData.services)) {
          for (const service of candidateData.services) {
            const serviceId = typeof service === 'object' ? service.id : service;
            const serviceData = allServices.find(s => s._id === serviceId);
            
            if (serviceData) {
              // หาเอกสารที่อัปโหลดแล้วของบริการนี้
              const uploadedService = uploadedServiceDocs.find(s => s.service._id === serviceId);
              const uploadedDocs = uploadedService ? uploadedService.documents : [];
              
              // สร้างรายการเอกสารสำหรับบริการนี้
              let documents = [];
              
              if (serviceData.RequiredDocuments && serviceData.RequiredDocuments.length > 0) {
                documents = serviceData.RequiredDocuments.map(doc => {
                  // ตรวจสอบว่ามีการอัปโหลดเอกสารนี้แล้วหรือไม่
                  const uploaded = uploadedDocs.find(d => d.documentType === doc.document_id);
                  
                  return {
                    id: doc.document_id,
                    name: doc.document_name,
                    fileTypes: doc.file_types,
                    maxSize: doc.max_size || 5 * 1024 * 1024, // default 5MB if not specified
                    required: doc.required || true,
                    uploaded: !!uploaded,
                    uploadedId: uploaded ? uploaded._id : null,
                    uploadedName: uploaded ? uploaded.fileName : null,
                    uploadedPath: uploaded ? uploaded.filePath : null
                  };
                });
              }
              
              // เพิ่มบริการเข้าไปในรายการ
              candidateServices.push({
                id: serviceData._id,
                name: serviceData.Service_Title,
                description: serviceData.Service_Desc || getDefaultDescription(serviceData.Service_Title),
                documents: documents,
                isPackage: serviceData.Service_Title.toLowerCase().includes('package'),
                image: serviceData.Service_Image || `/images/services/${serviceData.Service_Title.toLowerCase().replace(/\s+/g, '_')}.svg`,
                isComplete: documents.every(doc => !doc.required || doc.uploaded)
              });
            }
          }
        }
        
        setServices(candidateServices);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Error loading data');
        setLoading(false);
      }
    }
    
    fetchData();
  }, [orderId, candidateId]);
  
  // ฟังก์ชันสำหรับสร้างคำอธิบายบริการเริ่มต้น
  const getDefaultDescription = (serviceName) => {
    if (serviceName.includes('Employment Check')) {
      return 'The pre-appointment checks that are required by law and applicable guidance, including without limitation, verification of identity checks, right to work checks, registration and qualification checks, employment history and reference checks to check that applicants have the experience and qualifications as stated in their resume or job application.';
    } else if (serviceName.includes('Identity Check')) {
      return 'Compares the identity that a person claims to have with the supporting data they possess. It analyzes ID documentation and evidence in a bid to authenticate it and prove that its purported owner is who he or she claims to be.';
    } else if (serviceName.includes('Criminal Check')) {
      return 'Employers use to screen potential employees for criminal records, past convictions, and other information that could affect their suitability for a job. It is one of the most important types of background checks because it can help the employer find out if the potential employee has any criminal records or convictions.';
    } else if (serviceName.includes('Educational Check')) {
      return 'Information about a candidate\'s education history, such as dates of attendance, majors, graduation date, and degrees or certificates earned. In the case of candidates who are graduates, the verification will usually focus on the most recent school attended.';
    }
    return '';
  };
  
  const handleFileChange = (serviceId, docId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedFiles(prev => ({
        ...prev,
        [`${serviceId}_${docId}`]: {
          file,
          preview: reader.result
        }
      }));
    };
    
    reader.readAsDataURL(file);
  };
  
const handleSubmitService = async (serviceId) => {
  console.log('🔍 === DEBUG DOCUMENT UPLOAD ===');
  
  const service = services.find(s => s.id === serviceId);
  if (!service) return;
  
  console.log('📋 Service:', service.name);
  console.log('📄 Documents in service:', service.documents);
    
    // ตรวจสอบว่าต้องอัปโหลดเอกสารครบหรือไม่
    const requiredDocs = service.documents.filter(doc => doc.required);
    const missingUploads = requiredDocs.filter(doc => {
      // ตรวจสอบว่าเอกสารนี้มีการอัปโหลดอยู่แล้วหรือไม่
      const existingKey = `${serviceId}_${doc.id}`;
      const hasExisting = existingDocuments[existingKey];
      
      // ตรวจสอบว่ามีการเลือกไฟล์ใหม่หรือไม่
      const hasNew = uploadedFiles[`${serviceId}_${doc.id}`];
      
      return !hasExisting && !hasNew;
    });
    
    if (missingUploads.length > 0) {
      const missingNames = missingUploads.map(doc => doc.name).join(', ');
      alert(`กรุณาอัปโหลดเอกสารที่จำเป็นให้ครบถ้วน: ${missingNames}`);
      return;
    }
    
    setIsSubmitting(true);
    
  try {
    const uploadPromises = [];
    
    for (const doc of service.documents) {
      const fileKey = `${serviceId}_${doc.id}`;
      const newFile = uploadedFiles[fileKey];
      
      console.log(`📂 Processing document:`, {
        docId: doc.id,
        docName: doc.name,
        hasNewFile: !!newFile,
        hasExisting: !!existingDocuments[fileKey]
      });
      
      if (!newFile && existingDocuments[fileKey]) {
        console.log(`⏭️ Skipping ${doc.id} - already exists`);
        continue;
      }
      
      if (!newFile && !doc.required) {
        console.log(`⏭️ Skipping ${doc.id} - not required`);
        continue;
      }
      
      if (newFile) {
        console.log(`📤 Preparing upload for:`, {
          originalDocId: doc.id,
          fileName: newFile.file.name,
          fileSize: newFile.file.size
        });
        
        const formData = new FormData();
        formData.append('file', newFile.file);
        formData.append('candidateId', candidateId);
        formData.append('serviceId', serviceId);
        formData.append('documentType', doc.id);
        
        // 🔍 Debug: แสดงข้อมูลที่จะส่งไป
        console.log(`🚀 FormData contents:`, {
          candidateId: candidateId,
          serviceId: serviceId,
          documentType: doc.id,
          fileName: newFile.file.name
        });
        
        uploadPromises.push(uploadDocument(formData));
      }
    }
      
      // ถ้าไม่มีไฟล์ที่ต้องอัปโหลด
      if (uploadPromises.length === 0) {
        alert(`ไม่มีเอกสารใหม่ที่ต้องอัปโหลด`);
        setIsSubmitting(false);
        return;
      }
      
      // รอให้การอัปโหลดทั้งหมดเสร็จสิ้น
      const results = await Promise.all(uploadPromises);
      
      // ตรวจสอบผลลัพธ์ - แก้ไขจุดนี้
      // เพิ่มการตรวจสอบว่า r ไม่เป็น null ก่อนเข้าถึง r.success
      const failed = results.filter(r => r && !r.success);
      
      if (failed.length > 0) {
        alert(`มีเอกสารบางรายการอัปโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง`);
      } else {
        alert(`อัปโหลดเอกสารสำหรับบริการ ${service.name} สำเร็จ`);
        
        // รีเฟรชหน้าเพื่อดึงข้อมูลใหม่
        window.location.reload();
      }
    } catch (err) {
      console.error('Error uploading documents:', err);
      alert('เกิดข้อผิดพลาดในการอัปโหลดเอกสาร');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const goBack = () => {
    router.push(`/background-check/drop-document/${orderId}`);
  };
  
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#444DDA] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-100 text-red-600 p-6 rounded-xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">{error}</p>
          </div>
          <button 
            onClick={goBack}
            className="bg-[#444DDA] text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            กลับไปยังหน้ารายชื่อ
          </button>
        </div>
      </div>
    );
  }
  
  if (!candidate) {
    return (
      <div className="container max-w-4xl mx-auto p-8">
        <p>ไม่พบข้อมูลผู้สมัคร</p>
        <button onClick={goBack} className="bg-[#444DDA] text-white px-6 py-3 rounded-xl mt-4">
          กลับไปยังหน้ารายชื่อ
        </button>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <button onClick={goBack} className="flex items-center text-blue-600 hover:text-blue-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Document Submission
        </button>
        <h1 className="text-xl font-medium ml-2">: {candidate.C_FullName}</h1>
      </div>
      
      {services.map((service) => (
        <div key={service.id} className="mb-16 border border-gray-200 rounded-xl overflow-hidden shadow-md">
          {/* Service Card Header */}
          <div className="flex flex-col md:flex-row border-b border-gray-200">
            {/* Left side - Image */}
            <div className="w-full md:w-1/3 p-6 bg-white flex items-center justify-center">
              <div className="relative h-40 w-full">
                <Image 
                  src={service.image}
                  alt={service.name}
                  fill
                  style={{ objectFit: 'contain' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/services/default.svg";
                  }}
                />
              </div>
            </div>
            
            {/* Right side - Description */}
            <div className="w-full md:w-2/3 p-6 bg-white">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-medium mb-4">{service.name}</h2>
                
                {/* แสดงสถานะการอัปโหลดเอกสาร */}
                {service.isComplete ? (
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5"></span>
                    Complete
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mr-1.5"></span>
                    Incomplete
                  </span>
                )}
              </div>
              
              <p className="text-gray-700 mb-6">
                {service.description}
              </p>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Required documents</h3>
                <p className="text-gray-600">
                  {service.documents.filter(doc => doc.required).map(doc => doc.name).join(', ')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Documents Grid */}
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.documents.map((doc) => (
                <div key={doc.id} className="flex flex-col bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[16px] font-medium">{doc.name}</h3>
                    {doc.required && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Required</span>
                    )}
                  </div>
                  
                  {/* ส่วนของการแสดงไฟล์ที่อัปโหลดไว้แล้ว */}
                  {existingDocuments[`${service.id}_${doc.id}`] && !uploadedFiles[`${service.id}_${doc.id}`] && (
                    <div className="relative bg-gray-100 p-3 rounded-lg mb-2 flex items-center">
                      <div className="mr-3">
                        {existingDocuments[`${service.id}_${doc.id}`].isPreview ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-gray-800 truncate">{existingDocuments[`${service.id}_${doc.id}`].name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(existingDocuments[`${service.id}_${doc.id}`].uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <a 
                        href={existingDocuments[`${service.id}_${doc.id}`].path} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <button 
                        className="ml-2 text-red-600 hover:text-red-800"
                        onClick={() => {
                          // สร้าง file input ใหม่เพื่อให้ผู้ใช้สามารถเปลี่ยนไฟล์ได้
                          document.getElementById(`file-${service.id}-${doc.id}`).click();
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* ส่วนของการอัปโหลดไฟล์ใหม่ */}
                  {uploadedFiles[`${service.id}_${doc.id}`] ? (
                    <div className="relative border border-gray-300 rounded-lg p-4 text-center h-[120px] flex items-center justify-center">
                      {uploadedFiles[`${service.id}_${doc.id}`].file.type.includes('image') ? (
                        <img 
                          src={uploadedFiles[`${service.id}_${doc.id}`].preview} 
                          alt="Preview"
                          className="max-h-full max-w-full object-contain" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-xs mt-2 text-gray-500 truncate max-w-[200px]">
                            {uploadedFiles[`${service.id}_${doc.id}`].file.name}
                          </p>
                        </div>
                      )}
                      
                      <button 
                        className="absolute top-2 right-2 bg-red-100 p-1 rounded-full text-red-600 hover:bg-red-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFiles(prev => {
                            const newState = {...prev};
                            delete newState[`${service.id}_${doc.id}`];
                            return newState;
                          });
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : !existingDocuments[`${service.id}_${doc.id}`] && (
                    <div 
                      className="border border-gray-300 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors h-[120px] flex flex-col justify-center"
                      onClick={() => document.getElementById(`file-${service.id}-${doc.id}`).click()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <p className="text-sm text-gray-500">Click to upload or drag & drop</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Accepted formats: {doc.fileTypes?.join(', ') || 'PDF, JPG, PNG'}
                      </p>
                    </div>
                  )}
                  
                  <input 
                    type="file"
                    id={`file-${service.id}-${doc.id}`}
                    className="hidden"
                    onChange={(e) => handleFileChange(service.id, doc.id, e)}
                    accept={doc.fileTypes?.map(type => `.${type}`).join(',') || "image/*,.pdf,.doc,.docx"}
                  />
                </div>
              ))}
            </div>
            
            {/* ปุ่ม Save สำหรับแต่ละ Service */}
            <div className="flex justify-end mt-8">
              <button
                onClick={() => handleSubmitService(service.id)}
                disabled={isSubmitting === service.id}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isSubmitting === service.id 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-[#444DDA] text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting === service.id ? 'Saving...' : 'Save Documents'}
              </button>
            </div>
          </div>
        </div>
      ))}
      
      {/* Back button */}
      <div className="flex justify-center mt-12 mb-8">
        <button
          onClick={goBack}
          className="bg-gray-200 text-gray-800 px-8 py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
        >
          Back to Candidate List
        </button>
      </div>
    </div>
  );
}