import Link from 'next/link';
import { FaFacebookF, FaTwitter, FaTiktok, FaLinkedinIn } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-indigo-600 text-white py-12">
      <div className="container mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Company Info */}
        <div>
          <h2 className="text-2xl font-bold mb-4">SUPERCERTIFY</h2>
          <p className="mb-4">
            ตรวจสอบประวัติกับเราได้ง่ายๆ ผ่านเว็บไซต์ ลดขั้นตอน ไม่ยุ่งยาก ได้ผลลัพธ์ที่แม่นยำ
          </p>
        </div>

        {/* Office Info */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Office</h2>
          <p className="mb-2">
            287 ถนนสีลม, สีลม, บางรัก<br />
            กรุงเทพ 10500
          </p>
          <a 
            href="mailto:cs@supercertify.com" 
            className="text-white hover:underline block mb-2"
          >
            supercertify@gmail.com
          </a>
          <p>02-0777581  (ติดต่อสำนักงานใหญ่)</p>
        </div>

        {/* Pages */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Pages</h2>
          <ul className="space-y-2">
            <li><Link href="/" className="hover:underline">หน้าหลัก</Link></li>
            <li><Link href="/background-check" className="hover:underline">การตรวจสอบประวัติ</Link></li>
            <li><Link href="/tracking-process" className="hover:underline">การติดตามกระบวนการ</Link></li>
            <li><Link href="/faqs" className="hover:underline">คำถามที่พบบ่อย</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Newsletter</h2>
          <div className="flex">
            <input
              type="email"
              placeholder="ใส่อีเมล์ของคุณเพื่อรับข่าวสารล่าสุด..."
              className="bg-transparent border-b border-white py-2 pr-2 w-full text-white placeholder-white/70 focus:outline-none"
            />
            <button className="text-white pl-2">
              ➔
            </button>
          </div>

          {/* Social Media Icons */}
          <div className="flex gap-4 mt-6">
            <a 
              href="#" 
              className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center hover:bg-opacity-90"
            >
              <FaFacebookF />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center hover:bg-opacity-90"
            >
              <FaTwitter />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center hover:bg-opacity-90"
            >
              <FaTiktok />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center hover:bg-opacity-90"
            >
              <FaLinkedinIn />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
