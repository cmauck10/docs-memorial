'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="relative py-16 px-4 text-center overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-[var(--color-dusty-rose)] opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--color-sage)] opacity-10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Decorative flourish */}
        <div className="flex items-center justify-center gap-4 mb-6 opacity-60">
          <span className="block w-16 h-px bg-[var(--color-gold)]" />
          <svg className="w-6 h-6 text-[var(--color-gold)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          <span className="block w-16 h-px bg-[var(--color-gold)]" />
        </div>
        
        <p className="text-[var(--color-warm-gray)] text-sm uppercase tracking-[0.3em] mb-4 font-medium">
          In Loving Memory
        </p>
        
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[var(--color-charcoal)] mb-4 tracking-tight">
          Dr. Michael Mauck
        </h1>
        
        <div className="decorative-line w-32 mx-auto my-6" />
        
        <p className="text-lg md:text-xl text-[var(--color-warm-gray)] max-w-2xl mx-auto leading-relaxed font-serif italic">
          &ldquo;A life beautifully lived deserves to be beautifully remembered.&rdquo;
        </p>
        
        <nav className="mt-10 flex items-center justify-center gap-6">
          <Link 
            href="/" 
            className="text-[var(--color-charcoal)] hover:text-[var(--color-sage)] transition-colors font-medium"
          >
            Memorial Wall
          </Link>
          <span className="text-[var(--color-warm-gray)]">•</span>
          <Link 
            href="/submit" 
            className="btn-primary inline-block"
          >
            Share a Memory
          </Link>
        </nav>
      </div>
    </header>
  );
}

