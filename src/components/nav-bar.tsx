'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function NavBar() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`w-full fixed top-0 z-50 transition-all duration-300 h-[30px] flex items-center bg-black/10 backdrop-blur-xl border-b border-white/10"
      <div className="mx-auto max-w-6xl px-10 w-full">
        <div className="flex items-center justify-between">
          <Link href="https://quantumraffle.ai/" className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="Quantum Raffle"
              width={24}
              height={24}
              className=""
            />
            <span className="text-xl font-bold text-white">Quantum Raffle Analytics</span>
          </Link>
          
          <Link 
            href="https://quantumraffle.ai/" 
            className="hidden md:flex items-center justify-center px-6 py-2 rounded-full bg-[#8E34EA]/60 text-white font-medium hover:opacity-90 transition-all duration-500 text-center relative overflow-hidden border border-[#994ee3]"
          >
            <span className="relative z-10">Buy Tickets</span>
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#8E34EA]/40 to-transparent animate-shimmer-slow" />
            </div>
          </Link>
        </div>
      </div>

      {mounted && (
        <style jsx global>{`
          /* Add padding to body to prevent content from being hidden under fixed navbar */
          /* Adjust this padding-top value to match the navbar height */
          body {
            padding-top: ${NAVBAR_HEIGHT}px;
          }
        `}</style>
      )}
    </nav>
  );
} 