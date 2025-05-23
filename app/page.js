import Image from "next/image";
import ServiceSection from "@/components/ServiceSection";
import ThreeSteps from "@/components/ThreeSteps";
import AboutService from "@/components/AboutService";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Left Side Content */}
          <div className="w-full md:w-1/2 mb-12 md:mb-0">
            <div className="flex items-center mb-6">
              <div className="bg-yellow-400 rounded-full p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-800 font-medium">Background Check By <span className="text-indigo-600 font-bold">SuperHR</span></p>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              All About <br />
              Background <br />
              Check
            </h1>
            
            <Link 
              href="/background-check" 
              className="inline-block mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105"
            >
              เริ่มต้นการใช้งาน
            </Link>
          </div>
          
          {/* Right Side Image */}
          <div className="w-full md:w-1/2">
            <div className="relative">
              <Image 
                src="/home.svg" 
                alt="Background Check Illustration"
                width={600}
                height={500}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </main>
      <AboutService/>
      {/*Service Section */}
      <ServiceSection />
      <ThreeSteps/>
    </div>
  );
 }