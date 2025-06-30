'use client'
import { useState } from 'react';
import Link from 'next/link';

const ForgotPassword = () => {
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Form section */}
        <div className="w-full md:w-1/2 px-6 md:px-5 py-5 flex flex-col justify-center">
          <div className="max-w-3/4 mx-auto w-full">
            <h1 className="text-6xl font-bold text-gray-800 mb-4">Forgot Password</h1>
            <p className="text-xl text-gray-700 mb-10">Need help accessing your account?</p>

            {/* Contact Admin Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mr-3">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                <h2 className="text-2xl font-semibold text-gray-800">กรุณาติดต่อ Admin ระบบ</h2>
              </div>
              <p className="text-gray-700 mb-4">
                หากคุณลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบเพื่อขอรีเซ็ตรหัสผ่านใหม่
              </p>
              
              <button
                onClick={() => setShowContact(!showContact)}
                className="bg-blue-600 text-white font-medium py-2 px-4 rounded-full hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {showContact ? 'ซ่อนข้อมูลติดต่อ' : 'แสดงข้อมูลติดต่อ'}
              </button>

              {showContact && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">ช่องทางติดต่อ</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                    {/* Left Column - Contact Info */}
                    <div className="space-y-4">
                      {/* LINE Contact */}
                      <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.631-.63.345 0 .627.285.627.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">LINE Official Account</p>
                          <p className="text-green-600 font-medium">@854twluw</p>
                        </div>
                      </div>

                      {/* Email Contact */}
                      <div className="flex items-center p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Email</p>
                          <a 
                            href="mailto:supercertify@gmail.com" 
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            supercertify@gmail.com
                          </a>
                        </div>
                      </div>

                      {/* Phone Contact */}
                      <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">โทรศัพท์</p>
                          <a 
                            href="tel:020777581" 
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            02-0777581
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - QR Code */}
                    <div className="flex items-center justify-center">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                        <img 
                          src="/QrCodeLine.png" 
                          alt="LINE QR Code สำหรับติดต่อ SuperCertify" 
                          className="w-32 h-32 object-contain mx-auto mb-2"
                        />
                        <p className="text-sm text-gray-600">สแกนเพื่อเพิ่มเพื่อน LINE</p>
                        <p className="text-xs text-green-600 font-medium">@854twluw</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 lg:col-span-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 text-center">
                      <strong>เวลาทำการ:</strong> จันทร์ - ศุกร์ 9:00 - 18:00 น.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">ขั้นตอนการติดต่อ</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>เลือกช่องทางการติดต่อที่สะดวกสำหรับคุณ</li>
                <li>แจ้งชื่อผู้ใช้งาน (Username) หรืออีเมลที่ใช้ลงทะเบียน</li>
                <li>อธิบายปัญหาที่พบ เช่น "ลืมรหัสผ่าน"</li>
                <li>รอการติดต่อกลับจากทีมงาน</li>
              </ol>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link 
                href="/login" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M19 12H5"></path>
                  <path d="M12 19l-7-7 7-7"></path>
                </svg>
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>

        {/* Image section */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-30 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 bg-indigo-200 rounded-full opacity-40 animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 right-20 w-12 h-12 bg-purple-200 rounded-full opacity-25 animate-pulse delay-500"></div>
          
          <div className="relative z-10 text-center max-w-md px-8">
            {/* Main icon */}
            <div className="relative mb-8">
              <div className="w-28 h-28 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
              </div>
              {/* Floating support icons */}
              <div className="absolute -top-1 -right-1 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.631-.63.345 0 .627.285.627.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
              </div>
              <div className="absolute -bottom-1 -left-1 w-9 h-9 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce delay-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
              </div>
            </div>

            {/* Text content */}
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 leading-tight">
              ต้องการความช่วยเหลือ?
            </h2>
            <p className="text-xl text-gray-700 mb-3 font-medium">
              ทีมงาน <span className="text-blue-600 font-bold">SuperCertify</span>
            </p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              พร้อมช่วยเหลือคุณตลอด 24 ชั่วโมง
            </p>

            {/* QR Code Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/30 transform hover:scale-105 transition-all duration-300">
              <div className="text-center">
                <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.631-.63.345 0 .627.285.627.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                  </svg>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-2">สแกนเพื่อติดต่อ LINE</h3>
                
                <div className="bg-white rounded-2xl p-4 shadow-inner mb-3">
                  <img 
                    src="/QrCodeLine.png" 
                    alt="LINE QR Code สำหรับติดต่อ SuperCertify" 
                    className="w-40 h-40 object-contain mx-auto"
                  />
                </div>
                
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-green-700 font-semibold text-sm">@854twluw</p>
                  <p className="text-green-600 text-xs mt-1">LINE Official Account</p>
                </div>
              </div>
            </div>
        

            {/* Bottom note - removed */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;