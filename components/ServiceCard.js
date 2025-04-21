"use client"
import Image from 'next/image';
import { useState } from 'react';

export default function ServiceCard({ imageSrc, title, description }) {
    const [isFlipped, setIsFlipped] = useState(false);
  
    return (
      <div 
        className="relative h-96 w-full perspective-1000 cursor-pointer"
        onMouseEnter={() => setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
      >
        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front side - Image */}
          <div className="absolute w-full h-full bg-white rounded-3xl overflow-hidden backface-hidden border-2 border-black">
            <div className="relative w-full h-full">
              <Image
                src={imageSrc}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
                priority
              />
            </div>
          </div>
          
          {/* Back side - Content */}
          <div className="absolute w-full h-full bg-white rounded-3xl overflow-hidden p-8 rotate-y-180 backface-hidden border-2 border-black">
            <div className="flex flex-col justify-center h-full">
              <h3 className="text-3xl font-medium text-gray-800 mb-4">{title}</h3>
              <p className="text-lg text-gray-600">{description}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }