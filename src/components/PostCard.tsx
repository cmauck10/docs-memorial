'use client';

import { useState, useEffect } from 'react';
import { Post, MediaItem } from '@/lib/supabase';
import { getGuestToken } from '@/lib/guest-token';
import MediaModal from './MediaModal';

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  isAdmin?: boolean;
  onHide?: (postId: string, isHidden: boolean) => void;
  onDelete?: (postId: string) => void;
  animationDelay?: number;
}

export default function PostCard({ 
  post, 
  onEdit, 
  isAdmin = false,
  onHide,
  onDelete,
  animationDelay = 0 
}: PostCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const token = getGuestToken();
    setCanEdit(token === post.guest_token);
  }, [post.guest_token]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const media = post.media || [];
  const hasMedia = media.length > 0;
  const firstMedia = media[0];
  const additionalCount = media.length - 1;

  const openModal = (index: number = 0) => {
    setModalStartIndex(index);
    setIsModalOpen(true);
  };

  return (
    <>
      <article 
        className="post-card bg-white rounded-2xl overflow-hidden shadow-sm opacity-0 animate-fade-in"
        style={{ animationDelay: `${animationDelay}s` }}
      >
        {/* Media Section */}
        {hasMedia && (
          <div className="relative">
            {/* Main media display */}
            {media.length === 1 ? (
              // Single media
              <div 
                className="media-container relative cursor-pointer group"
                onClick={() => openModal(0)}
              >
                {firstMedia.type === 'video' ? (
                  <video 
                    src={firstMedia.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <img 
                    src={firstMedia.url} 
                    alt={`Memory shared by ${post.guest_name}`}
                    className="w-full h-full object-cover"
                  />
                )}
                <MediaOverlay type={firstMedia.type} />
              </div>
            ) : media.length === 2 ? (
              // Two media items side by side
              <div className="grid grid-cols-2 gap-0.5">
                {media.slice(0, 2).map((item, idx) => (
                  <div 
                    key={idx}
                    className="aspect-square relative cursor-pointer group"
                    onClick={() => openModal(idx)}
                  >
                    {item.type === 'video' ? (
                      <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    )}
                    <MediaOverlay type={item.type} />
                  </div>
                ))}
              </div>
            ) : (
              // Three or more - grid layout
              <div className="grid grid-cols-2 gap-0.5">
                <div 
                  className="row-span-2 relative cursor-pointer group"
                  onClick={() => openModal(0)}
                >
                  <div className="aspect-[3/4] h-full">
                    {firstMedia.type === 'video' ? (
                      <video src={firstMedia.url} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={firstMedia.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <MediaOverlay type={firstMedia.type} />
                </div>
                <div className="flex flex-col gap-0.5">
                  {media.slice(1, 3).map((item, idx) => (
                    <div 
                      key={idx}
                      className="aspect-square relative cursor-pointer group"
                      onClick={() => openModal(idx + 1)}
                    >
                      {item.type === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      )}
                      <MediaOverlay type={item.type} />
                      {/* Show +N overlay on last visible item if there are more */}
                      {idx === 1 && media.length > 3 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-2xl font-semibold">
                            +{media.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media count badge */}
            {media.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {media.length}
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="p-6">
          {/* Header with name and date */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-serif text-xl text-[var(--color-charcoal)] font-medium">
                {post.guest_name}
              </h3>
              <time className="text-sm text-[var(--color-warm-gray)]">
                {formatDate(post.created_at)}
              </time>
            </div>
            
            {/* Edit button for guest */}
            {canEdit && onEdit && !isAdmin && (
              <button
                onClick={() => onEdit(post)}
                className="text-[var(--color-sage)] hover:text-[var(--color-charcoal)] transition-colors p-2"
                title="Edit your post"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>

          {/* Message */}
          <p className="text-[var(--color-charcoal)] leading-relaxed whitespace-pre-wrap">
            {post.message}
          </p>

          {/* Admin controls */}
          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
              <button
                onClick={() => onHide?.(post.id, !post.is_hidden)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  post.is_hidden 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                {post.is_hidden ? 'Show' : 'Hide'}
              </button>
              <button
                onClick={() => onEdit?.(post)}
                className="text-sm px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
                    onDelete?.(post.id);
                  }
                }}
                className="text-sm px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                Delete
              </button>
              {post.is_hidden && (
                <span className="text-xs text-[var(--color-warm-gray)] ml-auto">
                  Hidden from public
                </span>
              )}
            </div>
          )}
        </div>
      </article>

      {/* Media Modal */}
      {hasMedia && (
        <MediaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          media={media}
          startIndex={modalStartIndex}
          guestName={post.guest_name}
        />
      )}
    </>
  );
}

// Hover overlay component
function MediaOverlay({ type }: { type: 'image' | 'video' }) {
  return (
    <>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
      {type === 'video' && (
        <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Video
        </div>
      )}
    </>
  );
}
