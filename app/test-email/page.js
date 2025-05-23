// app/test-email/page.js
'use client';

import { useState } from 'react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  
  const sendTestEmail = async () => {
    if (!email) {
      alert('กรุณากรอกอีเมล');
      return;
    }
    
    setStatus('loading');
    
    try {
      const response = await fetch('/api/email/results-completed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackingNumber: 'TEST123456',
          customerEmail: email,
          customerName: 'ผู้ทดสอบระบบ',
          orderId: 'test123',
          resultSummary: {
            total: 3,
            passed: 2,
            failed: 1,
            pending: 0
          }
        }),
      });
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { error: 'Invalid JSON response', rawText: responseText };
      }
      
      setResult({
        success: response.ok,
        status: response.status,
        data: responseData
      });
      
      setStatus('done');
    } catch (error) {
      console.error('Error sending test email:', error);
      setResult({
        success: false,
        error: error.message
      });
      setStatus('error');
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ทดสอบส่งอีเมล</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">อีเมลสำหรับทดสอบ:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          placeholder="your-email@example.com"
        />
      </div>
      
      <button
        onClick={sendTestEmail}
        disabled={status === 'loading'}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {status === 'loading' ? 'กำลังส่ง...' : 'ส่งอีเมลทดสอบ'}
      </button>
      
      {result && (
        <div className={`mt-6 p-4 rounded ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h2 className="text-lg font-semibold mb-2">ผลลัพธ์:</h2>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
          
          {result.error && (
            <p className="text-red-600 mt-2"><strong>Error:</strong> {result.error}</p>
          )}
          
          <div className="mt-4">
            <h3 className="font-medium mb-1">Response data:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}