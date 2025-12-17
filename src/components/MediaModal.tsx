'use client';

import { useEffect, useState, useCallback } from 'react';
import { MediaItem } from '@/lib/supabase';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaItem[];
  startIndex?: number;
  guestName: string;
}

export default function MediaModal({ 
  isOpen, 
  onClose, 
  media,
  startIndex = 0,
  guestName 
}: MediaModalProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  }, [media.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  }, [media.length]);

  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, goToPrevious, goToNext]);

  if (!isOpen || media.length === 0) return null;

  const currentMedia = media[currentIndex];
  const hasMultiple = media.length > 1;

  return (
    <div 
      className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-[var(--color-tennessee)] transition-colors p-2 z-10"
        aria-label="Close modal"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      {hasMultiple && (
        <div className="absolute top-4 left-4 text-white text-sm bg-gradient-to-r from-[var(--color-tennessee)] to-[var(--color-tennessee-dark)] px-3 py-1 rounded-full shadow-lg">
          {currentIndex + 1} / {media.length}
        </div>
      )}

      {/* Navigation arrows */}
      {hasMultiple && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-[var(--color-tennessee)] transition-colors p-2 bg-black/30 rounded-full hover:bg-black/50"
            aria-label="Previous"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-[var(--color-tennessee)] transition-colors p-2 bg-black/30 rounded-full hover:bg-black/50"
            aria-label="Next"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Main content */}
      <div 
        className="relative max-w-5xl max-h-[85vh] w-full mx-4 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          {currentMedia.type === 'video' ? (
            <video 
              key={currentMedia.url}
              src={currentMedia.url}
              className="w-full max-h-[75vh] object-contain bg-black"
              controls
              autoPlay
              playsInline
            />
          ) : (
            <img 
              key={currentMedia.url}
              src={currentMedia.url} 
              alt={`Memory shared by ${guestName}`}
              className="w-full max-h-[75vh] object-contain"
            />
          )}
          
          {/* Caption */}
          <div className="p-4 text-center border-t border-[var(--color-light-gray)]">
            <p className="text-[var(--color-warm-gray)] text-sm">
              Shared by <span className="font-medium text-[var(--color-tennessee)]">{guestName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-2 rounded-lg backdrop-blur-sm">
          {media.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`w-12 h-12 rounded overflow-hidden transition-all ${
                index === currentIndex 
                  ? 'ring-2 ring-[var(--color-tennessee)] ring-offset-2 ring-offset-black/60' 
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              {item.type === 'video' ? (
                <video src={item.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
