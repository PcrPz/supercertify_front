'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '../../services/auth';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const router = useRouter();
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      
      try {
        const registerData = {
          username,
          email,
          password,
          role: 'user'
        };
        
        await register(registerData);
        router.push('/');
        router.refresh()
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // เพิ่มฟังก์ชันสำหรับนำทางไปหน้า Login
    const goToLogin = () => {
      router.push('/login');
    };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Registration form section */}
        <div className="w-full md:w-1/2 px-6 md:px-5 py-5 flex flex-col justify-center">
          <div className="max-w-3/4 mx-auto w-full">
            <p className="text-gray-500 uppercase font-medium tracking-wide">START FOR FREE</p>
            <h1 className="text-6xl font-bold text-gray-800 mt-4 mb-6">Create new account<span className="text-yellow-400">.</span></h1>
            
            <p className="text-xl text-gray-700 mb-8">
              Already A Member? 
              <Link href="/login" className="text-blue-600 ml-2 hover:text-blue-800">
                Log In
              </Link>
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-full border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Username"
                  required
                  disabled={loading}
                />
                <div className="absolute right-4 top-3.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>

              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-full border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email"
                  required
                  disabled={loading}
                />
                <div className="absolute right-4 top-3.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                </div>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-full border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Password"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5"
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                    {showPassword ? (
                      <>
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </>
                    ) : (
                      <>
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                        <line x1="2" x2="22" y1="2" y2="22"></line>
                      </>
                    )}
                  </svg>
                </button>
              </div>

              <button
                type="submit"
                className={`w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-full transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-gray-500">or</span>
                </div>
              </div>

              {/* แก้ไขส่วนปุ่ม เปลี่ยนเป็นปุ่มเดียวและนำทางไปหน้า Login */}
              <div className="mt-6">
                <button 
                  type="button"
                  onClick={goToLogin}
                  className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-full bg-yellow-400 hover:bg-yellow-500 text-gray-700 font-medium transition"
                  disabled={loading}
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Image section */}
        <div className="hidden md:flex md:w-1/2 bg-blue-50 items-center justify-center">
          <div className="relative w-[600px] h-[600px] flex items-center justify-center mx-auto">
            <div className="absolute inset-0 bg-blue-600 rounded-3xl opacity-20"></div>
            <img 
              src="/screen-share.png" 
              alt="Computer illustration" 
              className="w-[500px] h-[500px] object-contain z-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;