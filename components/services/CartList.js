'use client';

import { useCheck } from '@/context/CheckContext';
import CartItem from './CartItem';

export default function CartList() {
  const { 
    cart, 
    getSubtotalPrice, 
    getDiscountRate, 
    getDiscountAmount, 
    getTotalPrice,
    getTotalServiceCount,
    coupon,
    couponDiscount
  } = useCheck();

  // คำนวณส่วนลดเป็นเปอร์เซ็นต์
  const discountRate = getDiscountRate();
  const discountPercent = discountRate * 100;
  const hasPromotionDiscount = discountRate > 0;
  
  // คำนวณส่วนลดจากโปรโมชั่น
  const promotionDiscountAmount = getDiscountAmount();
  
  // ตรวจสอบว่ามีคูปองหรือไม่
  const hasCouponDiscount = couponDiscount > 0;
  
  // คำนวณส่วนลดรวม (โปรโมชั่น + คูปอง)
  const totalDiscountAmount = promotionDiscountAmount + (couponDiscount || 0);
  
  // ตรวจสอบว่ามีส่วนลดรวมหรือไม่
  const hasTotalDiscount = totalDiscountAmount > 0;
  
  // ราคาก่อนหักส่วนลด
  const subtotalPrice = getSubtotalPrice();
  
  // ราคาสุทธิ
  const totalPrice = getTotalPrice();
  
  // จำนวนบริการทั้งหมด
  const serviceCount = getTotalServiceCount();

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 overflow-hidden mb-12 shadow-lg">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-medium text-lg">การตรวจสอบปัจจุบันของคุณ</h3>
      </div>
      
      {cart.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">คุณยังไม่ได้เลือกบริการตรวจสอบใดๆ</p>
          <p className="text-sm text-gray-400">กรุณาเลือกบริการหรือแพ็คเกจที่คุณต้องการตรวจสอบ</p>
        </div>
      ) : (
        <div>
          {/* ส่วนแสดงจำนวนบริการทั้งหมด */}
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex justify-between items-center">
              <div className="text-sm text-blue-700 font-medium">จำนวนบริการทั้งหมด:</div>
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                {serviceCount} บริการ
              </div>
            </div>
          </div>
          
          {/* รายการสินค้าในตะกร้า */}
          {cart.map((item, index) => (
            <CartItem key={index} item={item} />
          ))}
          
          {/* สรุปราคาและส่วนลด */}
          <div className="border-t border-gray-200">
            {/* ราคารวมก่อนหักส่วนลด */}
            <div className="px-6 py-4 flex justify-between items-center">
              <div className="text-gray-600">ราคารวม:</div>
              <div className="font-medium">{subtotalPrice.toLocaleString()} บาท</div>
            </div>
            
            {/* แสดงส่วนลดจากโปรโมชั่นถ้ามี */}
            {hasPromotionDiscount && (
              <div className="px-6 py-3 bg-green-50 flex justify-between items-center">
                <div className="text-green-700 font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  ส่วนลดโปรโมชั่น ({discountPercent}%):
                </div>
                <div className="font-medium text-green-700">-{promotionDiscountAmount.toLocaleString()} บาท</div>
              </div>
            )}
            
            {/* แสดงส่วนลดจากคูปองถ้ามี */}
            {hasCouponDiscount && (
              <div className="px-6 py-3 bg-indigo-50 flex justify-between items-center">
                <div className="text-indigo-700 font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  ส่วนลดคูปอง {coupon && `(${coupon.code})`}:
                </div>
                <div className="font-medium text-indigo-700">-{couponDiscount.toLocaleString()} บาท</div>
              </div>
            )}
            
            {/* ราคาสุทธิ */}
            <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
              <div className="font-medium text-lg">ราคาสุทธิ:</div>
              {hasTotalDiscount ? (
                <div className="flex flex-col items-end">
                  <div className="text-sm text-gray-500 line-through">{subtotalPrice.toLocaleString()} บาท</div>
                  <div className="font-bold text-xl text-green-600">{totalPrice.toLocaleString()} บาท</div>
                  <div className="text-xs text-green-600">
                    ประหยัด {totalDiscountAmount.toLocaleString()} บาท 
                    ({Math.round((totalDiscountAmount / subtotalPrice) * 100)}%)
                  </div>
                </div>
              ) : (
                <div className="font-bold text-xl">{totalPrice.toLocaleString()} บาท</div>
              )}
            </div>
          </div>
          
          {/* คำแนะนำส่วนลด */}
          {!hasPromotionDiscount && serviceCount > 0 && serviceCount < 3 && (
            <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-100">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-yellow-700">
                  <span className="font-medium">รับส่วนลดเพิ่ม!</span> เพิ่มบริการอีก {3 - serviceCount} รายการ เพื่อรับส่วนลด 5% หรือเพิ่ม {5 - serviceCount} รายการ เพื่อรับส่วนลด 10%
                </div>
              </div>
            </div>
          )}
          {!hasPromotionDiscount && serviceCount >= 3 && serviceCount < 5 && (
            <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-100">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-yellow-700">
                  <span className="font-medium">รับส่วนลดเพิ่ม!</span> เพิ่มบริการอีก {5 - serviceCount} รายการ เพื่อรับส่วนลด 10%
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}