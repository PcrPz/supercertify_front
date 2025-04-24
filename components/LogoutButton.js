'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '../services/auth';
import { Loader2 } from 'lucide-react';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      router.push('/login');
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex items-center space-x-3">
      <div className="w-5 h-5">
        {loading ? (
          <Loader2 className="animate-spin text-gray-400 w-5 h-5" />
        ) : (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#FF3737" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" x2="9" y1="12" y2="12"/>
          </svg>
        )}
      </div>
      <button
        onClick={handleLogout}
        disabled={loading}
        className="text-[#FF3737] hover:text-red-600 focus:outline-none transition-colors duration-200"
      >
        {loading ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}