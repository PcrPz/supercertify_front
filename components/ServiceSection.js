'use client';  // เนื่องจากใช้ useState ต้องทำเป็น Client Component

import { useState } from 'react';
import ServiceCard from './ServiceCard';

export default function ServiceSection() {
  const [visibleCards, setVisibleCards] = useState(6);
  
  // ข้อมูลการ์ดทั้งหมด (สมมติว่ามี 12 การ์ด)
  const allCards = [
    {
      id: 1, //ประวัติอาชญากรรม
      imageSrc: '/Service/Criminal.png',
      title: 'ประวัติอาชญากรรม',
      description: 'ตรวจสอบว่าบุคคลเคยมีประวัติอาชญากรรมหรือไม่ เช่น คดียาเสพติด ลักทรัพย์ หรือความผิดทางกฎหมายอื่น'
    },
    {
      id: 2, //เครดิตทางการเงิน
      imageSrc: '/Service/Financial.png',
      title: 'เครดิตทางการเงิน (เครดิตบูโร)',
      description: 'ตรวจสอบสถานะทางการเงิน เช่น ภาระหนี้ การผิดนัดชำระหนี้ หรือประวัติเครดิตเสีย'
    },
    {
      id: 3, //ประวัติการทำางาน
      imageSrc: '/Service/Employment.png',
      title: 'ประวัติการทำงาน',
      description: 'ตรวจสอบข้อมูลการทำงานจากบริษัทเดิม เช่น ตำแหน่งงาน ระยะเวลาการทำงาน และลักษณะงานที่รับผิดชอบ'
    },
    { 
      id: 4, //ประวัติการศึกษา
      imageSrc: '/Service/Educational.png',
      title: 'ประวัติการศึกษา',
      description: 'ตรวจสอบวุฒิการศึกษา สถาบัน และปีที่สำเร็จการศึกษา เพื่อยืนยันความถูกต้องตรงกับข้อมูลที่อ้างอิง'
    },
    {
      id: 5, //ประวัติข่าวเสียหายจากโลกออนไลน์
      imageSrc: '/Service/SocialMedia.png',
      title: 'ประวัติข่าวเสียหายจากโลกออนไลน์',
      description: 'ค้นหาข้อมูลชื่อบุคคลจากแหล่งข่าวหรือโซเชียลมีเดียว่ามีเรื่องร้องเรียน ข้อกล่าวหา หรือข่าวเชิงลบหรือไม่'
    },
    {
        id: 6,// ประวัติการฉ ้ อโกง:
        imageSrc: '/Service/CriminalCourt.png',
        title: 'ประวัติการฉ้อโกง',
        description: 'ตรวจสอบการมีส่วนเกี่ยวข้องกับคดีหลอกลวง ฉ้อโกง หรือพฤติกรรมทุจริตต่าง ๆ'
      },
    // การ์ดเพิ่มเติมที่จะแสดงเมื่อกด "Show More"
    { 
      id: 7, // ตรวจสอบการปลอมเเปลงเอกสารรายได ้ จากที่ทำางานเก่า
      imageSrc: '/Service/Residental.png',
      title: 'ตรวจสอบการปลอมแปลงเอกสารรายได้',
      description: 'ตรวจสอบความถูกต้องของสลิปเงินเดือน หนังสือรับรองรายได้ หรือหนังสือรับรองการทำงานจากบริษัทเดิม'
    },
    {
        id: 8, // ประวัติการประพฤของพนักงาน ฌ ที่ทำางานเก่า
        imageSrc: '/Service/Certificate.png',
        title: 'ประวัติการประพฤติในการทำงาน',
        description: 'ตรวจสอบนิสัยการทำงาน เช่น ความรับผิดชอบ การทำงานเป็นทีม และปัญหาด้านวินัยที่เคยเกิดขึ้น'
      },
      {
        id: 9, //ประวัติการขับขี่
        imageSrc: '/Service/Driving.png',
        title: 'ประวัติการขับขี่',
        description: 'ตรวจสอบใบขับขี่ ประวัติอุบัติเหตุ หรือคดีความที่เกี่ยวข้องกับการขับขี่ เช่น การเมาแล้วขับ'
      },
     

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
  const buttonText = visibleCards >= allCards.length ? 'แสดงน้อยลง' : 'แสดงเพิ่มเติม';

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-5xl font-bold text-center mb-4 text-black">บริการของเรา</h2>
        <p className="text-center text-gray-600 mb-12 font-bold text-[20px]">
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
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-medium py-3 px-12 rounded-full transition duration-300 text-[20px]"
            >
              {buttonText}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}