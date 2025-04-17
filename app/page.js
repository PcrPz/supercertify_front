import Image from "next/image";
import ServiceSection from "@/components/ServiceSection";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    
    <div className="min-h-screen bg-white">
    <Navbar/>
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
          
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-full shadow-md transition duration-300">
            Get Started
          </button>
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

    {/* About Section */}
    <section className="bg-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[20px] font-bold text-gray-700 mb-6">
              At <span className="text-indigo-600 font-bold">SuperCertify</span>, we specialize in delivering thorough
              and reliable background check services to help you make informed decisions with confidence. Our
              tailored solutions cover a wide range of verification categories, ensuring that you have a complete and
              accurate picture of the individuals you are evaluating.
            </p>
          </div>
          
          <div className="p-8 rounded-lg text-center">
            <h2 className="text-[35px] font-bold text-gray-800 mb-4 text-center inline-flex items-center justify-center">
              Looking for <br />
              Background Check <br />
              details
              <div className="inline-block bg-yellow-400 rounded-full p-3 ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </h2>
          </div>
        </div>
      </div>
    </section>
    {/*Service Section */}
    <ServiceSection />
  </div>
  );
}
