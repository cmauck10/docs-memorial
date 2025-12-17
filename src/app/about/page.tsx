'use client';

import Link from 'next/link';
import Header from '@/components/Header';

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      {/* Content */}
      <article className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-[rgba(255,130,0,0.1)]">
          {/* Header Section */}
          <div className="relative py-10 px-8 text-center bg-gradient-to-br from-[var(--color-tennessee-pale)] to-white">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-[var(--color-tennessee)] opacity-5 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[var(--color-tennessee)] opacity-5 rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--color-tennessee)] to-[var(--color-tennessee-dark)] flex items-center justify-center shadow-xl orange-glow">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-serif text-[var(--color-charcoal)] mb-2">
                About Dr. Michael Mauck
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[var(--color-tennessee)] to-transparent mx-auto rounded-full" />
            </div>
          </div>

          {/* Bio Content */}
          <div className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none text-[var(--color-charcoal)]">
              <p className="text-lg leading-relaxed mb-6">
                Dr. Michael Mauck, a beloved husband, father, and highly respected oral and maxillofacial surgeon, passed away peacefully, surrounded by family. With more than three decades of service to the South Florida community, he earned a reputation for integrity, compassion, and surgical excellence.
              </p>

              <p className="leading-relaxed mb-6">
                Originally from Radford, Virginia, Dr. Mauck excelled early in both academics and athletics, earning his DDS from the Medical College of Virginia. He then completed his oral surgery residency and advanced anesthesia training at the prestigious Jackson Memorial Hospital in Miami, where he met his wife Sherri.
              </p>

              <div className="my-8 p-6 bg-gradient-to-r from-[var(--color-tennessee-pale)] to-white rounded-xl border-l-4 border-[var(--color-tennessee)]">
                <p className="leading-relaxed text-[var(--color-charcoal)] mb-0">
                  Before his medical career, he distinguished himself as an <strong className="text-[var(--color-tennessee)]">All-SEC free safety for the University of Tennessee Volunteers</strong>. The discipline, resilience, and teamwork he developed on the football field remained hallmarks of his life and work, even inspiring the orange-and-white spirit that adorned his practice.
                </p>
              </div>

              <p className="leading-relaxed mb-6">
                Beyond his professional accomplishments, Dr. Mauck was defined by his compassionate generosity and selflessness. He gave freely of his time, care, and resources, leaving a lasting impact on his community and all who knew him.
              </p>

              <p className="leading-relaxed mb-0">
                He is survived by his devoted wife, Sherri, and his two sons, Christopher and Matthew, who have followed in his footsteps—both excelling in football and earning college degrees from MIT and University of Tennessee, respectively—carrying forward his legacy of integrity, strength, and generosity.
              </p>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="px-8 pb-8 text-center">
            <Link 
              href="/submit"
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Share Your Memory of Dr. Mauck
            </Link>
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="py-4 border-t border-[var(--color-light-gray)]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[var(--color-warm-gray)] text-sm">
            In loving memory of <span className="text-[var(--color-tennessee)] font-medium">Dr. Michael Mauck</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
