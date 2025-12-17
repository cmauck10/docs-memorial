'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="header-gradient py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-tennessee)] to-[var(--color-tennessee-dark)] flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif text-[var(--color-charcoal)] leading-tight">
                Dr. Michael Mauck
              </h1>
              <p className="text-xs text-[var(--color-warm-gray)] uppercase tracking-wider">
                In Loving Memory
              </p>
            </div>
          </div>

          {/* Right: Navigation */}
          <nav className="flex items-center gap-4">
            <Link 
              href="/" 
              className="text-sm text-[var(--color-charcoal)] hover:text-[var(--color-tennessee)] transition-colors font-medium"
            >
              Memorial Wall
            </Link>
            <Link 
              href="/submit" 
              className="btn-primary text-sm py-2 px-4"
            >
              Share a Memory
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
