'use client';

import Image from 'next/image';
import Link from 'next/link';

export function NavBar() {
  return (
    <nav className="w-full top-0 bottom-0 border-b border-white/10 bg-black">
      <div className="mx-auto max-w-6xl px-10 py-4">
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
            className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Buy Tickets
          </Link>
        </div>
      </div>
    </nav>
  );
} 