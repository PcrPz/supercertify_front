// data/mockData.js

// ข้อมูลบริการทั่วไป
export const generalServices = [
    {
      id: "criminal",
      category: "general",
      title: "ตรวจสอบประวัติอาชญากรรม",
      description: "ตรวจสอบว่าบุคคลมีประวัติอาชญากรรมหรือไม่ เช่น คดีอาญา คดีแพ่ง หรือความผิดทางกฎหมายอื่นๆ",
      price: 700,
      image: "/Service/Criminal.png"
    },
    {
      id: "education",
      category: "general",
      title: "ตรวจสอบประวัติการศึกษา",
      description: "ตรวจสอบวุฒิการศึกษา สถาบัน และปีที่สำเร็จการศึกษา เพื่อยืนยันความถูกต้องตรงกับข้อมูลที่อ้างอิง",
      price: 700,
      image: "/Service/Educational.png"
    },
    {
      id: "employment",
      category: "general",
      title: "ตรวจสอบประวัติการทำงาน",
      description: "ตรวจสอบข้อมูลการทำงานจากบริษัทเดิม เช่น ตำแหน่งงาน ระยะเวลาการทำงาน และลักษณะงานที่รับผิดชอบ",
      price: 1500,
      image: '/Service/Certificate.png'
    },
    {
      id: "credit",
      category: "general",
      title: "ตรวจสอบเครดิตการเงิน (เครดิตบูโร)",
      description: "ตรวจสอบสถานะทางการเงิน เช่น ภาระหนี้ การผิดนัดชำระหนี้ หรือประวัติเครดิตเสีย",
      price: 1500,
      image: "/Service/Financial.png"
    }
  ];
  
  // ข้อมูลบริการเฉพาะทาง
  export const specializedServices = [
    {
      id: "property",
      category: "specific",
      title: "ตรวจสอบประวัติการฉ้อโกง",
      description: "ตรวจสอบการมีส่วนเกี่ยวข้องกับคดีหลอกลวง ฉ้อโกง หรือพฤติกรรมทุจริตต่าง ๆ",
      price: 700,
      image: '/Service/CriminalCourt.png'
    },
    {
        id: "property",
        category: "specific",
        title: "ตรวจสอบการปลอมแปลงเอกสารรายได้",
        description: "ตรวจสอบความถูกต้องของสลิปเงินเดือน หนังสือรับรองรายได้ หรือหนังสือรับรองการทำงานจากบริษัทเดิม",
        price: 700,
        image: '/Service/Residental.png'
      },
    {
      id: "behavior",
      category: "specific",
      title: "ตรวจสอบประวัติการประพฤติในการทำงาน",
      description: "ตรวจสอบนิสัยการทำงาน เช่น ความรับผิดชอบ การทำงานเป็นทีม และปัญหาด้านวินัยที่เคยเกิดขึ้น",
      price: 700,
      image: '/Service/CriminalCourt.png'
    },
    {
      id: "driver",
      category: "specific",
      title: "ตรวจสอบประวัติการขับขี่",
      description: "ตรวจสอบใบขับขี่ ประวัติอุบัติเหตุ หรือคดีความที่เกี่ยวข้องกับการขับขี่ เช่น การเมาแล้วขับ",
      price: 700,
      image: "/Service/Driving.png"
    },
    {
      id: "social_media",
      category: "specific",
      title: "ตรวจสอบประวัติอันเสียหายออนไลน์",
      description: "ค้นหาข้อมูลชื่อบุคคลจากแหล่งข่าวหรือโซเชียลมีเดียว่ามีเรื่องร้องเรียน ข้อกล่าวหา หรือข่าวเชิงลบหรือไม่",
      price: 700,
      image: "/Service/SocialMedia.png"
    }
  ];
  
  // ข้อมูลแพ็คเกจบริการ
  export const packageServices = [
    {
      id: "beginner",
      category: "packages",
      title: "ผู้เริ่มต้น",
      description: "แพ็คเกจพื้นฐานสำหรับการตรวจสอบเบื้องต้น",
      price: 3500,
      image: "/images/packages/beginner_package.png",
      services: [
        {
          id: "criminal",
          title: "ตรวจสอบประวัติอาชญากรรม"
        },
        {
          id: "education",
          title: "ตรวจสอบประวัติการศึกษา"
        },
        {
          id: "credit",
          title: "ตรวจสอบเครดิตการเงิน (เครดิตบูโร)"
        }
      ]
    },
    {
      id: "standard",
      category: "packages",
      title: "มาตรฐาน",
      description: "แพ็คเกจที่ครอบคลุมการตรวจสอบทั่วไปสำหรับองค์กร",
      price: 6000,
      image: "/images/packages/standard_package.png",
      services: [
        {
          id: "criminal",
          title: "ตรวจสอบประวัติอาชญากรรม"
        },
        {
          id: "education",
          title: "ตรวจสอบประวัติการศึกษา"
        },
        {
          id: "employment",
          title: "ตรวจสอบประวัติการทำงาน"
        },
        {
          id: "credit",
          title: "ตรวจสอบเครดิตการเงิน (เครดิตบูโร)"
        },
        {
          id: "driver",
          title: "ตรวจสอบประวัติการขับขี่"
        }
      ]
    },
    {
      id: "premium",
      category: "packages",
      title: "พรีเมียม",
      description: "แพ็คเกจการตรวจสอบแบบครบวงจรสำหรับตำแหน่งสำคัญ",
      price: 8500,
      image: "/images/packages/premium_package.png",
      services: [
        {
          id: "criminal",
          title: "ตรวจสอบประวัติอาชญากรรม"
        },
        {
          id: "education",
          title: "ตรวจสอบประวัติการศึกษา"
        },
        {
          id: "employment",
          title: "ตรวจสอบประวัติการทำงาน"
        },
        {
          id: "credit",
          title: "ตรวจสอบเครดิตการเงิน (เครดิตบูโร)"
        },
        {
          id: "driver",
          title: "ตรวจสอบประวัติการขับขี่"
        },
        {
          id: "social_media",
          title: "ตรวจสอบประวัติอันเสียหายออนไลน์"
        },
        {
          id: "property",
          title: "ตรวจสอบการปลอมแปลงเอกสารราชการ"
        },
        {
          id: "behavior",
          title: "ตรวจสอบประวัติการประพฤติในการทำงาน"
        }
      ]
    }
  ];
  
  
  // รวมบริการทั้งหมด
  export const allServices = [
    ...generalServices,
    ...specializedServices,
    ...packageServices
  ];
  
  // ฟังก์ชันช่วยเหลือ
  export const getServiceById = (id) => {
    return allServices.find(service => service.id === id);
  };
  
  export const getPackageById = (id) => {
    return packageServices.find(pkg => pkg.id === id);
  };
  
  // สำหรับจำลองการเรียก API
  export const fetchServices = () => {
    // รับประกันว่าส่งค่าที่แน่นอนทุกครั้ง
    const combinedServices = [...generalServices, ...specializedServices];
    console.log("Sending services:", combinedServices.length); // ดูว่าส่งข้อมูลกี่รายการ
    
    return Promise.resolve(combinedServices);
  };
  
  export const fetchPackages = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(packageServices);
      }, 500);
    });
  };
  
  export const fetchAllServices = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(allServices);
      }, 500);
    });
  };
  
  // ฟังก์ชันจำลองการส่งคำสั่งซื้อ
  export const submitOrder = (orderData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          orderId: 'ORD' + Math.floor(Math.random() * 1000000),
          message: 'คำสั่งซื้อสำเร็จ',
          orderData
        });
      }, 1500);
    });
  };