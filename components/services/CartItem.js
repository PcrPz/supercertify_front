import { useCheck } from '@/context/CheckContext';
import useToast from '@/hooks/useToast';
import { useCallback } from 'react'; // เพิ่มบรรทัดนี้

export default function CartItem({ item }) {
  const { updateQuantity, removeService } = useCheck();
  const toast = useToast();
  
  // ใช้ useCallback
  const handleUpdateQuantity = useCallback((id, newQuantity) => {
    const oldQuantity = item.quantity;
    updateQuantity(id, newQuantity);
    
    // แสดง toast เฉพาะเมื่อมีการเปลี่ยนแปลงจำนวนจริงๆ
    if (newQuantity !== oldQuantity) {
      if (newQuantity > oldQuantity) {
        toast.info(`เพิ่มจำนวน "${item.title}" เป็น ${newQuantity} คน`, {
          autoClose: 2000,
        });
      } else if (newQuantity < oldQuantity) {
        toast.info(`ลดจำนวน "${item.title}" เหลือ ${newQuantity} คน`, {
          autoClose: 2000,
        });
      }
    }
  }, [item.title, item.quantity, updateQuantity, toast]);
  
  // ใช้ useCallback
  const handleRemoveService = useCallback((id) => {
    removeService(id);
    toast.warning(`ลบ "${item.title}" ออกจากตะกร้าแล้ว`, {
      autoClose: 2000,
    });
  }, [item.title, removeService, toast]);
  
  return (
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div className="flex-1">
        <h4 className="font-medium text-gray-800">{item.title}</h4>
        <div className="text-gray-600 text-sm">{item.price.toLocaleString()} บาท</div>
      </div>
      
      <div className="flex items-center">
        <span className="mr-2 text-gray-700">จำนวนคน:</span>
        <button 
          onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          -
        </button>
        <span className="mx-3 text-gray-800">{item.quantity}</span>
        <button 
          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          +
        </button>
        
        <button 
          onClick={() => handleRemoveService(item.id)}
          className="ml-6 text-red-600 hover:text-red-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}