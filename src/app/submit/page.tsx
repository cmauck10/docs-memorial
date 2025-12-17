'use client';

import Link from 'next/link';
import SubmitForm from '@/components/SubmitForm';

export default function SubmitPage() {
  return (
    <main className="min-h-screen py-12 px-4">
      {/* Back Link */}
      <div className="max-w-2xl mx-auto mb-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-[var(--color-warm-gray)] hover:text-[var(--color-charcoal)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Memorial Wall
        </Link>
      </div>

      {/* Form Container */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="relative py-12 px-8 text-center overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-32 h-32 bg-[var(--color-sage)] opacity-5 rounded-full blur-2xl" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-[var(--color-dusty-rose)] opacity-5 rounded-full blur-2xl" />
            </div>
            
            <div className="relative z-10">
              {/* Decorative flourish */}
              <div className="flex items-center justify-center gap-3 mb-4 opacity-60">
                <span className="block w-12 h-px bg-[var(--color-gold)]" />
                <svg className="w-5 h-5 text-[var(--color-gold)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="block w-12 h-px bg-[var(--color-gold)]" />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-serif text-[var(--color-charcoal)] mb-3">
                Share a Memory
              </h1>
              <p className="text-[var(--color-warm-gray)] max-w-md mx-auto">
                Honor Dr. Michael Mauck by sharing your cherished memories, stories, or words of remembrance.
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8 pt-0">
            <SubmitForm />
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-center text-sm text-[var(--color-warm-gray)] mt-6">
          Your submission will be visible on the memorial wall after posting.
          <br />
          You can edit your post from this device at any time.
        </p>
      </div>
    </main>
  );
}

