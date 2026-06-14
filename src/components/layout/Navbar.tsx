'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Users, Network } from 'lucide-react';
import { cn } from '@/lib/utils';


const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/clients', label: 'Clients' },
  { href: '/graph', label: 'Graph' },
  { href: '/ask', label: 'Ask MeetMemory' },
  { href: '/use-cases', label: 'Use Cases' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav 
        className="relative pointer-events-auto flex items-center justify-center px-6 py-2"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '999px',
          width: '95%',
          maxWidth: '1200px',
          height: '60px', // Force a compressed vertical height
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Left: Logo (Absolutely positioned for exact leftmost pinning) */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center h-full z-10">
          <Link href="/" className="flex items-center group mt-1.5">
            <img 
              src="/logo.png" 
              alt="MeetMemory Logo" 
              className="h-16 w-auto object-contain transition-transform hover:scale-105"
              style={{ transform: 'scale(3.0)', transformOrigin: 'left center' }}
            />
          </Link>
        </div>

        {/* Center: Nav Links */}
        <div className="flex justify-center items-center h-full z-0">
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-full border border-white/5">
            {navLinks.map(({ href, label }) => {
              const isActive = href === '/' ? pathname === '/' : pathname?.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap',
                    isActive
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Powered By Badge (Absolutely positioned for rightmost pinning) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center h-full z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#c15f3c]/10 border border-[#c15f3c]/20">
            <div className="h-1.5 w-1.5 rounded-full bg-[#c15f3c] animate-pulse shadow-[0_0_8px_#c15f3c]" />
            <span className="text-[10px] uppercase tracking-widest text-[#c15f3c] font-bold whitespace-nowrap">
              Powered by Hindsight
            </span>
          </div>
        </div>
      </nav>
    </div>
  );
}
