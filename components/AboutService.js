// components/AboutService.jsx
import React from 'react';

const AboutService = () => {
  return (
    <section className="py-16 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">         
          กำลังมองหารายละเอียดการตรวจสอบประวัติ
          </h2>
          <div className="w-24 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
        </div>

        <div className="mb-16 max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <p className="text-xl md:text-2xl font-medium text-gray-900 mb-6 leading-relaxed text-center">
            เราเชื่อว่าการมีทีมงานที่ดี เริ่มต้นจากข้อมูลที่ถูกต้องและโปร่งใส
          </p>
          <p className="text-gray-700 mb-6 leading-relaxed">
            บริการตรวจสอบประวัติ (Background Check Service - BGC) ของเรา ก่อตั้งขึ้นเพื่อช่วยให้องค์กรสามารถ
            ตัดสินใจเกี่ยวกับการคัดเลือกบุคลากรได้อย่างมั่นใจ ด้วยข้อมูลที่ถูกต้อง ครบถ้วน และผ่านการตรวจสอบ
            จากแหล่งข้อมูลที่เชื่อถือได้
          </p>
          <p className="text-gray-700 leading-relaxed">
            เราทำงานร่วมกับหน่วยงานภาครัฐ สถาบันการศึกษา และแหล่งข้อมูลต่าง ๆ ที่เป็นทางการ เพื่อให้การตรวจ
            สอบมีความแม่นยำสูงสุด ทั้งยังให้ความสำคัญกับความปลอดภัยของข้อมูล และความเป็นส่วนตัวของทุก
            ฝ่ายที่เกี่ยวข้อง
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            ทำไมต้องตรวจสอบประวัติพนักงาน?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900">1. ลดความเสี่ยงในองค์กร</h4>
              </div>
              <p className="text-gray-700 ml-14">
                การจ้างงานที่ไม่ผ่านการตรวจสอบ อาจนำมาซึ่งความเสียหายทั้งด้านการเงิน
                ภาพลักษณ์ และความปลอดภัยในที่ทำงาน
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900">2. เพิ่มความมั่นใจในการคัดเลือก</h4>
              </div>
              <p className="text-gray-700 ml-14">
                การมีข้อมูลที่ครบถ้วนช่วยให้ฝ่ายบุคคลสามารถตัดสินใจได้อย่าง
                มั่นใจ ลดความผิดพลาดในการรับคนเข้าทำงาน
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900">3. ส่งเสริมวัฒนธรรมองค์กรที่ดี</h4>
              </div>
              <p className="text-gray-700 ml-14">
                เมื่อพนักงานทุกคนผ่านการคัดกรองอย่างเท่าเทียม จะช่วยสร้าง
                บรรยากาศที่ปลอดภัยและโปร่งใส
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-3 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900">4. แสดงถึงความเป็นมืออาชีพ</h4>
              </div>
              <p className="text-gray-700 ml-14">
                การตรวจสอบประวัติเป็นมาตรฐานที่องค์กรชั้นนำทั่วโลก
                ปฏิบัติ ถือเป็นการสร้างความน่าเชื่อถือทั้งภายในและภายนอก
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            ทำไมคุณต้องเลือกเราเป็นผู้ให้บริการ
          </h3>
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-800"><span className="font-semibold">เชื่อถือได้ 100% :</span> ข้อมูลทุกชิ้นผ่านการตรวจสอบจากแหล่งข้อมูลทางการ พร้อมรายงานที่โปร่งใส</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-800"><span className="font-semibold">บริการรวดเร็ว ทันสมัย:</span> ตรวจสอบและส่งผลภายใน 7-14 วันทำการ ผ่านระบบออนไลน์และออฟไลน์เต็มรูปแบบ</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-800"><span className="font-semibold">รักษาความลับสูงสุด :</span> ข้อมูลส่วนบุคคลของคุณจะได้รับการจัดเก็บและดูแลตามมาตรฐานสากล (PDPA Compliance)</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-800"><span className="font-semibold">ครอบคลุมหลายด้าน :</span> ตรวจสอบได้ทั้งประวัติอาชญากรรม การศึกษา การทำงาน เครดิต และอื่น ๆ ตามความต้องการ</p>
                </div>
              </div>
              <div className="flex items-start md:col-span-2">
                <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-800"><span className="font-semibold">ทีมงานผู้เชี่ยวชาญ :</span> พร้อมให้คำปรึกษาและช่วยวิเคราะห์ข้อมูลอย่างมืออาชีพ</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a href="/faqs" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-full font-medium hover:bg-indigo-700 transition duration-300 ease-in-out">
            คำถามที่พบบ่อย
          </a>
        </div>
      </div>
    </section>
  );
};

export default AboutService;