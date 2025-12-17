'use client';

import Link from 'next/link';
import SubmitForm from '@/components/SubmitForm';

export default function SubmitPage() {
  return (
    <main className="min-h-screen py-8 px-4">
      {/* Back Link */}
      <div className="max-w-2xl mx-auto mb-6">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-[var(--color-warm-gray)] hover:text-[var(--color-tennessee)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Memorial Wall
        </Link>
      </div>

      {/* Form Container */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[rgba(255,130,0,0.1)]">
          {/* Header */}
          <div className="relative py-8 px-8 text-center overflow-hidden bg-gradient-to-br from-[var(--color-tennessee-pale)] to-white">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--color-tennessee)] opacity-5 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[var(--color-tennessee)] opacity-5 rounded-full blur-2xl" />
            </div>
            
            <div className="relative z-10">
              {/* Icon */}
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--color-tennessee)] to-[var(--color-tennessee-dark)] flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-serif text-[var(--color-charcoal)] mb-2">
                Share a Memory
              </h1>
              <p className="text-[var(--color-warm-gray)] max-w-md mx-auto text-sm">
                Honor Dr. Michael Mauck by sharing your cherished memories, stories, or words of remembrance.
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-6 md:p-8">
            <SubmitForm />
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-center text-xs text-[var(--color-warm-gray)] mt-4">
          Your submission will be visible on the memorial wall.
          You can edit your post from this device at any time.
        </p>
      </div>
    </main>
  );
}
