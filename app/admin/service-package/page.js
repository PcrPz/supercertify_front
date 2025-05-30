"use client"
import React, { useState, useEffect } from 'react';
import { 
  getAllServices, 
  getAllPackages, 
  deleteService,
  deletePackage,
  createService,
  updateService,
  getServiceById,
  createPackage,   // เพิ่มเข้ามา
  updatePackage,   // เพิ่มเข้ามา
  getPackageById   // เพิ่มเข้ามา
} from '@/services/servicePackageApi';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaEllipsisV, FaEye } from 'react-icons/fa';

function generateUUID() { 
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { 
    const r = Math.random() * 16 | 0, 
          v = c === 'x' ? r : (r & 0x3 | 0x8); 
    return v.toString(16); 
  }); 
}

const ServicePackagePage = () => {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActions, setShowActions] = useState({});
  
  // State สำหรับ Modal สร้างบริการใหม่
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newService, setNewService] = useState({
    Service_Title: '',
    Service_Desc: '',
    Price: 0,
    RequiredDocuments: [{
      document_id: generateUUID(),
      document_name: '',
      required: true,
      file_types: ['pdf', 'jpg', 'png'],
      max_size: 5000000
    }]
  });
  const [serviceImage, setServiceImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // State สำหรับ Modal แก้ไขบริการ
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editService, setEditService] = useState(null);
  const [editServiceImage, setEditServiceImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  
  // State สำหรับ Modal ยืนยันการลบ
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [packageToDelete, setPackageToDelete] = useState(null);
  
    // เพิ่ม state สำหรับ Modal สร้าง/แก้ไข Package
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  
  // ดึงข้อมูล Services และ Packages เมื่อโหลดหน้า
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (activeTab === 'services') {
          const servicesData = await getAllServices();
          setServices(servicesData);
        } else {
          const packagesData = await getAllPackages();
          setPackages(packagesData);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab}:`, err);
        setError(`ไม่สามารถโหลดข้อมูล${activeTab === 'services' ? 'บริการ' : 'แพ็คเกจ'}ได้`);
        alert(`ไม่สามารถโหลดข้อมูล${activeTab === 'services' ? 'บริการ' : 'แพ็คเกจ'}ได้`)
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);


  // ฟังก์ชันค้นหา
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // ฟังก์ชันกรอง services หรือ packages ตาม searchTerm
  const filteredItems = activeTab === 'services' 
    ? services.filter(service => 
        service.Service_Title?.toLowerCase().includes(searchTerm.toLowerCase()))
    : packages.filter(pkg => 
        pkg.Package_Title?.toLowerCase().includes(searchTerm.toLowerCase()));

  // ฟังก์ชันนำทางไปหน้าสร้าง
  const handleCreate = () => {
    if (activeTab === 'services') {
      setIsCreateModalOpen(true);
    } else {
      // เปลี่ยนจากนำทางไปหน้าอื่น เป็นเปิด Modal สร้าง Package
      handleCreatePackage();
    }
  };

  // ฟังก์ชันเปิด Modal แก้ไข
  const handleEdit = async (id) => {
    try {
      setLoading(true);
      
      if (activeTab === 'services') {
        // ดึงข้อมูล Service ที่ต้องการแก้ไข
        const serviceData = await getServiceById(id);
        setEditService(serviceData);
        if (serviceData.Service_Image) {
          setEditImagePreview(serviceData.Service_Image);
        }
        setIsEditModalOpen(true);
      } else {
        // เรียกฟังก์ชันแก้ไข Package
        await handleEditPackage(id);
      }
    } catch (err) {
      console.error(`Error fetching details:`, err);
      alert(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = async () => {
  try {
    setLoading(true);
    // ดึงข้อมูล Service ทั้งหมดเพื่อให้เลือก
    const servicesData = await getAllServices();
    setAvailableServices(servicesData);
    setSelectedServices([]);
    setEditingPackage({
      Package_Title: '',
      Package_Desc: '',
      Price: 0,
      Services: []
    });
    setIsPackageModalOpen(true);
  } catch (err) {
    console.error('Error fetching services:', err);
    alert(`ไม่สามารถดึงข้อมูลบริการได้: ${err.message}`);
  } finally {
    setLoading(false);
  }
};
    // ฟังก์ชันเปิด Modal แก้ไข Package
  const handleEditPackage = async (id) => {
    try {
      setLoading(true);
      // ดึงข้อมูล Package ที่ต้องการแก้ไข
      const packageData = await getPackageById(id);
      // ดึงข้อมูล Service ทั้งหมดเพื่อให้เลือก
      const servicesData = await getAllServices();
      
      setAvailableServices(servicesData);
      
      // ตั้งค่าบริการที่เลือกไว้แล้ว
      // แปลง services เป็น array ของ service IDs (กรณีที่เป็น object ที่มี _id)
      let selectedServiceIds = [];
      if (packageData.services) {
        selectedServiceIds = packageData.services.map(service => 
          typeof service === 'string' ? service : service._id
        );
      }
      setSelectedServices(selectedServiceIds);
      
      setEditingPackage(packageData);
      setIsPackageModalOpen(true);
    } catch (err) {
      console.error('Error fetching package/services:', err);
      alert(`ไม่สามารถดึงข้อมูลแพ็คเกจได้: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  // ฟังก์ชันจัดการการเปลี่ยนแปลงข้อมูล Package
const handlePackageChange = (e) => {
  const { name, value } = e.target;
  
  if (name === 'Price') {
    const numValue = parseFloat(value) || 0;
    setEditingPackage({ ...editingPackage, [name]: numValue });
  } else {
    setEditingPackage({ ...editingPackage, [name]: value });
  }
};

// ฟังก์ชันจัดการการเลือก/ยกเลิกการเลือก Service
const toggleServiceSelection = (serviceId) => {
  let newSelectedServices;
  
  if (selectedServices.includes(serviceId)) {
    newSelectedServices = selectedServices.filter(id => id !== serviceId);
  } else {
    newSelectedServices = [...selectedServices, serviceId];
  }
  
  setSelectedServices(newSelectedServices);
  
  // อัปเดตราคาอัตโนมัติถ้าราคาปัจจุบันเป็น 0 หรือเท่ากับราคารวมของ Service ก่อนหน้า
  const currentTotalPrice = calculateTotalPrice();
  if (editingPackage.Price === 0 || editingPackage.Price === currentTotalPrice) {
    // คำนวณราคารวมใหม่ โดยใช้ selectedServices ที่อัปเดตแล้ว
    const newTotalPrice = availableServices
      .filter(service => newSelectedServices.includes(service._id))
      .reduce((total, service) => total + (service.Price || 0), 0);
    
    setEditingPackage(prev => ({
      ...prev,
      Price: newTotalPrice
    }));
  }
};

// ฟังก์ชันคำนวณราคารวมของบริการที่เลือก
const calculateTotalPrice = () => {
  return availableServices
    .filter(service => selectedServices.includes(service._id))
    .reduce((total, service) => total + (service.Price || 0), 0);
};

// ฟังก์ชันส่งฟอร์มสร้าง/แก้ไข Package
const handleSubmitPackage = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    
    if (!editingPackage.Package_Title) {
      alert('กรุณาระบุชื่อแพ็คเกจ');
      setLoading(false);
      return;
    }
    
    if (selectedServices.length === 0) {
      alert('กรุณาเลือกบริการอย่างน้อย 1 รายการ');
      setLoading(false);
      return;
    }
    
    // ถ้าไม่ระบุราคา (0) ให้ใช้ราคารวมของ Service ที่เลือก
    let finalPrice = editingPackage.Price;
    if (finalPrice === 0) {
      finalPrice = calculateTotalPrice();
    }
    
    // ข้อมูลสำหรับส่ง API - รวม services (ตัวพิมพ์เล็ก)
    const packageData = {
      Package_Title: editingPackage.Package_Title,
      Package_Desc: editingPackage.Package_Desc || '',
      Price: finalPrice,
      services: selectedServices // ใช้ชื่อฟิลด์เป็น services (ตัวพิมพ์เล็ก) ตามที่ DTO กำหนด
    };
    
    let result;
    
    if (editingPackage._id) {
      // อัปเดต Package
      result = await updatePackage(editingPackage._id, packageData);
      
      // อัปเดตรายการ packages ในหน้าจอ
      setPackages(packages.map(pkg => 
        pkg._id === result._id ? result : pkg
      ));
      
      alert('แก้ไขแพ็คเกจสำเร็จ');
    } else {
      // สร้าง Package ใหม่
      result = await createPackage(packageData);
      
      // เพิ่มแพ็คเกจใหม่เข้าไปในรายการ packages
      setPackages([...packages, result]);
      
      alert('สร้างแพ็คเกจใหม่สำเร็จ');
    }
    
    // รีเซ็ตข้อมูลและปิด Modal
    setEditingPackage(null);
    setSelectedServices([]);
    setIsPackageModalOpen(false);
  } catch (err) {
    console.error('Error saving package:', err);
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  // ฟังก์ชันแสดง Modal ยืนยันการลบ
  const handleDelete = (id, name) => {
    if (activeTab === 'services') {
      setServiceToDelete({ id, name });
    } else {
      setPackageToDelete({ id, name });
    }
    setDeleteConfirmModal(true);
  };

  // ฟังก์ชันลบ Service/Package จริงๆ
  const confirmDelete = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'services' && serviceToDelete) {
        await deleteService(serviceToDelete.id);
        setServices(services.filter(service => service._id !== serviceToDelete.id));
        alert('ลบบริการสำเร็จ');
      } else if (activeTab === 'packages' && packageToDelete) {
        await deletePackage(packageToDelete.id);
        setPackages(packages.filter(pkg => pkg._id !== packageToDelete.id));
        alert('ลบแพ็คเกจสำเร็จ');
      }
      
      setDeleteConfirmModal(false);
      setServiceToDelete(null);
      setPackageToDelete(null);
    } catch (err) {
      console.error(`Error deleting:`, err);
      alert(`เกิดข้อผิดพลาดในการลบ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // เปิด/ปิดเมนูจัดการ (ไม่ได้ใช้แล้ว แต่เก็บไว้เผื่อต้องการใช้ในอนาคต)
  const toggleActions = (id) => {
    setShowActions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // ปิดโมดัลสร้าง
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setNewService({
      Service_Title: '',
      Service_Desc: '',
      Price: 0,
      RequiredDocuments: [{
        document_id: generateUUID(),
        document_name: '',
        required: true,
        file_types: ['pdf', 'jpg', 'png'],
        max_size: 5000000
      }]
    });
    setServiceImage(null);
    setImagePreview(null);
  };

  // ฟังก์ชันจัดการการเปลี่ยนแปลงชื่อเอกสารในฟอร์มสร้าง
  const handleDocumentNameChange = (index, value) => {
    setNewService(prevService => {
      const updatedDocs = [...prevService.RequiredDocuments];
      updatedDocs[index] = {
        ...updatedDocs[index],
        document_name: value
      };
      return {
        ...prevService,
        RequiredDocuments: updatedDocs
      };
    });
  };

  // ฟังก์ชันจัดการการเปลี่ยนแปลงชื่อเอกสารในฟอร์มแก้ไข
  const handleEditDocumentNameChange = (index, value) => {
    setEditService(prevService => {
      const updatedDocs = [...prevService.RequiredDocuments];
      updatedDocs[index] = {
        ...updatedDocs[index],
        document_name: value
      };
      return {
        ...prevService,
        RequiredDocuments: updatedDocs
      };
    });
  };

  // ฟังก์ชันตรวจสอบความถูกต้องของเอกสาร
  const validateRequiredDocuments = (docs) => {
    let isValid = true;
    let errorMessage = '';
    
    // ตรวจสอบว่ามีเอกสารอย่างน้อย 1 รายการ
    if (!docs || docs.length === 0) {
      return {
        isValid: false,
        errorMessage: 'ต้องระบุเอกสารที่จำเป็นอย่างน้อย 1 รายการ'
      };
    }
    
    // ตรวจสอบแต่ละเอกสาร
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      
      // ชื่อเอกสารต้องไม่ว่างเปล่า
      if (!doc.document_name || doc.document_name.trim() === '') {
        return {
          isValid: false,
          errorMessage: `กรุณาระบุชื่อเอกสารในลำดับที่ ${i+1}`
        };
      }
      
      // ต้องเลือกประเภทไฟล์อย่างน้อย 1 ประเภท
      if (!doc.file_types || doc.file_types.length === 0) {
        return {
          isValid: false,
          errorMessage: `กรุณาเลือกประเภทไฟล์สำหรับเอกสาร ${doc.document_name}`
        };
      }
    }
    
    return { isValid, errorMessage };
  };

  // จัดการเปลี่ยนแปลงข้อมูลใหม่
  const handleNewServiceChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'Price') {
      const numValue = parseFloat(value) || 0;
      setNewService({ ...newService, [name]: numValue });
    } else {
      setNewService({ ...newService, [name]: value });
    }
  };

  // จัดการเปลี่ยนแปลงข้อมูลที่แก้ไข
  const handleEditServiceChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'Price') {
      const numValue = parseFloat(value) || 0;
      setEditService({ ...editService, [name]: numValue });
    } else {
      setEditService({ ...editService, [name]: value });
    }
  };
  const handleServiceSearch = (e) => {
  setServiceSearchTerm(e.target.value);
};

  const filteredAvailableServices = availableServices.filter(service => 
  service.Service_Title?.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
  service.Service_Desc?.toLowerCase().includes(serviceSearchTerm.toLowerCase())
);

  // จัดการอัปโหลดรูปภาพในฟอร์มสร้าง
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setServiceImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // จัดการอัปโหลดรูปภาพในฟอร์มแก้ไข
  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditServiceImage(file);
      const previewUrl = URL.createObjectURL(file);
      setEditImagePreview(previewUrl);
    }
  };

  // ส่งฟอร์มสร้าง Service ใหม่
  const handleSubmitNewService = async (e) => {
    e.preventDefault();
    
    try {
      // ตรวจสอบความถูกต้องของข้อมูล
      const { isValid, errorMessage } = validateRequiredDocuments(newService.RequiredDocuments);
      if (!isValid) {
        alert(errorMessage);
        return;
      }
      
      setLoading(true);
      
      // ข้อมูลสำหรับส่ง API
      const serviceData = {
        ...newService,
        RequiredDocuments: newService.RequiredDocuments
      };
      
      // เรียกใช้ API
      const result = await createService(serviceData, serviceImage);
      
      // เพิ่มเข้าในรายการ
      setServices([...services, result]);
      
      // รีเซ็ตข้อมูล
      setNewService({
        Service_Title: '',
        Service_Desc: '',
        Price: 0,
        RequiredDocuments: [{
          document_id: generateUUID(),
          document_name: '',
          required: true,
          file_types: ['pdf', 'jpg', 'png'],
          max_size: 5000000
        }]
      });
      setServiceImage(null);
      setImagePreview(null);
      setIsCreateModalOpen(false);
      alert('สร้างบริการใหม่สำเร็จ');
    } catch (err) {
      console.error('Error creating service:', err);
      alert(`เกิดข้อผิดพลาดในการสร้างบริการ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ส่งฟอร์มแก้ไข Service
  const handleSubmitEditService = async (e) => {
    e.preventDefault();
    
    try {
      // ตรวจสอบความถูกต้องของข้อมูล
      const { isValid, errorMessage } = validateRequiredDocuments(editService.RequiredDocuments);
      if (!isValid) {
        alert(errorMessage)
        return;
      }
      
      setLoading(true);
      
      // ส่งข้อมูลไปอัปเดต
      const result = await updateService(editService._id, editService, editServiceImage);
      
      // อัปเดตข้อมูลในรายการ
      setServices(services.map(service => 
        service._id === result._id ? result : service
      ));
      
      // รีเซ็ตข้อมูลและปิด Modal
      setEditService(null);
      setEditServiceImage(null);
      setEditImagePreview(null);
      setIsEditModalOpen(false);
      alert('แก้ไขบริการสำเร็จ');
    } catch (err) {
      console.error('Error updating service:', err);
      alert(`เกิดข้อผิดพลาดในการแก้ไขบริการ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">จัดการการตรวจสอบและแพ็คเกจ</h1>
      
    {/* แท็บเลือกระหว่าง Services และ Packages แบบใหม่ - อยู่ด้านซ้าย, transition ที่ smooth ขึ้น */}
    <div className="w-fit mb-6 relative bg-white rounded-full p-1.5 flex border-2 border-gray-300 overflow-hidden">
      {/* Background highlight ที่เคลื่อนที่ได้ */}
      <div 
        className={`absolute top-1.5 bottom-1.5 left-1.5 rounded-full bg-[#444DDA] transition-all duration-300 ease-in-out z-0 ${
          activeTab === 'services' 
            ? 'right-[50%]' 
            : 'left-[50%] right-1.5'
        }`}
      ></div>
      
      <button 
        className={`relative z-10 px-5 py-3 rounded-full text-center transition-colors duration-300 ease-in-out ${
          activeTab === 'services' 
            ? 'text-white font-medium' 
            : 'text-black'
        }`}
        onClick={() => setActiveTab('services')}
      >
        การตรวจสอบ
      </button>
      <button 
        className={`relative z-10 px-10 py-3 rounded-full text-center transition-colors duration-300 ease-in-out ${
          activeTab === 'packages' 
            ? 'text-white font-medium' 
            : 'text-black'
        }`}
        onClick={() => setActiveTab('packages')}
      >
        แพ็คเกจ
      </button>
    </div>
      
      {/* ช่องค้นหาและปุ่มเพิ่ม - เอาปุ่ม "การดึงทั่วไป" ออก */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-1/2">
          <input
            type="text"
            placeholder={`ค้นหาด้วยชื่อ${activeTab === 'services' ? 'บริการตรวจสอบ' : 'แพ็คเกจ'}`}
            className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearch}
          />
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        
        <div>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-blue-600 text-white rounded-full flex items-center gap-2"
          >
            <FaPlus />
            <span>{`เพิ่ม${activeTab === 'services' ? 'การตรวจสอบ' : 'แพ็คเกจ'}`}</span>
          </button>
        </div>
      </div>
      
      {/* แสดงข้อความโหลดหรือข้อผิดพลาด */}
      {loading && <div className="text-center py-8">กำลังโหลด...</div>}
      {error && <div className="text-center text-red-500 py-8">{error}</div>}
      
      {/* แสดงรายการในรูปแบบกรอบโค้ง */}
      {!loading && !error && (
        <div>
          {/* ส่วนหัวของตาราง */}
          {activeTab === 'services' && (
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-full mb-4 text-sm text-gray-600 font-medium border border-gray-300">
              <div className="col-span-1">ลำดับ</div>
              <div className="col-span-3">ชื่อการตรวจสอบ</div>
              <div className="col-span-2 text-center">ราคา(บาท)</div>
              <div className="col-span-5">คำอธิบาย</div>
              <div className="col-span-1 text-center">จัดการ</div>
            </div>
          )}
          {activeTab === 'packages' && (
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 rounded-full mb-4 text-sm text-gray-600 font-medium border border-gray-300">
              <div className="col-span-1">ลำดับ</div>
              <div className="col-span-3">ชื่อแพ็คเกจ</div>
              <div className="col-span-2 text-center">ราคา(บาท)</div>
              <div className="col-span-1 text-center">จำนวนบริการ</div>
              <div className="col-span-4">คำอธิบาย</div>
              <div className="col-span-1 text-right pr-8">จัดการ</div>
            </div>
          )}
          
          {/* แสดงข้อความไม่พบข้อมูล หรือรายการ */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-full p-6 text-center text-gray-500 border border-gray-300">
              ไม่พบข้อมูล{activeTab === 'services' ? 'บริการตรวจสอบ' : 'แพ็คเกจ'}
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isService = activeTab === 'services';
              const title = isService ? item.Service_Title : item.Package_Title;
              const description = isService ? item.Service_Desc : item.Package_Desc;
              
              // กรณีเป็น Package แสดงจำนวน Service ที่มี
              const serviceCount = !isService && item.services ? 
                (Array.isArray(item.services) ? item.services.length : 0) : 0;
              
            return (
              <div 
                key={item._id}
                className="grid grid-cols-12 gap-4 px-4 py-4 bg-white rounded-full mb-3 shadow-sm border border-gray-300 hover:border-gray-400 group"
              >
                <div className="col-span-1 text-gray-500 my-auto ml-4">{index + 1}</div>
                
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    {isService && item.Service_Image && (
                      <img 
                        src={item.Service_Image}
                        alt={title} 
                        className="w-10 h-10 object-cover rounded-full bg-gray-100"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/40?text=No+Image';
                        }}
                      />
                    )}
                    <div className="font-medium truncate">{title}</div>
                  </div>
                </div>
                
                <div className="col-span-2 text-center text-gray-700 my-auto">{item.Price?.toLocaleString() || '0'} บาท</div>
                
                {/* แสดงจำนวนบริการเฉพาะในแท็บแพ็คเกจ */}
                {!isService && (
                  <div className="col-span-1 text-center my-auto">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {serviceCount} บริการ
                    </span>
                  </div>
                )}
                
                <div className={`${isService ? 'col-span-5' : 'col-span-3'} text-gray-600 truncate my-auto`}>
                  {description || 'ไม่มีคำอธิบาย'}
                </div>
                
                <div className={`${isService ? 'col-span-1' : 'col-span-2'} flex ${isService ? 'justify-center' : 'justify-end'} items-center gap-2 my-auto pr-6`}>
                  <button 
                    onClick={() => handleEdit(item._id)}
                    className={`text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-full transition-colors ${!showActions[item._id] ? 'opacity-0 group-hover:opacity-100' : ''}`}
                    title="แก้ไข"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDelete(item._id, isService ? item.Service_Title : item.Package_Title)}
                    className={`text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded-full transition-colors ${!showActions[item._id] ? 'opacity-0 group-hover:opacity-100' : ''}`}
                    title="ลบ"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
            })
          )}
        </div>
      )}
      
      {/* โมดัลสร้าง Service ใหม่ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl custom-scrollbar">
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #d1d5db;
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #9ca3af;
              }
            `}</style>
            
            <div className="sticky top-0 bg-white z-10 px-8 pt-6 pb-4 border-b">
              <h2 className="text-2xl font-bold text-gray-800">เพิ่มการตรวจสอบประวัติ</h2>
            </div>
            
            <form onSubmit={handleSubmitNewService} className="px-8 py-6">
              {/* ส่วนบน: แบ่งเป็นซ้าย 2/3 (ชื่อ+ราคา) และขวา 1/3 (รูปภาพ) */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                {/* ซ้ายบน: ชื่อและราคา (2/3) */}
                <div className="col-span-2 space-y-6">
                  {/* ชื่อการตรวจสอบประวัติ */}
                  <div>
                    <label htmlFor="Service_Title" className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อการตรวจสอบประวัติ
                    </label>
                    <input
                      type="text"
                      id="Service_Title"
                      name="Service_Title"
                      value={newService.Service_Title}
                      onChange={handleNewServiceChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="ป้อนชื่อการตรวจสอบประวัติ"
                    />
                  </div>

                  {/* ราคา */}
                  <div>
                    <label htmlFor="Price" className="block text-sm font-medium text-gray-700 mb-2">
                      ราคา (บาท)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="Price"
                        name="Price"
                        value={newService.Price}
                        onChange={handleNewServiceChange}
                        required
                        min="0"
                        className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">฿</span>
                    </div>
                  </div>
                </div>

                {/* ขวาบน: รูปภาพ (1/3) */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รูปภาพ
                  </label>
                  <div className="relative h-[170px]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-contain rounded-lg border border-dashed border-gray-300 bg-gray-50 p-2"
                        />
                                               <button
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation(); // ป้องกันการกระจายอีเวนต์
                           setServiceImage(null);
                           setImagePreview(null);
                         }}
                         className="absolute top-2 right-2 bg-white text-gray-600 rounded-full p-1 shadow-md hover:bg-gray-100 hover:text-red-500 transition-colors"
                       >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                         </svg>
                       </button>
                       <label 
                         htmlFor="image-upload"
                         className="absolute inset-0 cursor-pointer"
                       ></label>
                     </div>
                   ) : (
                     <label 
                       htmlFor="image-upload"
                       className="flex flex-col items-center justify-center w-full h-full border border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                     >
                       <div className="text-center p-4">
                         <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                         </svg>
                         <p className="mt-2 text-sm text-gray-500">คลิกเพื่อเลือกรูปภาพ</p>
                         <p className="mt-1 text-xs text-gray-400">รองรับไฟล์ JPG, PNG</p>
                       </div>
                     </label>
                   )}
                 </div>
               </div>
             </div>

             {/* ส่วนล่าง: คำอธิบาย (เต็มความกว้าง) */}
             <div className="mb-6">
               <label htmlFor="Service_Desc" className="block text-sm font-medium text-gray-700 mb-2">
                 คำอธิบาย
               </label>
               <textarea
                 id="Service_Desc"
                 name="Service_Desc"
                 value={newService.Service_Desc}
                 onChange={handleNewServiceChange}
                 rows="4"
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                 placeholder="ป้อนคำอธิบายการตรวจสอบประวัติ"
               ></textarea>
             </div>

             {/* เอกสารที่จำเป็น */}
             <div className="border-t pt-6">
               <div className="flex justify-between items-center mb-4">
                 <label className="block text-sm font-medium text-gray-700">
                   เอกสารที่จำเป็น
                 </label>
                 <button
                   type="button"
                   onClick={() => {
                     setNewService({
                       ...newService,
                       RequiredDocuments: [
                         ...newService.RequiredDocuments,
                         {
                           document_id: generateUUID(),
                           document_name: '',
                           required: true,
                           file_types: ['pdf', 'jpg', 'png'],
                           max_size: 5000000
                         }
                       ]
                     });
                   }}
                   className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg flex items-center text-xs hover:bg-blue-100 transition-colors"
                 >
                   <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                   </svg>
                   เพิ่มเอกสาร
                 </button>
               </div>
               
               <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                 {newService.RequiredDocuments.map((doc, index) => (
                   <div key={doc.document_id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 transition-all hover:border-gray-300">
                     <div className="flex justify-between items-start">
                       <h3 className="font-medium text-gray-700 mb-3">เอกสารที่ {index + 1}</h3>
                       {newService.RequiredDocuments.length > 1 && (
                         <button
                           type="button"
                           onClick={() => {
                             const updatedDocs = newService.RequiredDocuments.filter((_, i) => i !== index);
                             setNewService({
                               ...newService,
                               RequiredDocuments: updatedDocs
                             });
                           }}
                           className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                           </svg>
                         </button>
                       )}
                     </div>
                     
                     <div className="grid grid-cols-1 gap-4">
                       {/* ชื่อเอกสาร */}
                       <div>
                         <label className="block text-xs font-medium text-gray-600 mb-1">
                           ชื่อเอกสาร*
                         </label>
                         <input
                           type="text"
                           value={doc.document_name}
                           onChange={(e) => handleDocumentNameChange(index, e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                           placeholder="เช่น สำเนาบัตรประชาชน, ใบรับรองการศึกษา"
                         />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                         {/* ประเภทไฟล์ที่อนุญาต */}
                         <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">
                             ประเภทไฟล์ที่อนุญาต
                           </label>
                           <div className="flex flex-wrap gap-2 bg-white p-2 rounded-lg border border-gray-200 min-h-[42px]">
                             {['pdf', 'jpg', 'png'].map(type => (
                               <div key={`${doc.document_id}-${type}`} className="flex items-center">
                                 <input
                                   type="checkbox"
                                   id={`filetype-${type}-${doc.document_id}`} 
                                   checked={doc.file_types.includes(type)}
                                   onChange={(e) => {
                                     const updatedDocs = [...newService.RequiredDocuments];
                                     if (e.target.checked) {
                                       // เพิ่มประเภทไฟล์
                                       updatedDocs[index] = {
                                         ...updatedDocs[index],
                                         file_types: [...updatedDocs[index].file_types, type]
                                       };
                                     } else {
                                       // ลบประเภทไฟล์
                                       updatedDocs[index] = {
                                         ...updatedDocs[index],
                                         file_types: updatedDocs[index].file_types.filter(t => t !== type)
                                       };
                                     }
                                     setNewService({
                                       ...newService,
                                       RequiredDocuments: updatedDocs
                                     });
                                   }}
                                   className="h-3.5 w-3.5 text-blue-600 rounded"
                                 />
                                 <label htmlFor={`filetype-${type}-${doc.document_id}`} className="ml-1 mr-3 text-xs text-gray-700">
                                   .{type}
                                 </label>
                               </div>
                             ))}
                           </div>
                         </div>
                         
                         {/* ขนาดไฟล์สูงสุด */}
                         <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">
                             ขนาดไฟล์สูงสุด
                           </label>
                           <select
                             value={doc.max_size / 1000000}
                             onChange={(e) => {
                               const updatedDocs = [...newService.RequiredDocuments];
                               updatedDocs[index] = {
                                 ...updatedDocs[index],
                                 max_size: Number(e.target.value) * 1000000
                               };
                               setNewService({
                                 ...newService,
                                 RequiredDocuments: updatedDocs
                               });
                             }}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                           >
                             <option value="3">3 MB</option>
                             <option value="5">5 MB</option>
                             <option value="10">10 MB</option>
                           </select>
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
             
             <div className="sticky bottom-0 bg-white pt-4 pb-2 mt-8 border-t">
               <div className="flex justify-end gap-3">
                 <button
                   type="button"
                   onClick={closeCreateModal}
                   className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                 >
                   ยกเลิก
                 </button>
                 <button
                   type="submit"
                   className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                 >
                   <span>เพิ่มการตรวจสอบ</span>
                   {loading && (
                     <svg className="ml-2 w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                   )}
                 </button>
               </div>
             </div>
           </form>
         </div>
       </div>
     )}
     
     {/* โมดัลแก้ไข Service */}
     {isEditModalOpen && editService && (
       <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
         <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl custom-scrollbar">
           <style jsx>{`
             .custom-scrollbar::-webkit-scrollbar {
               width: 8px;
             }
             .custom-scrollbar::-webkit-scrollbar-track {
               background: #f1f1f1;
               border-radius: 10px;
             }
             .custom-scrollbar::-webkit-scrollbar-thumb {
               background: #d1d5db;
               border-radius: 10px;
             }
             .custom-scrollbar::-webkit-scrollbar-thumb:hover {
               background: #9ca3af;
             }
           `}</style>
           
           <div className="sticky top-0 bg-white z-10 px-8 pt-6 pb-4 border-b flex justify-between items-center">
             <h2 className="text-2xl font-bold text-gray-800">แก้ไขการตรวจสอบประวัติ</h2>
             <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
               รหัส: {editService._id.substring(editService._id.length - 6)}
             </div>
           </div>
           
           <form onSubmit={handleSubmitEditService} className="px-8 py-6">
             {/* ส่วนบน: แบ่งเป็นซ้าย 2/3 (ชื่อ+ราคา) และขวา 1/3 (รูปภาพ) */}
             <div className="grid grid-cols-3 gap-6 mb-6">
               {/* ซ้ายบน: ชื่อและราคา (2/3) */}
               <div className="col-span-2 space-y-6">
                 {/* ชื่อการตรวจสอบประวัติ */}
                 <div>
                   <label htmlFor="Edit_Service_Title" className="block text-sm font-medium text-gray-700 mb-2">
                     ชื่อการตรวจสอบประวัติ
                   </label>
                   <input
                     type="text"
                     id="Edit_Service_Title"
                     name="Service_Title"
                     value={editService.Service_Title}
                     onChange={handleEditServiceChange}
                     required
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                     placeholder="ป้อนชื่อการตรวจสอบประวัติ"
                   />
                 </div>

                 {/* ราคา */}
                 <div>
                   <label htmlFor="Edit_Price" className="block text-sm font-medium text-gray-700 mb-2">
                     ราคา (บาท)
                   </label>
                   <div className="relative">
                     <input
                       type="number"
                       id="Edit_Price"
                       name="Price"
                       value={editService.Price}
                       onChange={handleEditServiceChange}
                       required
                       min="0"
                       className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                       placeholder="0"
                     />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">฿</span>
                   </div>
                 </div>
               </div>

               {/* ขวาบน: รูปภาพ (1/3) */}
               <div className="col-span-1">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   รูปภาพ
                 </label>
                 <div className="relative h-[170px]">
                   <input
                     type="file"
                     accept="image/*"
                     onChange={handleEditImageUpload}
                     className="hidden"
                     id="edit-image-upload"
                   />
                   {editImagePreview ? (
                     <div className="relative w-full h-full">
                       <img 
                         src={editImagePreview} 
                         alt="Preview" 
                         className="w-full h-full object-contain rounded-lg border border-dashed border-gray-300 bg-gray-50 p-2"
                       />
                       <button
                         type="button"
                         onClick={(e) => {
                           e.stopPropagation(); // ป้องกันการกระจายอีเวนต์
                           setEditServiceImage(null);
                           setEditImagePreview(null);
                         }}
                         className="absolute top-2 right-2 bg-white text-gray-600 rounded-full p-1 shadow-md hover:bg-gray-100 hover:text-red-500 transition-colors"
                       >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                         </svg>
                       </button>
                       <label 
                         htmlFor="edit-image-upload"
                         className="absolute inset-0 cursor-pointer"
                       ></label>
                     </div>
                   ) : (
                     <label 
                       htmlFor="edit-image-upload"
                       className="flex flex-col items-center justify-center w-full h-full border border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                     >
                       <div className="text-center p-4">
                         <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                         </svg>
                         <p className="mt-2 text-sm text-gray-500">คลิกเพื่อเลือกรูปภาพ</p>
                         <p className="mt-1 text-xs text-gray-400">รองรับไฟล์ JPG, PNG</p>
                       </div>
                     </label>
                   )}
                 </div>
               </div>
             </div>

             {/* ส่วนล่าง: คำอธิบาย (เต็มความกว้าง) */}
             <div className="mb-6">
               <label htmlFor="Edit_Service_Desc" className="block text-sm font-medium text-gray-700 mb-2">
                 คำอธิบาย
               </label>
               <textarea
                 id="Edit_Service_Desc"
                 name="Service_Desc"
                 value={editService.Service_Desc || ''}
                 onChange={handleEditServiceChange}
                 rows="4"
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                 placeholder="ป้อนคำอธิบายการตรวจสอบประวัติ"
               ></textarea>
             </div>

             {/* เอกสารที่จำเป็น */}
             <div className="border-t pt-6">
               <div className="flex justify-between items-center mb-4">
                 <label className="block text-sm font-medium text-gray-700">
                   เอกสารที่จำเป็น
                 </label>
                 <button
                   type="button"
                   onClick={() => {
                     setEditService({
                       ...editService,
                       RequiredDocuments: [
                         ...editService.RequiredDocuments,
                         {
                           document_id: generateUUID(),
                           document_name: '',
                           required: true,
                           file_types: ['pdf', 'jpg', 'png'],
                           max_size: 5000000
                         }
                       ]
                     });
                   }}
                   className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg flex items-center text-xs hover:bg-blue-100 transition-colors"
                 >
                   <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                   </svg>
                   เพิ่มเอกสาร
                 </button>
               </div>
               
               <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                 {editService.RequiredDocuments && editService.RequiredDocuments.map((doc, index) => (
                   <div key={doc.document_id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 transition-all hover:border-gray-300">
                     <div className="flex justify-between items-start">
                       <h3 className="font-medium text-gray-700 mb-3">เอกสารที่ {index + 1}</h3>
                       {editService.RequiredDocuments.length > 1 && (
                         <button
                           type="button"
                           onClick={() => {
                             const updatedDocs = editService.RequiredDocuments.filter((_, i) => i !== index);
                             setEditService({
                               ...editService,
                               RequiredDocuments: updatedDocs
                             });
                           }}
                           className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                           </svg>
                         </button>
                       )}
                     </div>
                     
                     <div className="grid grid-cols-1 gap-4">
                       {/* ชื่อเอกสาร */}
                       <div>
                         <label className="block text-xs font-medium text-gray-600 mb-1">
                           ชื่อเอกสาร*
                         </label>
                         <input
                           type="text"
                           value={doc.document_name}
                           onChange={(e) => handleEditDocumentNameChange(index, e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                           placeholder="เช่น สำเนาบัตรประชาชน, ใบรับรองการศึกษา"
                         />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                         {/* ประเภทไฟล์ที่อนุญาต */}
                         <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">
                             ประเภทไฟล์ที่อนุญาต
                           </label>
                           <div className="flex flex-wrap gap-2 bg-white p-2 rounded-lg border border-gray-200 min-h-[42px]">
                             {['pdf', 'jpg', 'png'].map(type => (
                               <div key={`edit-${doc.document_id}-${type}`} className="flex items-center">
                                 <input
                                   type="checkbox"
                                   id={`edit-filetype-${type}-${doc.document_id}`} 
                                   checked={doc.file_types?.includes(type) || false}
                                   onChange={(e) => {
                                     const updatedDocs = [...editService.RequiredDocuments];
                                     if (e.target.checked) {
                                       updatedDocs[index] = {
                                         ...updatedDocs[index],
                                         file_types: [...(updatedDocs[index].file_types || []), type]
                                       };
                                     } else {
                                       updatedDocs[index] = {
                                         ...updatedDocs[index],
                                         file_types: (updatedDocs[index].file_types || []).filter(t => t !== type)
                                       };
                                     }
                                     setEditService({
                                       ...editService,
                                       RequiredDocuments: updatedDocs
                                     });
                                   }}
                                   className="h-3.5 w-3.5 text-blue-600 rounded"
                                 />
                                 <label htmlFor={`edit-filetype-${type}-${doc.document_id}`} className="ml-1 mr-3 text-xs text-gray-700">
                                   .{type}
                                 </label>
                               </div>
                             ))}
                           </div>
                         </div>
                         
                         {/* ขนาดไฟล์สูงสุด */}
                         <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">
                             ขนาดไฟล์สูงสุด
                           </label>
                           <select
                             value={(doc.max_size || 5000000) / 1000000}
                             onChange={(e) => {
                               const updatedDocs = [...editService.RequiredDocuments];
                               updatedDocs[index] = {
                                 ...updatedDocs[index],
                                 max_size: Number(e.target.value) * 1000000
                               };
                               setEditService({
                                 ...editService,
                                 RequiredDocuments: updatedDocs
                               });
                             }}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                           >
                             <option value="3">3 MB</option>
                             <option value="5">5 MB</option>
                             <option value="10">10 MB</option>
                           </select>
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
             
             <div className="sticky bottom-0 bg-white pt-4 pb-2 mt-8 border-t">
               <div className="flex justify-end gap-3">
                 <button
                   type="button"
                   onClick={() => {
                     setIsEditModalOpen(false);
                     setEditService(null);
                     setEditServiceImage(null);
                     setEditImagePreview(null);
                   }}
                   className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                 >
                   ยกเลิก
                 </button>
                 <button
                   type="submit"
                   className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                 >
                   <span>บันทึกการเปลี่ยนแปลง</span>
                   {loading && (
                     <svg className="ml-2 w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                   )}
                 </button>
               </div>
             </div>
           </form>
         </div>
       </div>
     )}
     
     {/* Modal ยืนยันการลบ */}
     {deleteConfirmModal && (
       <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
         <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
           <div className="text-center mb-6">
             <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
               <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
               </svg>
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2">ยืนยันการลบ{activeTab === 'services' ? 'บริการ' : 'แพ็คเกจ'}</h3>
             <p className="text-gray-600">
               คุณต้องการลบ{activeTab === 'services' ? 'บริการ' : 'แพ็คเกจ'} "<span className="font-semibold text-gray-800">{activeTab === 'services' ? serviceToDelete?.name : packageToDelete?.name}</span>" ใช่หรือไม่?
             </p>
             <p className="text-sm text-red-500 mt-2">การกระทำนี้ไม่สามารถเรียกคืนได้</p>
           </div>
           
           <div className="flex gap-3 justify-center">
             <button
               onClick={() => {
                 setDeleteConfirmModal(false);
                 setServiceToDelete(null);
                 setPackageToDelete(null);
               }}
               className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
             >
               ยกเลิก
             </button>
             <button
               onClick={confirmDelete}
               className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center"
             >
               {loading ? (
                 <>
                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   กำลังลบ...
                 </>
               ) : (
                 'ลบ'
               )}
             </button>
           </div>
         </div>
       </div>
     )}

      {/* Modal สร้าง/แก้ไข Package */}
      {isPackageModalOpen && editingPackage && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl custom-scrollbar">
            <style jsx>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #d1d5db;
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #9ca3af;
              }
            `}</style>
            
            <div className="sticky top-0 bg-white z-10 px-8 pt-6 pb-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingPackage._id ? 'แก้ไขแพ็คเกจ' : 'เพิ่มแพ็คเกจ'}
              </h2>
              {editingPackage._id && (
                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                  รหัส: {editingPackage._id.substring(editingPackage._id.length - 6)}
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmitPackage} className="px-8 py-6">
              <div className="space-y-6 mb-10">
                {/* ชื่อแพ็คเกจ */}
                <div>
                  <label htmlFor="Package_Title" className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อแพ็คเกจ
                  </label>
                  <input
                    type="text"
                    id="Package_Title"
                    name="Package_Title"
                    value={editingPackage.Package_Title}
                    onChange={handlePackageChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="ป้อนชื่อแพ็คเกจ"
                  />
                </div>

                {/* ราคาและคำอธิบาย */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ราคา */}
                  <div>
                    <label htmlFor="Price" className="block text-sm font-medium text-gray-700 mb-2">
                      ราคา (บาท)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="Price"
                        name="Price"
                        value={editingPackage.Price}
                        onChange={handlePackageChange}
                        required
                        min="0"
                        className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">฿</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">
                        ราคารวมของบริการที่เลือก: {calculateTotalPrice().toLocaleString()} บาท
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPackage(prev => ({
                            ...prev,
                            Price: calculateTotalPrice()
                          }));
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        ใช้ราคารวมนี้
                      </button>
                    </div>
                  </div>

                  {/* คำอธิบาย */}
                  <div>
                    <label htmlFor="Package_Desc" className="block text-sm font-medium text-gray-700 mb-2">
                      คำอธิบาย
                    </label>
                    <textarea
                      id="Package_Desc"
                      name="Package_Desc"
                      value={editingPackage.Package_Desc || ''}
                      onChange={handlePackageChange}
                      rows="4"
                      className="w-full h-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      placeholder="ป้อนคำอธิบายแพ็คเกจ"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* บริการที่มีในแพ็คเกจ */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      บริการในแพ็คเกจ
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {selectedServices.length} รายการ
                    </span>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      className="text-xs px-3 py-1.5 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all w-44 pl-8"
                      placeholder="ค้นหาบริการ..."
                      id="service-search"
                      onChange={(e) => setServiceSearchTerm(e.target.value)}
                      value={serviceSearchTerm || ''}
                    />
                    <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto p-2 custom-scrollbar">
                    {(serviceSearchTerm 
                      ? availableServices.filter(service => 
                          service.Service_Title?.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
                          service.Service_Desc?.toLowerCase().includes(serviceSearchTerm.toLowerCase()))
                      : availableServices
                    ).map(service => (
                      <div 
                        key={service._id} 
                        onClick={() => toggleServiceSelection(service._id)}
                        className={`p-3 rounded-lg border transition-all ${
                          selectedServices.includes(service._id)
                            ? 'bg-white border-blue-300 shadow-sm' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            <div className={`w-5 h-5 rounded-md border ${
                              selectedServices.includes(service._id)
                                ? 'bg-blue-600 border-blue-600' 
                                : 'border-gray-400'
                            } flex items-center justify-center`}>
                              {selectedServices.includes(service._id) && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-gray-800 text-sm truncate">{service.Service_Title}</h4>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <div className="truncate text-xs text-gray-500">{service.Service_Desc || 'ไม่มีคำอธิบาย'}</div>
                              <span className="text-blue-600 font-medium text-xs whitespace-nowrap ml-2">{service.Price?.toLocaleString() || '0'} ฿</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* ข้อความเมื่อไม่พบบริการ */}
                  {availableServices.filter(service => 
                    !serviceSearchTerm || 
                    service.Service_Title?.toLowerCase().includes(serviceSearchTerm.toLowerCase()) ||
                    service.Service_Desc?.toLowerCase().includes(serviceSearchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      {serviceSearchTerm 
                        ? `ไม่พบบริการที่ตรงกับ "${serviceSearchTerm}"` 
                        : 'ไม่มีบริการที่สามารถเลือกได้'}
                    </div>
                  )}
                </div>
                
                {selectedServices.length === 0 && (
                  <div className="text-center text-gray-500 text-sm mt-4">
                    กรุณาเลือกบริการอย่างน้อย 1 รายการ
                  </div>
                )}
              </div>
              
              <div className="sticky bottom-0 bg-white pt-4 pb-2 mt-8 border-t">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPackageModalOpen(false);
                      setEditingPackage(null);
                      setSelectedServices([]);
                      setServiceSearchTerm('');
                    }}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#444DDA] text-white font-medium rounded-lg hover:bg-[#3a41c5] transition-colors flex items-center"
                  >
                    <span>{editingPackage._id ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มแพ็คเกจ'}</span>
                    {loading && (
                      <svg className="ml-2 w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
   </div>
 );
};

export default ServicePackagePage;