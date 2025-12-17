'use client';

import { useEffect } from 'react';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video' | null;
  guestName: string;
}

export default function MediaModal({ 
  isOpen, 
  onClose, 
  mediaUrl, 
  mediaType, 
  guestName 
}: MediaModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-5xl max-h-[90vh] w-full animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-[var(--color-dusty-rose)] transition-colors p-2"
          aria-label="Close modal"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Media content */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          {mediaType === 'video' ? (
            <video 
              src={mediaUrl}
              className="w-full max-h-[80vh] object-contain bg-black"
              controls
              autoPlay
              playsInline
            />
          ) : (
            <img 
              src={mediaUrl} 
              alt={`Memory shared by ${guestName}`}
              className="w-full max-h-[80vh] object-contain"
            />
          )}
          
          {/* Caption */}
          <div className="p-4 text-center">
            <p className="text-[var(--color-warm-gray)] text-sm">
              Shared by <span className="font-medium text-[var(--color-charcoal)]">{guestName}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

