'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (has user_id in localStorage)
    const userId = localStorage.getItem('user_id');
    
    if (userId) {
      router.push('/discover');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-center items-center overflow-hidden bg-black no-overscroll">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/backgrounds/newBg.jpeg"
          alt="Noida skyscrapers view"
          fill
          sizes="100vw"
          className="object-cover opacity-60 mix-blend-screen"
          priority
        />
        {/* Dark gradients to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 pointer-events-none" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-6xl px-6 flex flex-col items-center justify-center text-center">
        
        {/* Logo Section */}
        <div className="mb-0 md:mb-4 flex flex-col items-center animate-fade-in-up">
          <div className="relative flex flex-col items-center">
            <Image
              src="/images/logo/Transparent.png"
              alt="RealtyPals Logo"
              width={350}
              height={140}
              className="object-contain drop-shadow-2xl opacity-90 transition-transform duration-700 hover:scale-105"
              priority
            />
          </div>
        </div>

        {/* Hero Text */}
        <h2 
          className="text-3xl md:text-5xl lg:text-[56px] leading-[1.2] md:leading-[1.15] text-white font-medium max-w-4xl tracking-tight drop-shadow-2xl animate-fade-in-up transform transition-all duration-700 hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
          style={{ animationDelay: '0.2s' }}
        >
          Intelligence layer for smarter property decisions in Noida
        </h2>

        {/* Call to Action Box */}
        <div 
          className="mt-[60px] w-full flex justify-center animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              // Create a seamless mock-login and push straight to discover
              const phoneInput = e.currentTarget.elements.namedItem('phone') as HTMLInputElement;
              const phone = phoneInput.value;
              localStorage.setItem('user_id', `user_${phone}_${Date.now()}`);
              router.push('/discover'); 
            }}
            className="flex items-center w-full max-w-[540px] bg-white p-1.5 md:p-2 rounded-full shadow-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] focus-within:shadow-[0_0_30px_rgba(255,255,255,0.3)] touch-target-min"
          >
            {/* Country Code */}
            <div className="flex items-center justify-center pl-5 md:pl-7 pr-3 md:pr-4 border-r border-gray-200 h-8 md:h-10 mt-0.5">
              <span className="text-gray-600 font-medium text-sm md:text-base whitespace-nowrap">+91</span>
            </div>
            
            {/* Input Field */}
            <input 
              name="phone"
              type="tel" 
              placeholder="Add your phone no"
              required
              title="Enter a valid phone number"
              className="flex-1 min-w-0 bg-transparent px-4 md:px-5 text-gray-900 placeholder:text-gray-500 font-medium text-sm md:text-base focus:outline-none h-12 md:h-14 touch-target-min"
              onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); }}
            />
            
            {/* Waitlist Button */}
            <button 
              type="submit"
              className="bg-black hover:bg-[#1a1a1a] text-white px-7 md:px-10 h-12 md:h-14 rounded-full font-semibold transition-all duration-200 active:scale-95 text-sm md:text-base touch-target-min whitespace-nowrap shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              Start Discovery
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
