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
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full flex items-center space-x-3 text-left rounded-lg text-[#FF3737] hover:bg-gray-100 focus:outline-none transition-colors duration-200"
    >
      <div className="w-5 h-5 flex items-center justify-center">
        {loading ? (
          <Loader2 className="animate-spin text-gray-400 w-5 h-5" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF3737]">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" x2="9" y1="12" y2="12"/>
          </svg>
        )}
      </div>
      <span className={`${loading ? 'text-gray-400' : 'text-[#FF3737]'}`}>
        {loading ? 'Logging out...' : 'Logout'}
      </span>
    </button>
  );
}