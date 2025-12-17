'use client';

import { useEffect, useState } from 'react';
import { Post, MediaItem } from '@/lib/supabase';
import MediaModal from './MediaModal';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

export default function PostModal({ isOpen, onClose, post }: PostModalProps) {
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaStartIndex, setMediaStartIndex] = useState(0);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mediaModalOpen) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, mediaModalOpen]);

  if (!isOpen) return null;

  const media = post.media || [];
  const hasMedia = media.length > 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const openMediaModal = (index: number) => {
    setMediaStartIndex(index);
    setMediaModalOpen(true);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fade-in-scale flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-[var(--color-charcoal)] p-2 rounded-full shadow-md transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1">
            {/* Media Row */}
            {hasMedia && (
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {media.map((item, index) => (
                    <div 
                      key={index}
                      className="flex-shrink-0 w-40 h-40 md:w-48 md:h-48 rounded-xl overflow-hidden cursor-pointer group relative"
                      onClick={() => openMediaModal(index)}
                    >
                      {item.type === 'video' ? (
                        <video 
                          src={item.url} 
                          className="w-full h-full object-cover"
                          muted 
                          playsInline 
                        />
                      ) : (
                        <img 
                          src={item.url} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                          <svg className="w-5 h-5 text-[var(--color-charcoal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                      {/* Video badge */}
                      {item.type === 'video' && (
                        <div className="absolute bottom-2 left-2 bg-gradient-to-r from-[var(--color-tennessee)] to-[var(--color-tennessee-dark)] text-white px-2 py-0.5 rounded text-xs flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          Video
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {media.length > 1 && (
                  <p className="text-xs text-[var(--color-warm-gray)] mt-2 text-center">
                    {media.length} photos/videos • Scroll to see more • Click to enlarge
                  </p>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-serif text-[var(--color-charcoal)] mb-1">
                  {post.guest_name}
                </h2>
                <time className="text-sm text-[var(--color-warm-gray)]">
                  {formatDate(post.created_at)}
                </time>
              </div>

              {/* Divider */}
              <div className="w-16 h-1 bg-gradient-to-r from-[var(--color-tennessee)] to-transparent rounded-full mb-6" />

              {/* Message */}
              <div className="prose prose-lg max-w-none">
                <p className="text-[var(--color-charcoal)] leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                  {post.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media fullscreen modal */}
      {hasMedia && (
        <MediaModal
          isOpen={mediaModalOpen}
          onClose={() => setMediaModalOpen(false)}
          media={media}
          startIndex={mediaStartIndex}
          guestName={post.guest_name}
        />
      )}
    </>
  );
}

