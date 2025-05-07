'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllOrders, getOrderById, updatePaymentStatus } from '@/services/apiService';
import { sendPaymentApprovedToUser } from '@/services/emailService';

export default function PaymentManagement() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' หรือ 'detail'
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pending_verification');
  
  // โหลดรายการคำสั่งซื้อ
  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const ordersData = await getAllOrders();
        console.log('Fetched orders:', ordersData);
        setOrders(ordersData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
        setLoading(false);
      }
    }
    
    fetchOrders();
  }, []);
  
  // ดูรายละเอียดคำสั่งซื้อ
  const viewOrderDetail = async (orderId) => {
    try {
      setLoading(true);
      const orderData = await getOrderById(orderId);
      console.log('Order detail:', orderData);
      setSelectedOrder(orderData);
      setViewMode('detail');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching order detail:', err);
      setError('ไม่สามารถดึงข้อมูลรายละเอียดคำสั่งซื้อได้');
      setLoading(false);
    }
  };
  
  // กลับไปที่รายการคำสั่งซื้อ
  const backToList = () => {
    setSelectedOrder(null);
    setViewMode('list');
  };
  
  // อัปเดตสถานะการชำระเงิน
  const handleUpdatePaymentStatus = async (orderId, newStatus) => {
    try {
      setProcessing(true);
      
      if (!selectedOrder || !selectedOrder.payment) {
        throw new Error('ไม่พบข้อมูลการชำระเงิน');
      }
      
      // ใช้ payment ID แทน order ID
      const paymentId = selectedOrder.payment._id;
      console.log('Updating payment status for paymentId:', paymentId);
      
      // ปรับเป็นรูปแบบที่ backend ต้องการ
      const result = await updatePaymentStatus(paymentId, {
        paymentStatus: newStatus
      });
      
      if (result.success) {
        // อัปเดตข้อมูลใน state
        const updatedOrders = orders.map(order => {
          if (order._id === orderId) {
            if (order.payment) {
              order.payment.paymentStatus = newStatus;
            }
            
            // อัปเดตสถานะ Order ตามสถานะการชำระเงิน
            if (newStatus === 'completed') {
              order.OrderStatus = 'payment_verified';
            } else if (newStatus === 'failed' || newStatus === 'refunded') {
              order.OrderStatus = 'awaiting_payment';
            } else if (newStatus === 'pending_verification') {
              order.OrderStatus = 'pending_verification';
            }
          }
          return order;
        });
        
        setOrders(updatedOrders);
        
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            payment: {
              ...selectedOrder.payment,
              paymentStatus: newStatus
            },
            OrderStatus: newStatus === 'completed' ? 'payment_verified' : 
                         (newStatus === 'failed' || newStatus === 'refunded') ? 'awaiting_payment' : 
                         'pending_verification'
          });
        }
        
        // ถ้าสถานะเป็น 'completed' ให้ส่งอีเมลแจ้งเตือนลูกค้า
        if (newStatus === 'completed') {
          try {
            // ดึงข้อมูล order ล่าสุด
            const updatedOrder = await getOrderById(orderId);
            
            // ส่งอีเมลแจ้งเตือนลูกค้า
            await sendPaymentApprovedToUser(updatedOrder);
          } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
            // ไม่ต้องยกเลิกกระบวนการทั้งหมดหากส่งอีเมลไม่สำเร็จ
          }
        }
        
        alert('อัปเดตสถานะการชำระเงินสำเร็จ');
      } else {
        throw new Error(result.message || 'การอัปเดตสถานะล้มเหลว');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };
  
  // แปลสถานะการชำระเงินเป็นภาษาไทย
  const getStatusText = (status) => {
    switch(status) {
      case 'completed':
        return 'ชำระเงินสำเร็จ';
      case 'pending_verification':
        return 'รอการตรวจสอบ';
      case 'awaiting_payment':
        return 'รอการชำระเงิน';
      case 'failed':
        return 'การชำระเงินล้มเหลว';
      case 'refunded':
        return 'คืนเงินแล้ว';
      default:
        return 'ไม่ทราบสถานะ';
    }
  };
  
  // กำหนดสีตามสถานะการชำระเงิน
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800';
      case 'awaiting_payment':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // กรองรายการตามสถานะ
  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => {
        // ตรวจสอบว่ามี payment และมี paymentStatus
        if (order.payment && order.payment.paymentStatus) {
          return order.payment.paymentStatus === filterStatus;
        }
        // ถ้าไม่มี payment หรือไม่มี paymentStatus และกำลังกรอง awaiting_payment
        if (!order.payment && filterStatus === 'awaiting_payment') {
          return true;
        }
        return false;
      });
  
  // หน้าโหลดข้อมูล
  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#444DDA] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }
  
  // หน้าแสดงข้อผิดพลาด
  if (error) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-100 text-red-600 p-6 rounded-xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">{error}</p>
          </div>
          <button 
            onClick={() => router.push('/admin/dashboard')}
            className="bg-[#444DDA] text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            กลับไปที่แดชบอร์ด
          </button>
        </div>
      </div>
    );
  }
  
  // หน้ารายการคำสั่งซื้อ (หน้าหลัก)
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">จัดการการชำระเงิน</h1>
      
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h2 className="font-medium">รายการคำสั่งซื้อ</h2>
              
              <div className="flex space-x-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="pending_verification">รอการตรวจสอบ</option>
                  <option value="completed">ชำระเงินสำเร็จ</option>
                  <option value="awaiting_payment">รอการชำระเงิน</option>
                  <option value="failed">การชำระเงินล้มเหลว</option>
                  <option value="refunded">คืนเงินแล้ว</option>
                </select>
                
                <button
                  onClick={() => router.refresh()}
                  className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    คำสั่งซื้อ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ลูกค้า
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จำนวนเงิน
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การชำระเงิน
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{order.TrackingNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.user?.username || 'ไม่ระบุชื่อ'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.candidates?.length || 0} คน | {order.services?.length || 0} บริการ
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.TotalPrice?.toLocaleString() || 0} บาท
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                          getStatusColor(order.payment?.paymentStatus || 'awaiting_payment')
                        }`}>
                          {getStatusText(order.payment?.paymentStatus || 'awaiting_payment')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {order.payment?.paymentMethod === 'qr_payment' ? 'QR พร้อมเพย์' : 
                           order.payment?.paymentMethod === 'bank_transfer' ? 'โอนเงินผ่านธนาคาร' : 
                           'ไม่ระบุ'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => viewOrderDetail(order._id)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          ดูข้อมูล
                        </button>
                        
                        {order.payment?.paymentStatus === 'pending_verification' && (
                          <>
                            <button
                              onClick={() => viewOrderDetail(order._id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                              disabled={processing}
                            >
                              ยืนยัน
                            </button>
                            
                            <button
                              onClick={() => viewOrderDetail(order._id)}
                              className="text-red-600 hover:text-red-900"
                              disabled={processing}
                            >
                              ปฏิเสธ
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      ไม่พบข้อมูลคำสั่งซื้อ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* หน้ารายละเอียดของ Order */}
      {viewMode === 'detail' && selectedOrder && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 mb-8">
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-medium">รายละเอียดคำสั่งซื้อ #{selectedOrder.TrackingNumber}</h2>
            <button 
              onClick={backToList}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              กลับไปยังรายการ
            </button>
          </div>
          
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium mb-4">ข้อมูลการชำระเงิน</h3>
            
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                getStatusColor(selectedOrder.payment?.paymentStatus || 'awaiting_payment')
              }`}>
                {getStatusText(selectedOrder.payment?.paymentStatus || 'awaiting_payment')}
              </span>
              
              <div className="flex space-x-2">
                {selectedOrder.payment?.paymentStatus === 'pending_verification' && (
                  <>
                    <button
                      onClick={() => handleUpdatePaymentStatus(selectedOrder._id, 'completed')}
                      disabled={processing}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        processing
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      ยืนยันการชำระเงิน
                    </button>
                    
                    <button
                      onClick={() => handleUpdatePaymentStatus(selectedOrder._id, 'failed')}
                      disabled={processing}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        processing
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      ปฏิเสธการชำระเงิน
                    </button>
                  </>
                )}
                
                {selectedOrder.payment?.paymentStatus === 'completed' && (
                  <button
                    onClick={() => handleUpdatePaymentStatus(selectedOrder._id, 'refunded')}
                    disabled={processing}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      processing
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    คืนเงิน
                  </button>
                )}
              </div>
            </div>
            
            {selectedOrder.payment ? (
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-sm text-gray-600">วิธีการชำระเงิน:</p>
                  <p className="font-medium">
                    {selectedOrder.payment?.paymentMethod === 'qr_payment' ? 'QR พร้อมเพย์' : 
                     selectedOrder.payment?.paymentMethod === 'bank_transfer' ? 'โอนเงินผ่านธนาคาร' : 
                     'ไม่ระบุ'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">วันที่แจ้งชำระเงิน:</p>
                  <p className="font-medium">
                    {selectedOrder.payment?.timestamp
                      ? new Date(selectedOrder.payment.timestamp).toLocaleString('th-TH')
                      : 'ไม่ระบุ'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">ชื่อผู้โอน:</p>
                  <p className="font-medium">
                    {selectedOrder.payment?.transferInfo?.name || 'ไม่ระบุ'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">จำนวนเงิน:</p>
                  <p className="font-medium">
                    {parseInt(selectedOrder.payment?.transferInfo?.amount || 0).toLocaleString()} บาท
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">วันที่โอน:</p>
                  <p className="font-medium">
                    {selectedOrder.payment?.transferInfo?.date || 'ไม่ระบุ'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">รหัสอ้างอิง/เลขที่บัญชี 4 ตัวท้าย:</p>
                  <p className="font-medium">
                    {selectedOrder.payment?.transferInfo?.reference || 'ไม่ระบุ'}
                  </p>
                </div>
              
                {/* แสดงรูปสลิปการโอนเงิน (ถ้ามี) */}
                {selectedOrder.payment?.transferInfo?.receiptUrl && (
                  <div className="col-span-2 mt-4 border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-600 mb-2">สลิปการโอนเงิน:</p>
                    <div className="border border-gray-200 rounded-lg p-2 max-w-xs">
                      <img 
                        src={selectedOrder.payment.transferInfo.receiptUrl} 
                        alt="สลิปการโอนเงิน" 
                        className="max-h-60 mx-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500">
                ยังไม่มีข้อมูลการชำระเงิน
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium mb-4">ข้อมูลคำสั่งซื้อ</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">วันที่สั่งซื้อ:</p>
                <p className="font-medium">
                  {new Date(selectedOrder.createdAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">ประเภท:</p>
                <p className="font-medium">
                  {selectedOrder.OrderType === 'company' ? 'บริษัท' : 'บุคคลธรรมดา'}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">จำนวนผู้สมัคร:</p>
                <p className="font-medium">{selectedOrder.candidates?.length || 0} คน</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">จำนวนบริการ:</p>
                <p className="font-medium">{selectedOrder.services?.length || 0} รายการ</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">ยอดรวม:</p>
                <p className="font-medium">{selectedOrder.SubTotalPrice?.toLocaleString() || 0} บาท</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">ส่วนลด:</p>
                <p className="font-medium">
                  {(selectedOrder.SubTotalPrice - selectedOrder.TotalPrice)?.toLocaleString() || 0} บาท
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">ยอดสุทธิ:</p>
                <p className="font-medium">{selectedOrder.TotalPrice?.toLocaleString() || 0} บาท</p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4">
            <h3 className="font-medium mb-4">รายชื่อผู้สมัคร</h3>
            
            {selectedOrder.candidates?.length > 0 ? (
              <div className="space-y-4">
                {selectedOrder.candidates.map((candidate, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mr-3 font-bold">
                        {index + 1}
                      </div>
                      <h4 className="font-medium">{candidate.C_FullName || candidate.first_name + ' ' + candidate.last_name || 'ไม่ระบุชื่อ'}</h4>
                    </div>
                    
                    <div className="ml-11 space-y-1 text-sm">
                      <p className="text-gray-600">
                        อีเมล: <span className="font-medium">{candidate.C_Email || candidate.email || 'ไม่ระบุ'}</span>
                      </p>
                      
                      {(candidate.C_Company_Name || candidate.company) && (
                        <p className="text-gray-600">
                          บริษัท: <span className="font-medium">{candidate.C_Company_Name || candidate.company}</span>
                        </p>
                      )}
                      
                      <p className="text-gray-600">
                        บริการที่เลือก: <span className="font-medium">{candidate.services?.length || 0} รายการ</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">ไม่พบข้อมูลผู้สมัคร</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}