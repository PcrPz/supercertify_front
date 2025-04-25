"use client"
import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, Search, CreditCard, UserCheck, FileText, Mail, MessageCircle, Instagram, Clock } from 'lucide-react';

export default function FAQsPage() {
    const [activeSection, setActiveSection] = useState(null);

    const FAQSections = [
        {
            title: "เริ่มต้นอย่างชาญฉลาด",
            icon: <Search className="w-6 h-6 text-blue-500" />,
            faqs: [
                {
                    question: "1. Background Check คืออะไร?",
                    answer: "บริการตรวจสอบประวัติบุคคลอย่างครอบคลุม เพื่อยืนยันความน่าเชื่อถือ และช่วยลดความเสี่ยงในการตัดสินใจ ไม่ว่าจะเป็นการสมัครงาน การร่วมลงทุน หรือการสร้างความสัมพันธ์ทางธุรกิจ"
                },
                {
                    question: "2. ทำไมต้องใช้บริการนี้?",
                    answer: "เพื่อความปลอดภัยและความมั่นใจ โดยให้ข้อมูลที่ถูกต้อง ครอบคลุม และน่าเชื่อถือ ช่วยป้องกันความเสี่ยงที่อาจเกิดขึ้นจากการไม่รู้ประวัติอย่างแท้จริง"
                }
            ]
        },
        {
            title: "ประเภทการตรวจสอบ",
            icon: <FileText className="w-6 h-6 text-green-500" />,
            faqs: [
                {
                    question: "3. เราตรวจสอบอะไรบ้าง?",
                    answer: "เรามีบริการตรวจสอบประวัติทั้งหมด 9 ประเภท:\n• ประวัติอาชญากรรม\n• ประวัติการศึกษา\n• ประวัติการทำงาน\n• เครดิตทางการเงิน\n• ประวัติการฉ้อโกง\n• ประวัติข่าวเสียหายจากโลกออนไลน์\n• การตรวจสอบการปลอมแปลงเอกสารรายได้\n• ประวัติการประพฤติของพนักงาน\n• ประวัติการขับขี่\n"
                },
                {
                    question: "4. กระบวนการตรวจสอบปลอดภัยแค่ไหน?",
                    answer: "เรามุ่งเน้นความปลอดภัยและความเป็นส่วนตัวของลูกค้าเป็นหลัก โดยดำเนินการตรวจสอบด้วยความระมัดระวังและเคารพสิทธิส่วนบุคคล"
                }
            ]
        },
        {
            title: "แพ็กเกจและราคา",
            icon: <CreditCard className="w-6 h-6 text-purple-500" />,
            faqs: [
                {
                    question: "5. แพ็กเกจมีอะไรบ้าง?",
                    answer: "เรามีแพ็กเกจให้เลือก 3 แบบ:\n\n• Standard: 2,800 บาท\n  - ตรวจสอบ 4 รายการ\n  - เหมาะสำหรับการตรวจสอบเบื้องต้น\n\n• Gold: 4,200 บาท\n  - ตรวจสอบ 6 รายการ\n  - ครอบคลุมมากขึ้น\n\n• Premium: 6,300 บาท\n  - ตรวจสอบครบทั้ง 9 รายการ\n  - แพ็กเกจที่ให้ข้อมูลมากที่สุด\n\nเพิ่มเติม: มีโปรแกรมสะสมเครดิตรายปี และบริการ Customization ตามความต้องการ"
                },
                {
                    question: "6. วิธีเริ่มต้นใช้งาน?",
                    answer: "ขั้นตอนการใช้บริการง่ายๆ:\n1. Log in / สมัครสมาชิกผ่านเว็บไซต์\n2. เลือกโหมดบัญชีการใช้งาน\n3. เลือกบริการที่สนใจ\n4. กรอกข้อมูลและอัปโหลดเอกสารที่จำเป็น\n5. ชำระเงิน\n6. รอรับผลการตรวจสอบภายใน 7-14 วันทำการ\n(ไม่รวมวันหยุดราชการและวันหยุดสุดสัปดาห์)"
                }
            ]
        }
    ];

    const FAQItem = ({ question, answer, isOpen, onClick }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div 
                onClick={onClick} 
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
                <h3 className="font-semibold text-gray-800">{question}</h3>
                <ChevronDown 
                    className={`w-5 h-5 text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                />
            </div>
            {isOpen && (
                <div className="p-4 pt-0 text-gray-600 whitespace-pre-line">
                    {answer}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="container mx-auto max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Background Check</h1>
                    <p className="text-xl text-gray-600">ระบบตรวจสอบประวัติอย่างครอบคลุม</p>
                </div>

                <div className="space-y-8">
                    {FAQSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="bg-white rounded-2xl shadow-lg">
                            <div className="flex items-center p-6 border-b border-gray-100">
                                {section.icon}
                                <h2 className="ml-4 text-xl font-bold text-gray-800">{section.title}</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                {section.faqs.map((faq, faqIndex) => (
                                    <FAQItem 
                                        key={faqIndex}
                                        question={faq.question}
                                        answer={faq.answer}
                                        isOpen={activeSection === `${sectionIndex}-${faqIndex}`}
                                        onClick={() => 
                                            setActiveSection(
                                                activeSection === `${sectionIndex}-${faqIndex}` 
                                                ? null 
                                                : `${sectionIndex}-${faqIndex}`
                                            )
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 bg-blue-100 rounded-2xl p-8">
                    <div className="text-center mb-6">
                        <div className="flex justify-center items-center mb-4">
                            <UserCheck className="w-8 h-8 text-blue-500 mr-3" />
                            <h3 className="text-2xl font-bold text-gray-800">ติดต่อเรา</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <Mail className="w-6 h-6 text-blue-600" />
                                <span className="text-gray-700">Email: vannessplusbgc@gmail.com</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <MessageCircle className="w-6 h-6 text-green-600" />
                                <span className="text-gray-700">Line: @854twluw</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Instagram className="w-6 h-6 text-pink-600" />
                                <span className="text-gray-700">Instagram: @bgc_vannessplus</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Clock className="w-6 h-6 text-purple-600" />
                                <span className="text-gray-700">เวลาทำการ: จันทร์-ศุกร์ 9:00-18:00 น.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}