'use client';

import { useState, useEffect, memo, useCallback } from 'react';
import { Post } from '@/lib/supabase';
import { getGuestToken } from '@/lib/guest-token';
import { LazyMedia } from './LazyMedia';
import dynamic from 'next/dynamic';

// Lazy load the modal - it's not needed until user clicks
const PostModal = dynamic(() => import('./PostModal'), {
  ssr: false,
  loading: () => null
});

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  isAdmin?: boolean;
  onHide?: (postId: string, isHidden: boolean) => void;
  onDelete?: (postId: string) => void;
  onPin?: (postId: string, isPinned: boolean) => void;
  animationDelay?: number;
  priority?: boolean; // For above-the-fold cards
}

function PostCardComponent({ 
  post, 
  onEdit, 
  isAdmin = false,
  onHide,
  onDelete,
  onPin,
  animationDelay = 0,
  priority = false
}: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const token = getGuestToken();
    setCanEdit(token === post.guest_token);
  }, [post.guest_token]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  const media = post.media || [];
  const hasMedia = media.length > 0;
  const firstMedia = media[0];

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't expand if clicking on admin controls or edit button
    if ((e.target as HTMLElement).closest('button')) return;
    setIsExpanded(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(post);
  }, [onEdit, post]);

  const handleHide = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onHide?.(post.id, !post.is_hidden);
  }, [onHide, post.id, post.is_hidden]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this post? This cannot be undone.')) {
      onDelete?.(post.id);
    }
  }, [onDelete, post.id]);

  const handlePin = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPin?.(post.id, !post.is_pinned);
  }, [onPin, post.id, post.is_pinned]);

  return (
    <>
      <article 
        className={`post-card bg-white rounded-xl overflow-hidden shadow-sm opacity-0 animate-fade-in cursor-pointer ${post.is_pinned ? 'ring-2 ring-[var(--color-tennessee)]' : ''}`}
        style={{ animationDelay: `${animationDelay}s` }}
        onClick={handleCardClick}
      >
        {/* Media Section */}
        {hasMedia && (
          <div className="relative">
            {/* Main media display */}
            {media.length === 1 ? (
              // Single media
              <div className="aspect-[4/3] relative group">
                <LazyMedia
                  src={firstMedia.url}
                  type={firstMedia.type}
                  alt={`Memory shared by ${post.guest_name}`}
                  className="w-full h-full"
                  priority={priority}
                />
                <MediaOverlay type={firstMedia.type} />
              </div>
            ) : media.length === 2 ? (
              // Two media items side by side
              <div className="grid grid-cols-2 gap-0.5">
                {media.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="aspect-square relative group">
                    <LazyMedia
                      src={item.url}
                      type={item.type}
                      className="w-full h-full"
                      priority={priority && idx === 0}
                    />
                    <MediaOverlay type={item.type} />
                  </div>
                ))}
              </div>
            ) : (
              // Three or more - 2x2 grid layout showing 4 images
              <div className="grid grid-cols-2 gap-0.5">
                {media.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="aspect-square relative group">
                    <LazyMedia
                      src={item.url}
                      type={item.type}
                      className="w-full h-full"
                      priority={priority && idx === 0}
                    />
                    <MediaOverlay type={item.type} />
                    {/* Show +N overlay on last visible item if there are more */}
                    {idx === 3 && media.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xl font-semibold">
                          +{media.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Media count badge */}
            {media.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-gradient-to-r from-[var(--color-tennessee)] to-[var(--color-tennessee-dark)] text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 shadow-md">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {media.length}
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="p-4">
          {/* Pinned indicator */}
          {post.is_pinned && (
            <div className="flex items-center gap-1 text-[var(--color-tennessee)] text-xs font-medium mb-2">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
              </svg>
              Pinned
            </div>
          )}
          
          {/* Header with name and date */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-serif text-lg text-[var(--color-charcoal)] font-medium leading-tight">
                {post.guest_name}
              </h3>
              <time className="text-xs text-[var(--color-warm-gray)]">
                {formatDate(post.created_at)}
              </time>
            </div>
            
            {/* Edit button for guest */}
            {canEdit && onEdit && !isAdmin && (
              <button
                onClick={handleEdit}
                className="text-[var(--color-tennessee)] hover:text-[var(--color-tennessee-dark)] transition-colors p-1"
                title="Edit your post"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>

          {/* Message */}
          <p className="text-sm text-[var(--color-charcoal)] leading-relaxed whitespace-pre-wrap line-clamp-4">
            {post.message}
          </p>

          {/* Read more hint */}
          {post.message.length > 150 && (
            <p className="text-xs text-[var(--color-tennessee)] mt-2 font-medium">
              Click to read more...
            </p>
          )}

          {/* Admin controls */}
          {isAdmin && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePin}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  post.is_pinned 
                    ? 'bg-[var(--color-tennessee)] text-white hover:bg-[var(--color-tennessee-dark)]' 
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                {post.is_pinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={handleHide}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  post.is_hidden 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                {post.is_hidden ? 'Show' : 'Hide'}
              </button>
              <button
                onClick={handleEdit}
                className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="text-xs px-2 py-1 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                Delete
              </button>
              {post.is_hidden && (
                <span className="text-xs text-[var(--color-warm-gray)] ml-auto">
                  Hidden
                </span>
              )}
            </div>
          )}
        </div>
      </article>

      {/* Expanded Post Modal - Only rendered when needed */}
      {isExpanded && (
        <PostModal
          isOpen={isExpanded}
          onClose={handleClose}
          post={post}
        />
      )}
    </>
  );
}

// Memoize the entire component to prevent unnecessary re-renders
export default memo(PostCardComponent);

// Hover overlay component - memoized
const MediaOverlay = memo(function MediaOverlay({ type }: { type: 'image' | 'video' }) {
  return (
    <>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
      {type === 'video' && (
        <div className="absolute bottom-2 left-2 bg-gradient-to-r from-[var(--color-tennessee)] to-[var(--color-tennessee-dark)] text-white px-2 py-0.5 rounded text-xs flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Video
        </div>
      )}
    </>
  );
});
