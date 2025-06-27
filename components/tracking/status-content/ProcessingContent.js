import React, { useEffect, useState } from 'react';
import { checkAuthStatus } from '@/services/auth';

const ProcessingContent = ({ order }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isBrowser, setIsBrowser] = useState(false);
  
  // Check if we're on the browser side
  useEffect(() => {
    setIsBrowser(true);
  }, []);
  
  // Check authentication status
  useEffect(() => {
    if (!isBrowser) return;
    
    const checkAuth = async () => {
      try {
        const { authenticated, user } = await checkAuthStatus();
        setIsLoggedIn(authenticated);
        setUser(user);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, [isBrowser]);
  
  if (!order) {
    return <div className="p-6 text-center">Order data not found</div>;
  }

  // Log data for debugging
  console.log("ProcessingContent - Order Data:", order);
  
  // Use data from order
  const candidates = order.candidates || [];
  const services = order.services || [];
  const payment = order.payment || {};
  const orderCompletion = order.orderCompletion || {};
  
  // Check progress
  const orderProgress = orderCompletion.percentage || 0;
  
  // Function for file download
  const handleDownload = (fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };
  
  // Function to format file size
  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Function to get service name from serviceId
  function getServiceName(serviceId) {
    const service = services.find(s => s._id === serviceId);
    return service ? service.title : 'Background Check Service';
  }

  // Count completed services and total for each person
  function getCandidateProgress(candidate) {
    if (!candidate.services || !candidate.serviceResults) {
      return { completed: 0, total: candidate.services ? candidate.services.length : 0 };
    }
    
    const total = candidate.services.length;
    const completed = candidate.serviceResults.length;
    return { completed, total };
  }
  
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-[40px] border border-gray-200 overflow-hidden p-8">
          {/* Company Information and Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            {/* Company Information */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Company Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm">Full Name</p>
                  <p className="font-medium">{order.user?.username}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Company Name</p>
                  <p className="font-medium">{order.user?.companyName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Email Address</p>
                  <p className="font-medium">{order.user?.email}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Phone Number</p>
                  <p className="font-medium">{order.user?.phoneNumber}</p>
                </div>
              </div>
            </div>
            
            {/* Payment Information */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Payment Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm">Payment ID</p>
                  <p className="font-medium">{payment?.Payment_ID}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Payment Method</p>
                  <p className="font-medium">{payment?.paymentMethod === "qr_payment" ? "QR Payment" : payment?.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Total Amount</p>
                  <p className="font-medium">{order?.TotalPrice && `${order.TotalPrice.toLocaleString()} THB`}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Status</p>
                  <p className="font-medium">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                      ${payment?.paymentStatus === "completed" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                      {payment?.paymentStatus === "completed" ? "Payment Completed" : "Payment Pending"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Display (if available) */}
          {orderCompletion && orderCompletion.percentage !== undefined && (
            <div className="mb-10 bg-[#F5F7FF] p-6 rounded-lg border border-[#E0E4FF]">
              <h3 className="text-lg font-semibold text-[#444DDA] mb-4">Background Check Progress</h3>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div 
                  className="bg-[#444DDA] h-4 rounded-full transition-all duration-500"
                  style={{width: `${orderProgress}%`}}
                ></div>
              </div>
              <p className="text-gray-600 text-sm">
                {orderCompletion.completedCandidates || 0} of {orderCompletion.totalCandidates || candidates.length} people
                ({orderProgress}%)
              </p>
            </div>
          )}

          {/* Background Check Service List */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Background Check Service List</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#F5F7FF]">
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-[#444DDA]">
                      No.
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-[#444DDA]">
                      Background Check Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-[#444DDA]">
                      Number of People
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-[#444DDA]">
                      Candidates
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service, serviceIndex) => {
                    // Filter candidates using this service
                    const candidatesUsingThisService = candidates.filter(c => {
                      if (!c.services || !Array.isArray(c.services)) return false;
                      
                      // Check both string array and object array formats
                      return c.services.some(s => 
                        (typeof s === 'string' && s === service._id) || 
                        (typeof s === 'object' && s.id === service._id || s.id === service.service)
                      );
                    });
                    
                    return (
                      <tr key={serviceIndex} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {serviceIndex + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {service.title || 'Background Check Service'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {candidatesUsingThisService.length}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex flex-col space-y-2">
                            {candidatesUsingThisService.map((candidate, idx) => (
                              <div key={idx}>
                                {candidate.C_FullName}, {candidate.C_Email}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Background Check Results for Each Candidate */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-[#444DDA] mb-6 border-b-2 border-[#444DDA] pb-2">
              Candidate Background Check Results
            </h3>
            
            {candidates.map((candidate, index) => {
              const progress = getCandidateProgress(candidate);
              return (
                <div key={index} className="mb-10 border-2 border-[#E0E4FF] rounded-xl overflow-hidden shadow-sm">
                  {/* Header for each candidate */}
                  <div className="bg-[#444DDA] text-white p-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-medium flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {candidate.C_FullName}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                          {candidate.C_Email}
                        </span>
                        <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                          {progress.completed}/{progress.total} services
                        </span>
                        {candidate.summaryResult && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFC107]/90 text-gray-700">
                            Summary Available
                          </span>
                        )}
                      </div>
                    </div>
                    {candidate.C_Company_Name && (
                      <p className="text-sm text-white/80 mt-1">
                        Company: {candidate.C_Company_Name}
                      </p>
                    )}
                  </div>
                  
                  <div className="p-6 bg-white">
                    {/* Individual Service Results */}
                    <div className="mb-6">
                      <h5 className="text-md font-medium text-[#444DDA] mb-4 border-l-4 border-[#444DDA] pl-3">
                        Individual Service Results
                      </h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {candidate.services && candidate.services.map((service, serviceIndex) => {
                          const serviceId = service.id || service;
                          const serviceResult = candidate.serviceResults?.find(r => r.serviceId === serviceId);
                          
                          // Find service name (using correct order)
                          let serviceName = 'Background Check Service';
                          
                          // Method 1: From service.name (already in object)
                          if (service.name) {
                            serviceName = service.name;
                          }
                          // Method 2: From serviceResult (if result exists)
                          else if (serviceResult?.serviceName) {
                            serviceName = serviceResult.serviceName;
                          }
                          // Method 3: From services array in order
                          else if (services?.length > 0) {
                            const foundService = services.find(s => s._id === serviceId);
                            if (foundService?.title) {
                              serviceName = foundService.title;
                            }
                          }
                          
                          const status = serviceResult ? serviceResult.resultStatus : 'pending';
                          
                          return (
                            <div key={serviceIndex} className="border border-gray-200 rounded-lg p-4 bg-[#F5F7FF] hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 rounded-full bg-[#444DDA] flex items-center justify-center mr-3 text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <h6 className="font-medium text-gray-800">
                                    {serviceName}
                                  </h6>
                                </div>
                                
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                                  ${status === 'pass' ? 'bg-green-100 text-green-800' : 
                                    status === 'fail' ? 'bg-red-100 text-red-800' : 
                                      'bg-[#FFC107] text-[#444DDA]'}`}>
                                  {status === 'pass' ? 'Pass' : 
                                    status === 'fail' ? 'Fail' : 'Pending'}
                                </span>
                              </div>
                              
                              {serviceResult && serviceResult.resultFile ? (
                                <div className="mt-3 flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
                                  <div className="flex items-center flex-1 min-w-0">
                                    <div className="h-10 w-10 bg-[#FFC107]/20 rounded-lg flex items-center justify-center mr-3 text-[#FFC107]">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate" title={serviceResult.resultFileName || 'Background Check Result.pdf'}>
                                        {serviceResult.resultFileName || 'Background Check Result.pdf'}
                                      </p>
                                      {serviceResult.resultFileSize && (
                                        <p className="text-xs text-gray-500">
                                          {formatFileSize(serviceResult.resultFileSize)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={() => handleDownload(serviceResult.resultFile)}
                                    className="ml-2 px-3 py-1.5 bg-[#FFC107]/85 hover:bg-[#FFB000] text-gray-700 text-sm font-medium rounded transition-colors flex items-center"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                  </button>
                                </div>
                              ) : (
                                <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                                  <div className="flex flex-col items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-gray-500 font-medium">Processing</p>
                                    <p className="text-xs text-gray-400 mt-1">System is processing this service data</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Overall Results */}
                    {candidate.summaryResult ? (
                      <div className="mt-6">
                        <h5 className="text-md font-medium text-[#444DDA] mb-4 border-l-4 border-[#444DDA] pl-3">
                          Overall Results
                        </h5>
                        
                        <div className="border-2 border-[#444DDA]/20 rounded-lg p-5 bg-[#F5F7FF]">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center mb-2">
                                <div className={`h-2.5 w-2.5 rounded-full mr-2 ${
                                  candidate.summaryResult.overallStatus === 'pass' ? 'bg-green-500' : 
                                  candidate.summaryResult.overallStatus === 'fail' ? 'bg-red-500' : 
                                  'bg-[#FFC107]'}`}></div>
                                <h6 className="font-semibold text-gray-800 text-lg">
                                  Overall Result: {' '}
                                  <span className={
                                    candidate.summaryResult.overallStatus === 'pass' ? 'text-green-600' : 
                                    candidate.summaryResult.overallStatus === 'fail' ? 'text-red-600' : 
                                    'text-[#FFC107]'
                                  }>
                                    {candidate.summaryResult.overallStatus === 'pass' ? 'Pass' : 
                                    candidate.summaryResult.overallStatus === 'fail' ? 'Fail' : 'Pending'}
                                  </span>
                                </h6>
                              </div>
                            </div>
                            
                            {/* Download Summary Report Button */}
                            {candidate.summaryResult.resultFile && (
                              <button
                                onClick={() => handleDownload(candidate.summaryResult.resultFile)}
                                className="px-4 py-2 bg-[#444DDA]/90 hover:bg-[#3B43BF] text-white text-sm font-medium rounded-lg transition-colors flex items-center shadow-md hover:shadow-lg"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download Summary Report
                              </button>
                            )}
                          </div>
                          
                          {/* Show Summary File */}
                          {candidate.summaryResult.resultFile && (
                            <div className="flex items-center p-3 rounded-lg border border-[#444DDA]/20 bg-white">
                              <div className="h-12 w-12 bg-[#444DDA]/10 rounded-lg flex items-center justify-center mr-4 text-[#444DDA]">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium" title={candidate.summaryResult.resultFileName || 'Summary Report.pdf'}>
                                  {candidate.summaryResult.resultFileName || 'Summary Report.pdf'}
                                </p>
                                {candidate.summaryResult.resultFileSize && (
                                  <p className="text-xs text-gray-500">
                                    PDF • {formatFileSize(candidate.summaryResult.resultFileSize)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6">
                        <h5 className="text-md font-medium text-[#444DDA] mb-4 border-l-4 border-[#444DDA] pl-3">
                          Overall Results
                        </h5>
                        <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-gray-500">No overall results yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Processing Status Message */}
          <div className="text-center p-6 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex justify-center mb-4">
              <div className="h-14 w-14 rounded-full border-4 border-indigo-300 border-t-indigo-500 animate-spin"></div>
            </div>
            <h4 className="text-lg font-medium text-indigo-600 mb-2">Background Check in Progress</h4>
            <p className="text-gray-500">
              The system is processing your background check data. Please wait for updates from our team.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              You will receive an email notification when the background check is completed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingContent;