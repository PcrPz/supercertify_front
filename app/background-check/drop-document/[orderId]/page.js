'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getOrderById, updateOrderToProcessing } from '@/services/apiService';
import useToast from '@/hooks/useToast'; // เพิ่ม import

export default function DocumentSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId;
  const toast = useToast(); // เพิ่ม hook
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (!orderId) {
      setError('ไม่พบรหัสคำสั่งซื้อ');
      setLoading(false);
      return;
    }
    
    async function fetchOrderData() {
      try {
        const orderData = await getOrderById(orderId);
        setOrder(orderData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
        setLoading(false);
      }
    }
    
    fetchOrderData();
  }, [orderId]);
  
  const handleUpload = (candidateId) => {
    router.push(`/background-check/document-upload/${orderId}/${candidateId}`);
  };
  
  const handleSubmit = async () => {
    // คำนวณจำนวนผู้สมัครที่ยังอัปโหลดเอกสารไม่ครบถ้วน
    const incompleteCount = order.candidates.filter(candidate => {
      const incompletedServices = candidate.services.filter(service => 
        service.missingDocs > 0 || (!service.isComplete && !service.error)
      ).length;
      return incompletedServices > 0;
    }).length;
    
    // ถ้ายังมีผู้สมัครที่ยังอัปโหลดเอกสารไม่ครบถ้วน
    if (incompleteCount > 0) {
      toast.warning(`กรุณาอัปโหลดเอกสารให้ครบถ้วนสำหรับผู้สมัครทั้ง ${incompleteCount} คนก่อนดำเนินการต่อ`);
      return;
    }
    
    // ถ้าครบถ้วนแล้ว ให้อัพเดทสถานะเป็น "processing" (ถ้าสถานะปัจจุบันเป็น payment_verified)
    try {
      setSubmitting(true);
      
      // แสดง loading toast
      const loadingToast = toast.loading('กำลังอัปเดตสถานะ...');
      
      // ตรวจสอบสถานะปัจจุบันของ Order
      const currentStatus = order.OrderStatus;
      
      // ถ้าสถานะเป็น payment_verified จึงจะเปลี่ยนเป็น processing ได้
      if (currentStatus === 'payment_verified') {
        const result = await updateOrderToProcessing(orderId);
        
        // ปิด loading toast
        toast.dismiss(loadingToast);
        
        if (result.success) {

          toast.success('อัปโหลดเอกสารและอัปเดตสถานะสำเร็จ!');
          // รอให้ toast แสดงก่อนนำทาง
          setTimeout(() => {
            router.push(`/background-check/document-success/${orderId}`);
          }, 1500);
        } else {
          toast.error(`เกิดข้อผิดพลาดในการอัปเดตสถานะ: ${result.message}`);
        }
      } else {
        // ปิด loading toast
        toast.dismiss(loadingToast);
        
        // ถ้าสถานะไม่ใช่ payment_verified ให้แจ้งเตือนผู้ใช้
        toast.success('อัปโหลดเอกสารเสร็จสมบูรณ์แล้ว');
        // รอให้ toast แสดงก่อนนำทาง
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Error submitting documents:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
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
            onClick={() => router.push('/dashboard')}
            className="bg-[#444DDA] text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            กลับไปยังหน้าหลัก
          </button>
        </div>
      </div>
    );
  }
  
  if (!order || !order.candidates || order.candidates.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600">ไม่พบข้อมูลผู้สมัคร</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-[#444DDA] text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors mt-4"
          >
            กลับไปยังหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  // คำนวณจำนวนผู้สมัครที่ยังอัปโหลดเอกสารไม่ครบถ้วน
  const incompleteCount = order.candidates.filter(candidate => {
    const incompletedServices = candidate.services.filter(service => 
      service.missingDocs > 0 || (!service.isComplete && !service.error)
    ).length;
    return incompletedServices > 0;
  }).length;
  
  // คำนวณจำนวนผู้สมัครทั้งหมด
  const totalCandidates = order.candidates.length;
  
  // คำนวณสถานะโดยรวมของการอัปโหลดเอกสาร
  const allComplete = incompleteCount === 0;
  
  return (
    <div className="container max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-[#323438]">Candidate/Personal Information</h1>
      
      {/* สถานะโดยรวมของการอัปโหลดเอกสาร */}
      <div className="mb-8 p-4 rounded-lg border-2 border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Document Upload Status</h2>
          {allComplete ? (
            <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium flex items-center">
              <span className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></span>
              All Documents Complete
            </span>
          ) : (
            <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center">
              <span className="w-3 h-3 bg-amber-500 rounded-full mr-2"></span>
              {incompleteCount}/{totalCandidates} Candidates with Missing Documents
            </span>
          )}
        </div>
      </div>
      
      {/* หัวตาราง */}
      <div className="rounded-[20px] border-2 border-[#323438] overflow-hidden mb-8">
        <div className="flex py-4 px-8 bg-white items-center">
          <div className="w-[8%] font-medium text-[#323438]">No.</div>
          <div className="w-[17%] font-medium text-[#323438]">Full Name</div>
          <div className="w-[19%] font-medium text-[#323438]">Company Name</div>
          <div className="w-[19%] font-medium text-[#323438]">Email Address</div>
          <div className="w-[37%] flex justify-between">
            <span className="font-medium text-[#323438]">Background Check</span>
            <span className="font-medium text-[#323438]">Information</span>
          </div>
        </div>
      </div>
      
      {/* รายการผู้สมัคร */}
      {order.candidates.map((candidate, index) => {
        // คำนวณจำนวน Service ที่ยังไม่เสร็จ
        const incompletedServices = candidate.services.filter(service => 
          service.missingDocs > 0 || (!service.isComplete && !service.error)
        ).length;
        
        // คำนวณจำนวน Service ทั้งหมด
        const totalServices = candidate.services.length;
        
        // คำนวณสถานะรวมของผู้สมัครนี้
        const allComplete = incompletedServices === 0 && totalServices > 0;
        
        return (
          <div key={candidate._id || index} className="rounded-[26px] border-2 border-[#323438] overflow-hidden mb-6 bg-white shadow hover:shadow-md transition-shadow">
            <div className="flex p-6 px-8 items-center">
              <div className="w-[8%] font-medium text-[#323438]">{index + 1}</div>
              <div className="w-[18%] font-medium text-[#323438]">{candidate.C_FullName}</div>
              <div className="w-[18%] text-[#323438]">{candidate.C_Company_Name || 'Personal'}</div>
              <div className="w-[19%] text-[#323438]">{candidate.C_Email}</div>
              <div className="w-[37%] flex justify-between items-center">
                <div className="pr-4 flex flex-col gap-1.5">
                  {candidate.services && candidate.services.length > 0 ? (
                    <>
                      {/* แสดงรายการ Service */}
                      {candidate.services.map((service, serviceIndex) => (
                        <div key={serviceIndex} className="flex items-center">
                          <span className="text-sm text-[#323438] mr-2">
                            {typeof service === 'string' ? service : service.name}
                          </span>
                          
                          {/* สถานะแต่ละ Service */}
                          {service.missingDocs > 0 ? (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center">
                              <span className="w-2 h-2 bg-amber-500 rounded-full mr-1.5"></span>
                              Incomplete
                            </span>
                          ) : service.isComplete ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5"></span>
                              Complete
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center">
                              <span className="w-2 h-2 bg-gray-500 rounded-full mr-1.5"></span>
                              No documents
                            </span>
                          )}
                        </div>
                      ))}
                      
                      {/* แสดงสถานะโดยรวมของผู้สมัคร */}
                      <div className="mt-2 border-t pt-2">
                        <span className="text-sm font-medium">Status: </span>
                        {allComplete ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium inline-flex items-center ml-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5"></span>
                            All Complete
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium inline-flex items-center ml-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full mr-1.5"></span>
                            {incompletedServices}/{totalServices} Services Incomplete
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400">No services</span>
                  )}
                </div>
                <button
                  onClick={() => handleUpload(candidate._id)}
                  className="bg-[#444DDA] text-white px-5 py-2 rounded-full text-sm hover:bg-blue-700 transition-colors"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* ปุ่ม Submit */}
      <div className="flex justify-end mt-10">
        <button
          onClick={handleSubmit}
          disabled={submitting || incompleteCount > 0}
          className={`px-12 py-4 rounded-full font-medium shadow-md ${
            submitting ? 
            'bg-gray-400 text-white cursor-not-allowed' : 
            incompleteCount > 0 ? 
            'bg-gray-300 text-gray-600 cursor-not-allowed' : 
            'bg-[#444DDA] text-white hover:bg-blue-700 transition-colors'
          }`}
        >
          {submitting ? 'Processing...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}