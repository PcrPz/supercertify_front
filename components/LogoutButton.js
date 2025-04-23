'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '../services/auth';
import { Loader2, LogOut } from 'lucide-react';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      router.push('/login');
      router.refresh() // หรือ router.refresh()
    } catch (error) {
      console.error('Logout failed:', error);
      // อาจเพิ่ม toast หรือ error message
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center space-x-2 text-red-600 hover:text-red-800"
    >
      {loading ? <Loader2 className="animate-spin" /> : <LogOut />}
      <span>{loading ? 'Logging out...' : 'Logout'}</span>
    </button>
  );
}