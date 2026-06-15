'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Users, Network, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/clients', label: 'Clients' },
  { href: '/graph', label: 'Graph' },
  { href: '/ask', label: 'Ask MeetMemory' },
  { href: '/use-cases', label: 'Use Cases' },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-5 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
      <nav 
        className="relative pointer-events-auto flex items-center justify-between md:justify-center px-4 md:px-6 py-2 transition-all duration-300"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '999px',
          width: '95%',
          maxWidth: '1200px',
          minHeight: '60px', // Allow growth if needed
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Left: Logo (Desktop absolute, Mobile inline) */}
        <div className="md:absolute md:left-4 md:top-1/2 md:-translate-y-1/2 flex items-center h-full z-10">
          <Link href="/" className="flex items-center group mt-1.5 w-16 h-12" onClick={() => setIsOpen(false)}>
            <img 
              src="/logo.png" 
              alt="MeetMemory Logo" 
              className="h-16 w-auto object-contain transition-transform group-hover:scale-105 pointer-events-none"
              style={{ transform: 'scale(3.0)', transformOrigin: 'left center' }}
            />
          </Link>
        </div>

        {/* Center: Nav Links (Desktop Only) */}
        <div className="hidden md:flex justify-center items-center h-full z-0">
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

        {/* Right: Powered By Badge (Desktop Only) */}
        <div className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 items-center h-full z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#c15f3c]/10 border border-[#c15f3c]/20">
            <div className="h-1.5 w-1.5 rounded-full bg-[#c15f3c] animate-pulse shadow-[0_0_8px_#c15f3c]" />
            <span className="text-[10px] uppercase tracking-widest text-[#c15f3c] font-bold whitespace-nowrap">
              Powered by Hindsight
            </span>
          </div>
        </div>

        {/* Mobile Toggle Button */}
        <div className="md:hidden flex items-center z-10">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-zinc-300 hover:text-white focus:outline-none"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div 
          className="md:hidden relative pointer-events-auto mt-3 w-[95%] rounded-3xl overflow-hidden flex flex-col p-4 gap-2"
          style={{
            background: 'rgba(20, 20, 20, 0.85)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          {navLinks.map(({ href, label }) => {
            const isActive = href === '/' ? pathname === '/' : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                )}
              >
                {label}
              </Link>
            );
          })}
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#c15f3c]/10 border border-[#c15f3c]/20">
              <div className="h-1.5 w-1.5 rounded-full bg-[#c15f3c] animate-pulse shadow-[0_0_8px_#c15f3c]" />
              <span className="text-[10px] uppercase tracking-widest text-[#c15f3c] font-bold whitespace-nowrap">
                Powered by Hindsight
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
