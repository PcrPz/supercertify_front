'use client';

import { useCheck } from '@/context/CheckContext';
import CartItem from './CartItem';

export default function CartList() {
  const { cart, getTotalPrice } = useCheck();

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 overflow-hidden mb-12">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-medium">การตรวจสอบปัจจุบันของคุณ</h3>
      </div>
      
      {cart.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          คุณยังไม่ได้เลือกบริการตรวจสอบใดๆ
        </div>
      ) : (
        <div>
          {cart.map((item, index) => (
            <CartItem key={index} item={item} />
          ))}
          
          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
            <div className="font-medium">ราคารวมทั้งหมด:</div>
            <div className="font-bold text-lg">{getTotalPrice().toLocaleString()} บาท</div>
          </div>
        </div>
      )}
    </div>
  );
}