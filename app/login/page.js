'use client'
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // เรียกใช้ API Route เพื่อเข้าสู่ระบบ
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });
      
      console.log('Login successful:', response.data);
      
      // Redirect ไปยัง callback URL หรือ dashboard
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push('/');
        router.refresh()
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Login form section */}
        <div className="w-full md:w-1/2 px-6 md:px-5 py-5 flex flex-col justify-center">
          <div className="max-w-3/4 mx-auto w-full">
            <h1 className="text-6xl font-bold text-gray-800 mb-4">Log In</h1>
            <p className="text-xl text-gray-700 mb-10">Welcome back! Please enter your email and password.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {callbackUrl && (
              <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                Please log in to access the requested page.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
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
              </div>

              <div className="mb-4">
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
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className={`w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-full transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-gray-500">or register with</span>
                </div>
              </div>

              <div className="mt-6 flex space-x-4 justify-center">
                <Link href="/register" className="w-full">
                  <button
                    type="button"
                    className="w-full bg-yellow-400 text-black font-medium py-3 px-4 rounded-full hover:bg-yellow-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={loading}
                  >
                    Sign Up
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Image section */}
        <div className="hidden md:flex md:w-1/2 bg-blue-50 items-center justify-center">
          <div className="relative w-[600px] h-[600px] flex items-center justify-center mx-auto">
            <div className="absolute inset-0 bg-blue-600 rounded-3xl opacity-20"></div>
            <img 
              src="/Group.png" 
              alt="Key illustration" 
              className="w-[500px] h-[500px] object-contain z-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;