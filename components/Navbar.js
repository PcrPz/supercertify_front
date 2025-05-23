"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown, LayoutDashboard, UserCircle, Bell, LogOut, Settings, Users, CreditCard, Shield, Gift, Percent } from 'lucide-react';
import LogoutButton from './LogoutButton';

// User Dropdown Component
const UserDropdown = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
  const isAdmin = user?.role === 'admin';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors duration-200"
      >
        <div className={`w-8 h-8 rounded-full ${isAdmin ? 'bg-red-500' : 'bg-blue-500'} flex items-center justify-center text-white font-semibold`}>
          {user.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <span className="text-gray-700 font-medium">{user.username}</span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Triangle pointer */}
          <div className="absolute -top-2 right-4 w-0 h-0 
            border-l-8 border-l-transparent
            border-b-8 border-b-white
            border-r-8 border-r-transparent
            shadow-md"></div>
          
          {/* User Info Header */}
          <div className="flex items-center p-4 border-b border-gray-100">
            <div className={`w-12 h-12 rounded-full ${isAdmin ? 'bg-red-500' : 'bg-blue-500'} flex items-center justify-center text-white font-bold mr-3`}>
              {user.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user.username}</p>
              {isAdmin && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Admin</span>
              )}
            </div>
          </div>
          
          {/* Dropdown Menu Items - แสดงเมนูต่างกันระหว่าง User และ Admin */}
          <div className="py-2">
            {isAdmin ? (
              // เมนูสำหรับ Admin
              <>
                <Link 
                  href="/admin/dashboard" 
                  className="flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5 mr-3 text-red-500" />
                  Admin Dashboard
                </Link>
                <Link 
                  href="/admin/users" 
                  className="flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <Users className="w-5 h-5 mr-3 text-purple-500" />
                  User Management
                </Link>
                <Link 
                  href="/admin/coupon-management" 
                  className="flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <Percent className="w-5 h-5 mr-3 text-[#444DDA]" />
                  Coupon Management
                </Link>
                <Link 
                  href="/admin/payments" 
                  className="flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <CreditCard className="w-5 h-5 mr-3 text-green-500" />
                  Payment Management
                </Link>
                <Link 
                  href="/admin/settings" 
                  className="flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="w-5 h-5 mr-3 text-orange-500" />
                  System Settings
                </Link>
              </>
            ) : (
              // เมนูสำหรับ User ทั่วไป
              <>
                <Link 
                  href="/dashboard" 
                  className="flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5 mr-3 text-blue-500" />
                  Dashboard
                </Link>
                <Link 
                  href="/edit-profile" 
                  className="flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <UserCircle className="w-5 h-5 mr-3 text-green-500" />
                  Edit Profile
                </Link>
                <Link 
                  href="/coupon" 
                  className="flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <Gift className="w-5 h-5 mr-3 text-[#444DDA]" />
                  My Coupons
                </Link>
                <Link 
                  href="/notifications" 
                  className="flex items-center px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <Bell className="w-5 h-5 mr-3 text-purple-500" />
                  Notifications
                </Link>
              </>
            )}
          </div>
          
          {/* Logout Section */}
          <div className="border-t border-gray-100 px-4 py-3">
            <LogoutButton className="w-full flex items-center text-red-600 hover:text-red-800" />
          </div>
        </div>
      )}
    </div>
  );
};

export default function Navbar({ user, activePath }) {
  // ฟังก์ชันตรวจสอบ path ที่ active
  const isActiveLink = (path) => {
    return activePath.startsWith(path);
  };

  // เช็คว่าเป็น admin หรือไม่
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center">
              <Image
                src="/LogoSC.png"
                alt="SuperCertify Logo"
                width={220}
                height={50}
                className="cursor-pointer"
              />
            </div>
          </Link>
          
          {/* Desktop Menu - แสดงเมนูหลักตามสิทธิ์ */}
          <div className="flex space-x-8 relative">
            {isAdmin ? (
              // เมนูหลักสำหรับ Admin (ถ้าต้องการแสดงเมนูเฉพาะ)
              <>
                <Link 
                  href="/admin/dashboard" 
                  className={`text-gray-700 hover:text-red-600 relative 
                    ${isActiveLink('/admin/dashboard') 
                      ? 'text-red-600 font-semibold' 
                      : ''}`}
                >
                  Dashboard
                  {isActiveLink('/admin/dashboard') && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-red-600"></span>
                  )}
                </Link>
                <Link 
                  href="/admin/orders" 
                  className={`text-gray-700 hover:text-red-600 relative 
                    ${isActiveLink('/admin/orders') 
                      ? 'text-red-600 font-semibold' 
                      : ''}`}
                >
                  Orders
                  {isActiveLink('/admin/orders') && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-red-600"></span>
                  )}
                </Link>
                <Link 
                  href="/admin/coupon-management" 
                  className={`text-gray-700 hover:text-[#444DDA] relative 
                    ${isActiveLink('/admin/coupon-management') 
                      ? 'text-[#444DDA] font-semibold' 
                      : ''}`}
                >
                  Coupons
                  {isActiveLink('/admin/coupon-management') && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#444DDA]"></span>
                  )}
                </Link>
                <Link 
                  href="/admin/payments" 
                  className={`text-gray-700 hover:text-red-600 relative 
                    ${isActiveLink('/admin/payments') 
                      ? 'text-red-600 font-semibold' 
                      : ''}`}
                >
                  Payments
                  {isActiveLink('/admin/payments') && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-red-600"></span>
                  )}
                </Link>
              </>
            ) : (
              // เมนูหลักสำหรับ User ทั่วไป
              <>
                <Link 
                  href="/background-check" 
                  className={`text-gray-700 hover:text-blue-600 relative 
                    ${isActiveLink('/background-check') 
                      ? 'text-blue-600 font-semibold' 
                      : ''}`}
                >
                  Background Check
                  {isActiveLink('/background-check') && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-600"></span>
                  )}
                </Link>
                <Link 
                  href="/tracking-process" 
                  className={`text-gray-700 hover:text-blue-600 relative 
                    ${isActiveLink('/tracking-process') 
                      ? 'text-blue-600 font-semibold' 
                      : ''}`}
                >
                  Tracking Process
                  {isActiveLink('/tracking-process') && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-600"></span>
                  )}
                </Link>
                <Link 
                  href="/faqs" 
                  className={`text-gray-700 hover:text-blue-600 relative 
                    ${isActiveLink('/faqs') 
                      ? 'text-blue-600 font-semibold' 
                      : ''}`}
                >
                  FAQs
                  {isActiveLink('/faqs') && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-600"></span>
                  )}
                </Link>
              </>
            )}
          </div>
          
          {/* Authentication/User Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <UserDropdown user={user} />
            ) : (
              <>
                <Link href="/register" className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-medium py-2 px-4 rounded-full">
                  Register
                </Link>
                <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-full">
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};