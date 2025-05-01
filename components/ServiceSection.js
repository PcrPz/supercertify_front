'use client';  // เนื่องจากใช้ useState ต้องทำเป็น Client Component

import { useState } from 'react';
import ServiceCard from './ServiceCard';

export default function ServiceSection() {
  const [visibleCards, setVisibleCards] = useState(6);
  
  // ข้อมูลการ์ดทั้งหมด (สมมติว่ามี 12 การ์ด)
  const allCards = [
    {
      id: 1,
      imageSrc: '/Service/Criminal.png',
      title: 'Criminal Check',
      description: 'Screens a background screening process that verifies an individuals criminal record, including arrests, convictions, and other legal offenses.'
    },
    {
      id: 2,
      imageSrc: '/Service/Financial.png',
      title: 'Financial Check (Credit Bureau)',
      description: 'Screens a review of an individuals credit history, including loans, payments, debts, and creditworthiness, as reported by a credit bureau.'
    },
    {
      id: 3,
      imageSrc: '/Service/Employment.png',
      title: 'Employment Check',
      description: 'Screens a verification process that confirms a candidates work history, job titles, durations, and performance or reasons for leaving.'
    },
    {
      id: 4,
      imageSrc: '/Service/Educational.png',
      title: 'Education Check',
      description: 'Screens a verification process that confirms the educational qualifications of an individual, such as degrees, certifications, and institutions attended.'
    },
    {
      id: 5,
      imageSrc: '/Service/SocialMedia.png',
      title: 'Social Media Check/Adverse Media Check',
      description: 'Screens an individual\’s online presence for inappropriate, unethical, negative news or media coverage related to criminal activity, or reputational risks.'
    },
    {
      id: 6,
      imageSrc: '/Service/Sanction.png',
      title: 'Sanctions and Enforcement Check',
      description: 'Screens an individuals or entities against global watchlists, regulatory sanctions, and enforcement actions to identify legal or compliance risks.'
    },
    // การ์ดเพิ่มเติมที่จะแสดงเมื่อกด "Show More"
    {
      id: 7,
      imageSrc: '/Service/Residental.png',
      title: 'Residential Check',
      description: 'Screens an individual\'s past addresses, rental history, and sometimes criminal or credit history to assess their reliability as a tenant or resident.'
    },
    {
      id: 8,
      imageSrc: '/Service/License.png',
      title: 'License Check (e.g. Investment, Insurance)',
      description: 'Screens an individual or business holds a valid, active license for regulated activities such as investment, insurance, real estate, or other professional services.'
    },
    {
        id: 9,
        imageSrc: '/Service/Certificate.png',
        title: 'Certificate Check (e.g.ISTQB)',
        description: 'Screens the authenticity and validity of professional certifications (e.g., ISTQB) to confirm an individual\'s qualifications and compliance with industry standards.'
      },
      {
        id: 10,
        imageSrc: '/Service/Driving.png',
        title: 'Driving Experience Check',
        description: 'Screens an individual\'s driving history, including license validity, years of experience, traffic violations, and accident records.'
      },
      {
        id: 11,
        imageSrc: '/Service/Bankrupt.png',
        title: 'Bankruptcy History Check',
        description: 'Screens an individual or entity has filed for bankruptcy, including details on past insolvencies, financial distress, and legal proceedings.'
      },
      {
        id: 12,
        imageSrc: '/Service/Identity.png',
        title: 'Identity Check',
        description: 'Screens an individual\'s personal information, such as name, date of birth, and government-issued ID, to confirm their identity and prevent fraud.'
      },
      {
        id: 13,
        imageSrc: '/Service/Drug.png',
        title: 'Drugs Screening',
        description: 'Screens an individual for the presence of illegal or controlled substances to ensure compliance with workplace, legal, or safety regulations.'
      },
      {
        id: 14,
        imageSrc: '/Service/Civil.png',
        title: 'Civil Court Check',
        description: 'Screens an individual’s history of involvement in civil lawsuits, such as disputes over contracts, property, or personal injury, to assess potential legal risks or liabilities.'
      },
      {
        id: 15,
        imageSrc: '/Service/CriminalCourt.png',
        title: 'Criminal Court Check',
        description: 'Screens an individual’s history of criminal convictions or charges, including details of any past offenses, to assess potential risks for employment, housing, or legal purposes.'
      },
      {
        id: 16,
        imageSrc: '/Service/Referal.png',
        title: 'Referral Checker',
        description: 'Screens references provided by an individual, such as previous employers or professional contacts, to confirm their credibility, work history, and qualifications.'
      }
    // เพิ่มการ์ดอื่นๆ ตามต้องการ
  ];

  // จำนวนการ์ดที่จะแสดงเพิ่มเมื่อกดปุ่ม
  const loadMore = () => {
    setVisibleCards(prev => {
      // ถ้าแสดงครบทุกการ์ดแล้ว กลับไปแสดง 6 การ์ดแรก
      if (prev >= allCards.length) {
        return 6;
      }
      // ถ้ายังไม่ครบ แสดงทั้งหมดเลย
      return allCards.length;
    });
  };

  // คำนวณข้อความบนปุ่ม
  const buttonText = visibleCards >= allCards.length ? 'Show Less' : 'Show More';

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-5xl text-center mb-4 text-black">บริการของเรา</h2>
        <p className="text-center text-gray-600 mb-12 text-[20px]">
        เรามีบริการการตรวจสอบหลายประเภทท่านสามารถเลือกได้ตามความต้องการของตน
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allCards.slice(0, visibleCards).map((card) => (
            <ServiceCard 
              key={card.id}
              imageSrc={card.imageSrc}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>
        
        {allCards.length > 6 && (
          <div className="flex justify-center mt-12">
            <button 
              onClick={loadMore}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-800  py-3 px-12 rounded-full transition duration-300 text-[20px]"
            >
              {buttonText}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}