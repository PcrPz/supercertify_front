'use client';

import { useState, useEffect } from 'react';
import { getAdminEmails } from '@/services/profileApi'; // ปรับ path ตามโครงสร้างโปรเจ็คของคุณ

export default function TestEmailPage() {
  const [customerEmail, setCustomerEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [emailType, setEmailType] = useState('admin'); // เริ่มต้นด้วยการทดสอบอีเมลแอดมิน
  const [adminEmails, setAdminEmails] = useState([]);
  const [isLoadingAdminEmails, setIsLoadingAdminEmails] = useState(false);
  const [adminEmailsError, setAdminEmailsError] = useState(null);
  
  // ดึงรายการอีเมลแอดมินเมื่อโหลดหน้า
  useEffect(() => {
    fetchAdminEmails();
  }, []);
  
  // ฟังก์ชันสำหรับดึงรายการอีเมลแอดมิน
  const fetchAdminEmails = async () => {
    setIsLoadingAdminEmails(true);
    setAdminEmailsError(null);
    
    try {
      // เรียกใช้ฟังก์ชัน getAdminEmails จาก profileApi
      const emails = await getAdminEmails();
      
      if (Array.isArray(emails) && emails.length > 0) {
        setAdminEmails(emails);
      } else {
        setAdminEmailsError('ไม่พบอีเมลแอดมินในระบบ');
      }
    } catch (error) {
      console.error('Error fetching admin emails:', error);
      setAdminEmailsError(error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลอีเมลแอดมิน');
    } finally {
      setIsLoadingAdminEmails(false);
    }
  };
  
  // ฟังก์ชันสำหรับทดสอบส่งอีเมล
  const sendTestEmail = async () => {
    if (emailType === 'customer' && !customerEmail) {
      alert('กรุณากรอกอีเมลลูกค้า');
      return;
    }
    
    if (emailType === 'admin' && adminEmails.length === 0) {
      alert('ไม่พบอีเมลแอดมินในระบบ');
      return;
    }
    
    setStatus('loading');
    
    try {
      let apiEndpoint;
      let requestBody;
      
      if (emailType === 'customer') {
        // ทดสอบส่งอีเมลแจ้งผลการตรวจสอบให้ลูกค้า
        apiEndpoint = '/api/email/results-completed';
        requestBody = {
          trackingNumber: 'TEST123456',
          customerEmail: customerEmail,
          customerName: 'ผู้ทดสอบระบบ',
          orderId: 'test123',
          resultSummary: {
            total: 3,
            passed: 2,
            failed: 1,
            pending: 0
          }
        };
      } else {
        // ทดสอบส่งอีเมลแจ้งเตือนแอดมิน
        apiEndpoint = '/api/email/notify-admin';
        requestBody = {
          orderId: 'test123',
          trackingNumber: 'TEST123456',
          totalPrice: 5000,
          paymentInfo: {
            paymentMethod: 'bank_transfer',
            transferInfo: {
              name: 'ทดสอบ ระบบ',
              date: new Date().toISOString(),
              amount: 5000,
              receiptUrl: 'https://picsum.photos/200/300' // รูปตัวอย่างสำหรับทดสอบ
            }
          }
        };
      }
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const responseData = await response.json();
      
      setResult({
        success: response.ok,
        status: response.status,
        data: responseData,
        timestamp: new Date().toLocaleString(),
        type: emailType,
        recipients: emailType === 'customer' ? customerEmail : adminEmails.join(', ')
      });
      
      setStatus('done');
    } catch (error) {
      console.error('Error sending test email:', error);
      setResult({
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleString(),
        type: emailType
      });
      setStatus('error');
    }
  };
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-center">ทดสอบส่งอีเมล SuperCertify</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทอีเมลที่ต้องการทดสอบ:</label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="emailType"
                value="customer"
                checked={emailType === 'customer'}
                onChange={() => setEmailType('customer')}
                className="mr-2"
              />
              <span>อีเมลแจ้งผลการตรวจสอบให้ลูกค้า</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="emailType"
                value="admin"
                checked={emailType === 'admin'}
                onChange={() => setEmailType('admin')}
                className="mr-2"
              />
              <span>อีเมลแจ้งเตือนแอดมิน</span>
            </label>
          </div>
        </div>
        
        {emailType === 'customer' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">อีเมลลูกค้าสำหรับทดสอบ:</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="customer@example.com"
            />
          </div>
        )}
        
        {emailType === 'admin' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">อีเมลแอดมินในระบบ:</label>
            {isLoadingAdminEmails ? (
              <div className="py-2 px-3 bg-gray-100 rounded-md">
                <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
              </div>
            ) : adminEmailsError ? (
              <div className="py-2 px-3 bg-red-50 rounded-md border border-red-200">
                <p className="text-red-500">{adminEmailsError}</p>
                <button 
                  onClick={fetchAdminEmails}
                  className="mt-2 text-blue-600 text-sm hover:underline"
                >
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            ) : adminEmails.length === 0 ? (
              <div className="py-2 px-3 bg-yellow-50 rounded-md border border-yellow-200">
                <p className="text-yellow-600">ไม่พบอีเมลแอดมินในระบบ</p>
                <button 
                  onClick={fetchAdminEmails}
                  className="mt-2 text-blue-600 text-sm hover:underline"
                >
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded border border-gray-300 max-h-40 overflow-y-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-300">
                    <tr>
                      <th className="text-left p-1 text-xs font-medium text-gray-500">ลำดับ</th>
                      <th className="text-left p-1 text-xs font-medium text-gray-500">อีเมล</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminEmails.map((email, index) => (
                      <tr key={index} className="border-b border-gray-200 last:border-0">
                        <td className="py-2 px-1 text-sm">{index + 1}</td>
                        <td className="py-2 px-1 text-sm">{email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2">
              อีเมลจะถูกส่งไปยังแอดมินทั้งหมดในรายการนี้
            </p>
          </div>
        )}
        
        <button
          onClick={sendTestEmail}
          disabled={status === 'loading' || (emailType === 'admin' && (adminEmails.length === 0 || isLoadingAdminEmails))}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {status === 'loading' ? 'กำลังส่ง...' : 'ส่งอีเมลทดสอบ'}
        </button>
      </div>
      
      {result && (
        <div className={`bg-white shadow-md rounded-lg p-6 ${result.success ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
          <h2 className="text-lg font-semibold mb-4">ผลลัพธ์การทดสอบ</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">เวลา:</p>
              <p className="font-medium">{result.timestamp}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ประเภทอีเมล:</p>
              <p className="font-medium">{result.type === 'customer' ? 'อีเมลแจ้งผลการตรวจสอบให้ลูกค้า' : 'อีเมลแจ้งเตือนแอดมิน'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">สถานะ HTTP:</p>
              <p className="font-medium">{result.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ผลลัพธ์:</p>
              <p className={`font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                {result.success ? 'สำเร็จ' : 'ล้มเหลว'}
              </p>
            </div>
          </div>
          
          {result.recipients && (
            <div className="mb-4 bg-gray-50 p-3 rounded border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">ผู้รับ:</p>
              <p className="break-words">{result.recipients}</p>
            </div>
          )}
          
          {/* แสดงรายละเอียดผู้รับจาก response ถ้ามี */}
          {result.data && result.data.recipients && (
            <div className="mb-4 bg-green-50 p-3 rounded border border-green-200">
              <p className="text-sm font-medium text-green-700 mb-1">ยืนยันการส่งไปยัง:</p>
              <p className="break-words">
                {Array.isArray(result.data.recipients) 
                  ? result.data.recipients.join(', ') 
                  : result.data.recipients}
              </p>
              {result.data.messageId && (
                <p className="text-xs text-gray-500 mt-2">
                  Message ID: {result.data.messageId}
                </p>
              )}
            </div>
          )}
          
          {result.error && (
            <div className="mb-4 p-3 bg-red-50 rounded border border-red-200">
              <p className="text-sm font-medium text-red-800">ข้อผิดพลาด:</p>
              <p className="text-red-600">{result.error}</p>
            </div>
          )}
          
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-1">ข้อมูลตอบกลับ:</p>
            <pre className="bg-gray-50 p-3 rounded border border-gray-200 text-sm overflow-auto max-h-64 whitespace-pre-wrap">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}