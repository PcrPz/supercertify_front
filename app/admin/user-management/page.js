
"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUsersByRole, getAllUsers, updateUserRole, deleteUser } from '@/services/profileApi';
import { getOrderCountByUser } from '@/services/apiService';
import useToast from '@/hooks/useToast'; // เพิ่ม import useToast

// Main component
export default function AdminUserManagement() {
  const router = useRouter(); 
  // States
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [totalUsers, setTotalUsers] = useState(0);
  const [userOrders, setUserOrders] = useState({});
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // เพิ่ม useToast hook
  const { success: successToast, error: errorToast, warning, info, loading: toastLoading, update } = useToast();

  // Theme colors
  const colors = {
    primary: "#444DDA",
    secondary: "#FFC107",
    white: "#FFFFFF",
    danger: "#E53E3E",
    success: "#38A169",
    gray: {
      100: "#F7FAFC",
      200: "#EDF2F7",
      300: "#E2E8F0",
      400: "#CBD5E0",
      500: "#A0AEC0",
      600: "#718096",
      700: "#4A5568",
      800: "#2D3748",
      900: "#1A202C",
    }
  };

  // Handle outside click to close menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (activeMenu && !event.target.closest('.action-menu-container')) {
        setActiveMenu(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenu]);

  // Load users data based on filter
  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        let fetchedUsers;
        
        if (currentFilter === 'all') {
          fetchedUsers = await getAllUsers();
        } else {
          fetchedUsers = await getUsersByRole(currentFilter);
        }
        
        if (Array.isArray(fetchedUsers)) {
          setUsers(fetchedUsers);
          setFilteredUsers(fetchedUsers);
          setTotalUsers(fetchedUsers.length);
        } else {
          setError("ข้อมูลที่ได้รับไม่อยู่ในรูปแบบที่ถูกต้อง");
        }
      } catch (err) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:", err);
        setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUsers();
  }, [currentFilter]);

  // Search users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const normalizedSearchTerm = searchTerm.toLowerCase();
    const filtered = users.filter(user => 
      (user.username?.toLowerCase().includes(normalizedSearchTerm)) || 
      (user.email?.toLowerCase().includes(normalizedSearchTerm)) ||
      (user.phoneNumber?.includes(searchTerm)) ||
      (user.companyName?.toLowerCase().includes(normalizedSearchTerm))
    );
    
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Load order counts for all users
  useEffect(() => {
    async function fetchOrderCounts() {
      setIsLoadingOrders(true);
      try {
        const orderCounts = await getOrderCountByUser();
        setUserOrders(orderCounts);
      } catch (err) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ:", err);
      } finally {
        setIsLoadingOrders(false);
      }
    }
    
    fetchOrderCounts();
  }, []);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Format date from ISO string
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = new Intl.DateTimeFormat('th-TH', { month: 'long' }).format(date);
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการแปลงวันที่:", err);
      return '-';
    }
  };

  // Event handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
  };

  const handleViewDetails = (userId) => {
    router.push(`/admin/user-management/${userId}`);
  };


  const handleMenuToggle = (userId) => {
    setActiveMenu(activeMenu === userId ? null : userId);
  };

  const handlePromoteToAdmin = (userId) => {
    const user = users.find(u => u._id === userId);
    if (user) {
      setSelectedUser(user);
      setShowConfirmModal(true);
      setActiveMenu(null);
    }
  };

  const handleConfirmPromote = async () => {
    if (!selectedUser) return;
    
    let loadingToastId;
    
    try {
      // แสดง loading toast
      loadingToastId = toastLoading('กำลังเพิ่มสิทธิ์ผู้ดูแลระบบ...');
      
      const response = await updateUserRole(selectedUser._id, 'admin');
      
      if (response && response.success) {
        // Update users list with new role
        updateUsersList(selectedUser._id, 'admin');
        // Close confirmation dialog
        setShowConfirmModal(false);
        setSelectedUser(null);
        
        // อัพเดต loading toast เป็น success
        update(loadingToastId, {
          render: 'เพิ่มสิทธิ์ผู้ดูแลระบบสำเร็จ! 🎉',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        });
      } else {
        // อัพเดต loading toast เป็น error
        update(loadingToastId, {
          render: response?.message || "เกิดข้อผิดพลาดในการเปลี่ยนบทบาทผู้ใช้",
          type: 'error',
          isLoading: false,
          autoClose: 4000,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        });
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการเปลี่ยนบทบาทผู้ใช้:", err);
      
      // อัพเดต loading toast เป็น error
      if (loadingToastId) {
        update(loadingToastId, {
          render: "ไม่สามารถเปลี่ยนบทบาทผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง",
          type: 'error',
          isLoading: false,
          autoClose: 4000,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        });
      } else {
        errorToast("ไม่สามารถเปลี่ยนบทบาทผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง");
      }
    }
  };

  const handleCancelPromote = () => {
    setShowConfirmModal(false);
    setSelectedUser(null);
  };

  const handleDeleteUser = (userId) => {
    const user = users.find(u => u._id === userId);
    if (user) {
      setSelectedUser(user);
      setShowDeleteConfirmModal(true);
      setActiveMenu(null);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    let loadingToastId;
    
    try {
      // แสดง loading toast
      loadingToastId = toastLoading('กำลังลบผู้ใช้...');
      
      const response = await deleteUser(selectedUser._id);
      
      if (response && response.success) {
        // ปิด modal และลบผู้ใช้ออกจากรายการ
        setShowDeleteConfirmModal(false);
        
        // อัปเดตรายการผู้ใช้ (ลบผู้ใช้ออกจากรายการ)
        setUsers(prevUsers => prevUsers.filter(user => user._id !== selectedUser._id));
        setFilteredUsers(prevFiltered => prevFiltered.filter(user => user._id !== selectedUser._id));
        setTotalUsers(prevTotal => prevTotal - 1);
        
        // อัพเดต loading toast เป็น success
        update(loadingToastId, {
          render: response.message || "ลบผู้ใช้สำเร็จ! 🗑️",
          type: 'success',
          isLoading: false,
          autoClose: 3000,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        });
        
        // ล้างค่า selectedUser
        setSelectedUser(null);
      } else {
        // อัพเดต loading toast เป็น error
        update(loadingToastId, {
          render: response?.message || "เกิดข้อผิดพลาดในการลบผู้ใช้",
          type: 'error',
          isLoading: false,
          autoClose: 4000,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        });
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการลบผู้ใช้:", err);
      
      // อัพเดต loading toast เป็น error
      if (loadingToastId) {
        update(loadingToastId, {
          render: "ไม่สามารถลบผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง",
          type: 'error',
          isLoading: false,
          autoClose: 4000,
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        });
      } else {
        errorToast("ไม่สามารถลบผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง");
      }
    }
  };
  
  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setSelectedUser(null);
  };

  // Helper function to update users list after role change
  const updateUsersList = (userId, newRole) => {
    // Update main users list
    const updatedUsers = users.map(user => 
      user._id === userId ? { ...user, role: newRole } : user
    );
    setUsers(updatedUsers);
    
    // Update filtered users list based on current filter
    if (currentFilter !== 'all' && newRole !== currentFilter) {
      setFilteredUsers(prevFiltered => 
        prevFiltered.filter(user => user._id !== userId)
      );
    } else {
      setFilteredUsers(prevFiltered => 
        prevFiltered.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        )
      );
    }
  };

  // Show error message if error occurs
  if (error) {
    return (
      <div className="p-6 max-w-[90rem] mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <strong className="font-medium">เกิดข้อผิดพลาด! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[90rem] mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-800 mb-2">จัดการผู้ใช้งาน</h1>
        <p className="text-sm text-gray-500">
          {totalUsers} ผู้ใช้งาน{currentFilter === 'all' ? '' : currentFilter === 'admin' ? ' (ผู้ดูแลระบบ)' : ' (ผู้ใช้ทั่วไป)'}
        </p>
      </div>
      
      {/* Filter and search section */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
        <FilterButtons 
          currentFilter={currentFilter} 
          onFilterChange={handleFilterChange} 
          colors={colors}
        />
        
        <SearchBox 
          searchTerm={searchTerm} 
          onSearchChange={handleSearchChange} 
        />
      </div>
      
      {/* Loading indicator */}
      {isLoading && <LoadingSpinner color={colors.primary} />}
      
      {/* Users list */}
      {!isLoading && (
        <div>
          {/* Table header */}
          <TableHeader colors={colors} />
          
          {/* User rows */}
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <UserRow 
                key={user._id}
                user={user}
                formatDate={formatDate}
                isLoadingOrders={isLoadingOrders}
                orderCount={userOrders[user._id] || 0}
                isMenuActive={activeMenu === user._id}
                onViewDetails={handleViewDetails}
                onMenuToggle={handleMenuToggle}
                onPromoteToAdmin={handlePromoteToAdmin}
                onDeleteUser={handleDeleteUser}
                colors={colors}
                router={router} 
              />
            ))
          ) : (
            <EmptyState />
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">ยืนยันการเพิ่มสิทธิ์</h3>
              <p className="text-gray-600 mb-2">
                คุณกำลังจะเพิ่มสิทธิ์ให้กับผู้ใช้ "<span className="font-semibold text-gray-800">{selectedUser.username}</span>"
              </p>
              
              <div className="bg-gray-100 p-3 rounded-lg text-left mb-2">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: "#ECEEFE" }}>
                    <span style={{ color: colors.primary }} className="font-medium">
                      {selectedUser.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{selectedUser.username}</div>
                    <div className="text-xs text-gray-500">{selectedUser.email}</div>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-red-500 mt-2 text-left">
                <p className="font-medium mb-1">⚠️ โปรดทราบ:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>เมื่อเพิ่มสิทธิ์เป็นผู้ดูแลระบบแล้ว จะไม่สามารถลดสิทธิ์กลับมาเป็นผู้ใช้งานทั่วไปได้</li>
                  <li>ผู้ดูแลระบบสามารถเข้าถึงข้อมูลทั้งหมดในระบบ</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCancelPromote}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmPromote}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                ยืนยันการเพิ่มสิทธิ์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">ยืนยันการลบผู้ใช้</h3>
              <p className="text-gray-600">
                คุณต้องการลบผู้ใช้ "<span className="font-semibold text-gray-800">{selectedUser.username}</span>" ใช่หรือไม่?
              </p>
              
              <div className="bg-gray-100 p-3 rounded-lg text-left my-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: "#ECEEFE" }}>
                    <span style={{ color: colors.primary }} className="font-medium">
                      {selectedUser.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{selectedUser.username}</div>
                    <div className="text-xs text-gray-500">{selectedUser.email}</div>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-red-500 mt-2">การกระทำนี้ไม่สามารถเรียกคืนได้</p>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCancelDelete}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component for filter buttons
function FilterButtons({ currentFilter, onFilterChange, colors }) {
  const filters = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'user', label: 'ผู้ใช้งาน' },
    { id: 'admin', label: 'ผู้ดูแลระบบ' }
  ];
  
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button 
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${
            currentFilter === filter.id ? 'text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={{ 
            backgroundColor: currentFilter === filter.id ? colors.primary : colors.gray[200],
          }}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

// Component for search box
function SearchBox({ searchTerm, onSearchChange }) {
  return (
    <div className="w-full sm:w-auto">
      <div className="relative">
        <input
          type="text"
          placeholder="ค้นหาผู้ใช้..."
          className="w-full sm:w-80 px-4 py-2 border-2 border-gray-300 rounded-full"
          value={searchTerm}
          onChange={onSearchChange}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}

// Component for loading spinner
function LoadingSpinner({ color }) {
  return (
    <div className="flex justify-center items-center py-12">
      <div 
        className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
        style={{ borderColor: color }}
      ></div>
    </div>
  );
}

// Component for table header
function TableHeader() {
  const columns = [
    { id: 'name', label: 'ชื่อผู้ใช้', width: 'w-[25%]', align: 'ml-2' },
    { id: 'phone', label: 'เบอร์โทรศัพท์', width: 'w-[15%]', align: 'text-center' },
    { id: 'joined', label: 'วันที่สมัคร', width: 'w-[15%]', align: 'text-center' },
    { id: 'role', label: 'บทบาท', width: 'w-[13%]', align: 'text-center' },
    { id: 'orders', label: 'จำนวนคำสั่งซื้อ', width: 'w-[13%]', align: 'text-center' },
    { id: 'details', label: 'รายละเอียด', width: 'w-[10%]', align: 'text-center' },
    { id: 'actions', label: 'จัดการ', width: 'w-[10%]', align: 'text-right mr-2' }
  ];
  
  return (
    <div className="flex items-center rounded-full border-2 border-gray-300 px-6 py-4 mb-4 font-medium text-sm text-gray-600">
      {columns.map((col) => (
        <div key={col.id} className={`${col.width} ${col.align}`}>
          {col.label}
        </div>
      ))}
    </div>
  );
}

// Component for user row
function UserRow({ 
  user, 
  formatDate,
  isLoadingOrders, 
  orderCount, 
  isMenuActive, 
  onViewDetails, 
  onMenuToggle, 
  onPromoteToAdmin, 
  onDeleteUser, 
  colors,
  router
}) {
  return (
    <div className="flex items-center rounded-full border-2 border-gray-300 px-6 py-4 mb-4 hover:shadow-sm transition-shadow relative">
      {/* User name and email */}
      <div className="w-[25%]">
        <div className="flex items-center">
          <UserAvatar user={user} colors={colors} />
          <div>
            <div className="font-medium text-gray-900">{user.username || '-'}</div>
            <div className="text-sm text-gray-500">{user.email || '-'}</div>
          </div>
        </div>
      </div>
      
      {/* Phone number */}
      <div className="w-[15%] text-center text-gray-600">
        {user.phoneNumber || '-'}
      </div>
      
      {/* Joined date */}
      <div className="w-[15%] text-center text-gray-600">
        {formatDate(user.createdAt)}
      </div>

      {/* User role */}
      <div className="w-[13%] text-center">
        <RoleBadge role={user.role} colors={colors} />
      </div>
      
      {/* Order count */}
      <div className="w-[13%] text-center">
        {isLoadingOrders ? (
          <div 
            className="w-5 h-5 mx-auto border-t-2 border-b-2 rounded-full animate-spin" 
            style={{ borderColor: colors.primary }}
          ></div>
        ) : (
          <span className="font-medium" style={{ color: colors.primary }}>
            {orderCount}
          </span>
        )}
      </div>
      
      {/* View Button */}
      <div className="w-[10%] text-center">
      <button
        onClick={() => router.push(`/admin/user-management/${user._id}`)}
        className="text-sm font-medium rounded-full px-5 py-1.5 transition-all"
        style={{ 
          backgroundColor: colors.primary,
          color: colors.white
        }}
      >
        ดู
      </button>
      </div>

      {/* Actions */}
      <div className="w-[10%] text-right">
        {isMenuActive ? (
          <ActionMenu 
            user={user} 
            onPromote={() => onPromoteToAdmin(user._id)}
            onDelete={() => onDeleteUser(user._id)}
            colors={colors}
          />
        ) : (
          <button
            onClick={() => onMenuToggle(user._id)}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Component for user avatar
function UserAvatar({ user, colors }) {
  return (
    <div className="mr-3">
      {user.profilePicture ? (
        <img 
          src={user.profilePicture} 
          alt={user.username} 
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center" 
          style={{ backgroundColor: "#ECEEFE" }}
        >
          <span style={{ color: colors.primary }} className="font-medium text-lg">
            {user.username?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      )}
    </div>
  );
}

// Component for role badge
function RoleBadge({ role, colors }) {
  return (
    <span 
      className="inline-block px-3 py-1 rounded-full text-xs font-medium"
      style={{ 
        backgroundColor: role === 'admin' ? colors.secondary : colors.primary,
        color: role === 'admin' ? colors.gray[800] : colors.white
      }}
    >
      {role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
    </span>
  );
}

// Component for action menu
function ActionMenu({ user, onPromote, onDelete, colors }) {
  return (
    <div className="action-menu-container flex flex-col space-y-1 absolute right-6 bg-white p-2 rounded-lg shadow-md z-10 border-2 border-gray-300">
      {user.role !== 'admin' && (
        <button
          onClick={onPromote}
          className="text-xs font-medium rounded-full px-3 py-1.5 text-left hover:bg-gray-100 transition-all flex items-center"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="m16 7 5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          เพิ่มสิทธิ์
        </button>
      )}
      <button
        onClick={onDelete}
        className="text-xs font-medium rounded-full px-3 py-1.5 text-left hover:bg-gray-100 transition-all flex items-center text-red-600"
      >
        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        </svg>
        ลบผู้ใช้
      </button>
    </div>
  );
}

// Component for empty state
function EmptyState() {
  return (
    <div className="text-center py-8 text-gray-500">
      ไม่พบข้อมูลผู้ใช้งาน
    </div>
  );
}