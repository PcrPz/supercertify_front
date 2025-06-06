
'use client';

import { useState, useEffect } from 'react';
import { 
  getPaymentMethods, 
  updatePaymentMethods,
  uploadQrCodeImage,
  validatePaymentMethods
} from '@/services/PaymentSettingsApi';
import { toast } from "sonner";
import Image from 'next/image';

export default function PaymentSettingsPage() {
  // States
  const [paymentMethods, setPaymentMethods] = useState({
    qr_payment: {
      enabled: true,
      account_name: '',
      account_number: '',
      qr_image: null,
      description: 'ชำระเงินผ่าน QR Code พร้อมเพย์'
    },
    bank_transfer: {
      enabled: true,
      bank_name: '',
      account_name: '',
      account_number: '',
      description: 'โอนเงินผ่านธนาคาร'
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [qrPreview, setQrPreview] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Load payment methods data
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setLoading(true);
      try {
        const data = await getPaymentMethods();
        if (data) {
          setPaymentMethods(data);
          if (data.qr_payment?.qr_image) {
            setQrPreview(data.qr_payment.qr_image);
          }
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        toast.error("ไม่สามารถโหลดข้อมูลช่องทางการชำระเงินได้");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Handle form field changes
  const handleChange = (section, field, value) => {
    setPaymentMethods(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  // Handle toggle changes
  const handleToggle = (section, value) => {
    setPaymentMethods(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        enabled: value
      }
    }));
    setHasChanges(true);
  };

  // Handle QR code file selection
  const handleQrFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ขนาดไฟล์ใหญ่เกิน 5MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }

    setQrFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    setHasChanges(true);
  };

  // Handle QR code upload
  const handleQrUpload = async () => {
    if (!qrFile) {
      toast.error("กรุณาเลือกไฟล์ QR Code");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadQrCodeImage(qrFile);
      
      if (result.success) {
        toast.success("อัปโหลด QR Code สำเร็จ");
        
        // Update state with data from server
        if (result.data && result.data.qr_payment) {
          setPaymentMethods(prev => ({
            ...prev,
            qr_payment: {
              ...prev.qr_payment,
              qr_image: result.qr_image_url
            }
          }));
        }
        
        setQrFile(null);
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาดในการอัปโหลด QR Code");
      }
    } catch (error) {
      console.error("Error uploading QR code:", error);
      toast.error("เกิดข้อผิดพลาดในการอัปโหลด QR Code");
    } finally {
      setUploading(false);
    }
  };

  // Validate the form
  const validateForm = async () => {
    setErrors({});
    const newErrors = {};
    let isValid = true;

    // QR Payment validation
    if (paymentMethods.qr_payment.enabled) {
      if (!paymentMethods.qr_payment.account_name?.trim()) {
        newErrors.qr_account_name = "กรุณาระบุชื่อบัญชี";
        isValid = false;
      }
      if (!paymentMethods.qr_payment.account_number?.trim()) {
        newErrors.qr_account_number = "กรุณาระบุเลขบัญชี";
        isValid = false;
      }
    }

    // Bank Transfer validation
    if (paymentMethods.bank_transfer.enabled) {
      if (!paymentMethods.bank_transfer.bank_name?.trim()) {
        newErrors.bank_name = "กรุณาระบุชื่อธนาคาร";
        isValid = false;
      }
      if (!paymentMethods.bank_transfer.account_name?.trim()) {
        newErrors.bank_account_name = "กรุณาระบุชื่อบัญชี";
        isValid = false;
      }
      if (!paymentMethods.bank_transfer.account_number?.trim()) {
        newErrors.bank_account_number = "กรุณาระบุเลขบัญชี";
        isValid = false;
      }
    }

    // At least one method must be enabled
    if (!paymentMethods.qr_payment.enabled && !paymentMethods.bank_transfer.enabled) {
      newErrors.payment_method = "กรุณาเปิดใช้งานอย่างน้อยหนึ่งวิธีการชำระเงิน";
      isValid = false;
    }

    setErrors(newErrors);

    // Validate on server side
    try {
      const validationResult = await validatePaymentMethods(paymentMethods);
      
      if (!validationResult.valid) {
        setValidationErrors(validationResult.errors || []);
        return false;
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบข้อมูล");
      return false;
    }

    return isValid;
  };

  // Save payment methods
  const handleSave = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    setSaving(true);
    try {
      const result = await updatePaymentMethods(paymentMethods);
      
      if (result.success) {
        toast.success("บันทึกการตั้งค่าการชำระเงินสำเร็จ");
        setHasChanges(false);
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า");
      }
    } catch (error) {
      console.error("Error saving payment methods:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกการตั้งค่า");
    } finally {
      setSaving(false);
    }
  };

  // Reset form
  const handleReset = () => {
    const fetchPaymentMethods = async () => {
      setLoading(true);
      try {
        const data = await getPaymentMethods();
        if (data) {
          setPaymentMethods(data);
          if (data.qr_payment?.qr_image) {
            setQrPreview(data.qr_payment.qr_image);
          } else {
            setQrPreview(null);
          }
        }
        setQrFile(null);
        setHasChanges(false);
        setErrors({});
        setShowCancelDialog(false);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        toast.error("ไม่สามารถโหลดข้อมูลช่องทางการชำระเงินได้");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <svg className="animate-spin h-8 w-8 text-[#444DDA]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-2 text-[#444DDA] font-medium">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl bg-gray-50">
      <h1 className="text-2xl font-bold mb-8 text-[#444DDA]">การตั้งค่าช่องทางการชำระเงิน</h1>
      
      {validationErrors.length > 0 && (
        <div className="bg-white border-l-4 border-[#FFC107] p-4 mb-6 rounded-xl shadow-sm">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-[#FFC107] mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="font-medium text-gray-800">ข้อผิดพลาดในการตรวจสอบข้อมูล</p>
          </div>
          <ul className="list-disc pl-5 mt-2">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-gray-700">{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {errors.payment_method && (
        <div className="bg-white border-l-4 border-[#FFC107] p-4 mb-6 rounded-xl shadow-sm">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-[#FFC107] mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="font-medium text-gray-800">ข้อผิดพลาด</p>
          </div>
          <p className="text-gray-700">{errors.payment_method}</p>
        </div>
      )}

      {/* QR Payment Section */}
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden transition-all hover:shadow-md">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-[#444DDA]">QR Code พร้อมเพย์</h2>
              <p className="text-gray-500 mt-1 text-sm">ตั้งค่าการชำระเงินผ่าน QR Code</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={paymentMethods.qr_payment.enabled}
                onChange={(e) => handleToggle('qr_payment', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#444DDA]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#444DDA]"></div>
            </label>
          </div>
        </div>
        <div className="p-5">
          <div className={paymentMethods.qr_payment.enabled ? "" : "opacity-50 pointer-events-none"}>
            <div className="grid gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="qr-account-name" className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อบัญชี <span className="text-[#FFC107]">*</span>
                  </label>
                  <input
                    id="qr-account-name"
                    type="text"
                    value={paymentMethods.qr_payment.account_name || ''}
                    onChange={(e) => handleChange('qr_payment', 'account_name', e.target.value)}
                    className={`w-full px-3 py-2 border ${errors.qr_account_name ? 'border-[#FFC107]' : 'border-gray-200'} rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#444DDA] focus:border-[#444DDA] transition-colors`}
                    placeholder="ชื่อบัญชีพร้อมเพย์"
                  />
                  {errors.qr_account_name && (
                    <p className="text-[#FFC107] text-xs mt-1">{errors.qr_account_name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="qr-account-number" className="block text-sm font-medium text-gray-700 mb-1">
                    เลขบัญชี <span className="text-[#FFC107]">*</span>
                  </label>
                  <input
                    id="qr-account-number"
                    type="text"
                    value={paymentMethods.qr_payment.account_number || ''}
                    onChange={(e) => handleChange('qr_payment', 'account_number', e.target.value)}
                    className={`w-full px-3 py-2 border ${errors.qr_account_number ? 'border-[#FFC107]' : 'border-gray-200'} rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#444DDA] focus:border-[#444DDA] transition-colors`}
                    placeholder="เลขบัญชีพร้อมเพย์"
                  />
                  {errors.qr_account_number && (
                    <p className="text-[#FFC107] text-xs mt-1">{errors.qr_account_number}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="qr-description" className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  id="qr-description"
                  value={paymentMethods.qr_payment.description || ''}
                  onChange={(e) => handleChange('qr_payment', 'description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#444DDA] focus:border-[#444DDA] transition-colors"
                  placeholder="ข้อความที่แสดงให้ลูกค้าเห็นเมื่อเลือกช่องทางนี้"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รูปภาพ QR Code</label>
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  {qrPreview && (
                    <div className="border rounded-lg p-2 bg-gray-50 relative shadow-sm">
                      <Image
                        src={qrPreview}
                        alt="QR Code Preview"
                        width={150}
                        height={150}
                        className="object-contain rounded"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex-1">
                        <input
                          id="qr-image"
                          type="file"
                          accept="image/*"
                          onChange={handleQrFileChange}
                          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#444DDA]/10 file:text-[#444DDA] hover:file:bg-[#444DDA]/20 focus:outline-none cursor-pointer"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={handleQrUpload} 
                        disabled={!qrFile || uploading}
                        className={`px-4 py-2 rounded-lg shadow-sm text-sm font-medium flex items-center whitespace-nowrap ${!qrFile || uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#444DDA] text-white hover:bg-[#444DDA]/90'} transition-colors`}
                      >
                        {uploading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            กำลังอัปโหลด...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            อัปโหลด
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      แนะนำขนาด 400x400 px, ไม่เกิน 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Transfer Section */}
      <div className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden transition-all hover:shadow-md">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-[#444DDA]">การโอนเงินผ่านธนาคาร</h2>
              <p className="text-gray-500 mt-1 text-sm">ตั้งค่าการชำระเงินโดยการโอนผ่านธนาคาร</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={paymentMethods.bank_transfer.enabled}
                onChange={(e) => handleToggle('bank_transfer', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#444DDA]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#444DDA]"></div>
            </label>
          </div>
        </div>
        <div className="p-5">
          <div className={paymentMethods.bank_transfer.enabled ? "" : "opacity-50 pointer-events-none"}>
            <div className="grid gap-5">
              <div>
                <label htmlFor="bank-name" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อธนาคาร <span className="text-[#FFC107]">*</span>
                </label>
                <input
                  id="bank-name"
                  type="text"
                  value={paymentMethods.bank_transfer.bank_name || ''}
                  onChange={(e) => handleChange('bank_transfer', 'bank_name', e.target.value)}
                  className={`w-full px-3 py-2 border ${errors.bank_name ? 'border-[#FFC107]' : 'border-gray-200'} rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#444DDA] focus:border-[#444DDA] transition-colors`}
                  placeholder="ชื่อธนาคาร เช่น ธนาคารกสิกรไทย"
                />
                {errors.bank_name && (
                  <p className="text-[#FFC107] text-xs mt-1">{errors.bank_name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="bank-account-name" className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อบัญชี <span className="text-[#FFC107]">*</span>
                  </label>
                  <input
                    id="bank-account-name"
                    type="text"
                    value={paymentMethods.bank_transfer.account_name || ''}
                    onChange={(e) => handleChange('bank_transfer', 'account_name', e.target.value)}
                    className={`w-full px-3 py-2 border ${errors.bank_account_name ? 'border-[#FFC107]' : 'border-gray-200'} rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#444DDA] focus:border-[#444DDA] transition-colors`}
                    placeholder="ชื่อบัญชีธนาคาร"
                  />
                  {errors.bank_account_name && (
                    <p className="text-[#FFC107] text-xs mt-1">{errors.bank_account_name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="bank-account-number" className="block text-sm font-medium text-gray-700 mb-1">
                    เลขบัญชี <span className="text-[#FFC107]">*</span>
                  </label>
                  <input
                    id="bank-account-number"
                    type="text"
                    value={paymentMethods.bank_transfer.account_number || ''}
                    onChange={(e) => handleChange('bank_transfer', 'account_number', e.target.value)}
                    className={`w-full px-3 py-2 border ${errors.bank_account_number ? 'border-[#FFC107]' : 'border-gray-200'} rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#444DDA] focus:border-[#444DDA] transition-colors`}
                    placeholder="เลขบัญชีธนาคาร"
                  />
                  {errors.bank_account_number && (
                    <p className="text-[#FFC107] text-xs mt-1">{errors.bank_account_number}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="bank-description" className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  id="bank-description"
                  value={paymentMethods.bank_transfer.description || ''}
                  onChange={(e) => handleChange('bank_transfer', 'description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#444DDA] focus:border-[#444DDA] transition-colors"
                  placeholder="ข้อความที่แสดงให้ลูกค้าเห็นเมื่อเลือกช่องทางนี้"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button 
          type="button" 
          onClick={() => setShowCancelDialog(true)}
          disabled={!hasChanges || saving}
          className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#444DDA]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ยกเลิก
        </button>
        
        <button 
          type="button" 
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`px-4 py-2 text-white rounded-lg shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#444DDA] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${saving ? 'bg-[#444DDA]/80' : 'bg-[#444DDA] hover:bg-[#444DDA]/90'}`}
        >
          {saving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังบันทึก...
            </>
          ) : "บันทึกการเปลี่ยนแปลง"}
        </button>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowCancelDialog(false)}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-[#FFC107]/20 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-[#FFC107]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      ยืนยันการยกเลิก
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการเปลี่ยนแปลง? การเปลี่ยนแปลงทั้งหมดจะหายไป
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-[#FFC107] text-base font-medium text-white hover:bg-[#FFC107]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFC107] sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={handleReset}
                >
                  ยืนยัน
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#444DDA] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={() => setShowCancelDialog(false)}
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}