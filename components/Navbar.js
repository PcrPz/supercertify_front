import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  return (
    <nav className="w-full py-4 px-6 flex items-center justify-between border-b border-gray-200">
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
      
      {/* Navigation Links */}
      <div className="hidden md:flex items-center space-x-8">
        <Link href="/pricing" className="text-gray-700 hover:text-blue-600 transition">
          Pricing Package
        </Link>
        <Link href="/tracking" className="text-gray-700 hover:text-blue-600 transition">
          Tracking Process
        </Link>
        <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition">
          Contact Us
        </Link>
      </div>
      
      {/* Auth Buttons */}
      <div className="flex items-center space-x-4">
        <Link href="/register">
          <button className="bg-yellow-400 text-black font-medium px-5 py-1.5 rounded-full hover:bg-yellow-500 transition">
            Register
          </button>
        </Link>
        <Link href="/login">
          <button className="bg-blue-600 text-white font-medium px-5 py-1.5 rounded-full hover:bg-blue-700 transition">
            Log In
          </button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;