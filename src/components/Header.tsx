'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-white border-b border-[rgba(255,130,0,0.1)] fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Title */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-tennessee)] to-[var(--color-tennessee-dark)] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-serif text-[var(--color-charcoal)] leading-tight font-medium">
                Dr. Michael Mauck
              </p>
              <p className="text-[10px] text-[var(--color-warm-gray)] uppercase tracking-wider">
                Digital Memorial Wall
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <Link 
              href="/" 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-[var(--color-tennessee-pale)] text-[var(--color-tennessee)]' 
                  : 'text-[var(--color-charcoal)] hover:bg-gray-100'
              }`}
            >
              Memorial Wall
            </Link>
            <Link 
              href="/about" 
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/about') 
                  ? 'bg-[var(--color-tennessee-pale)] text-[var(--color-tennessee)]' 
                  : 'text-[var(--color-charcoal)] hover:bg-gray-100'
              }`}
            >
              About
            </Link>
            <Link 
              href="/submit" 
              className="btn-primary text-sm py-1.5 px-3 ml-2 inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Share a Memory</span>
              <span className="sm:hidden">Share</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
