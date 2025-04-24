export default function FAQsPage() {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-12">คำถามที่พบบ่อย</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">ทั่วไป</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-700">1. รู้แบบใดบ้างที่ฟรี?</p>
              <p className="text-gray-600">บริการตรวจสอบประวัติเบื้องต้นฟรีบางส่วน</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">2. บริการของคุณถูกกฎหมายหรือไม่?</p>
              <p className="text-gray-600">ถูกต้องตามกฎหมาย ระเบียบ และข้อบังคับที่เกี่ยวข้อง</p>
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">การสั่งซื้อและกระบวนการ</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-700">3. ขั้นตอนการตรวจสอบประวัติใดบ้าง?</p>
              <ul className="list-disc list-inside text-gray-600">
                <li>ตรวจสอบเอกสารหลัก</li>
                <li>ยืนยันตัวตน</li>
                <li>ตรวจสอบประวัติเบื้องต้น</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700">4. มีผลกระทบวงเงินประวัติอย่างไร?</p>
              <p className="text-gray-600">ตรวจสอบโดยไม่กระทบวงเงินเครดิต</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">5. บริการและโทษใดบ้าง?</p>
              <p className="text-gray-600">ให้บริการตรวจสอบตามกฎหมาย มีบทลงโทษชัดเจนหากมีการใช้งานผิดประเภท</p>
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">ราคาและการชำระเงิน</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-700">6. มีค่าใช้จ่ายเท่าไร?</p>
              <p className="text-gray-600">ราคาเริ่มต้นที่หลักร้อย ขึ้นอยู่กับประเภทการตรวจสอบ</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">7. รองรับการชำระเงินแบบใด?</p>
              <p className="text-gray-600">บัตรเครดิต / พร้อมเพย์ / บัญชีธนาคาร</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">8. คืนเงินหรือยกเลิกได้ไหม?</p>
              <p className="text-gray-600">สามารถขอคืนเงินภายใน 7 วัน หากยังไม่เริ่มกระบวนการตรวจสอบ</p>
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">ความเป็นส่วนตัวและความปลอดภัย</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-700">9. ข้อมูลของฉันปลอดภัยหรือไม่?</p>
              <p className="text-gray-600">เรามีระบบรักษาความปลอดภัยระดับสูง เข้ารหัสข้อมูลทุกขั้นตอน</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">10. มั่นใจได้อย่างไรว่าข้อมูลจะไม่รั่วไหล?</p>
              <p className="text-gray-600">ใช้มาตรฐานการรักษาความปลอดภัยสากล และมีการตรวจสอบอย่างสม่ำเสมอ</p>
            </div>
          </div>
        </section>
        
        <section className="bg-gray-100 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">ศูนย์สนับสนุน</h3>
          <div className="space-y-2">
            <p className="font-medium text-gray-700">11. ติดต่อสนับสนุนได้อย่างไร?</p>
            <p className="text-gray-600">อีเมล: support@supercertify.com</p>
            <p className="text-gray-600">หมายเลขโทรศัพท์: 02-000-0000</p>
            <p className="text-gray-600">เวลาทำการสนับสนุน: วันจันทร์-วันศุกร์ 9 โมงเช้า-6 โมงเย็น (ตามประกาศ)</p>
          </div>
        </section>
      </div>
    );
  }