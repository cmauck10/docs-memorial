'use client';

import { useState, useEffect } from 'react';
import { Post } from '@/lib/supabase';
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
  const [canEdit, setCanEdit] = useState(false);
  const [guestToken, setGuestToken] = useState('');

  useEffect(() => {
    const token = getGuestToken();
    setGuestToken(token);
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

  return (
    <>
      <article 
        className="post-card bg-white rounded-2xl overflow-hidden shadow-sm opacity-0 animate-fade-in"
        style={{ animationDelay: `${animationDelay}s` }}
      >
        {/* Media Section */}
        {post.media_url && (
          <div 
            className="media-container relative cursor-pointer group"
            onClick={() => setIsModalOpen(true)}
          >
            {post.media_type === 'video' ? (
              <video 
                src={post.media_url}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
            ) : (
              <img 
                src={post.media_url} 
                alt={`Memory shared by ${post.guest_name}`}
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/90 rounded-full p-3">
                  <svg className="w-6 h-6 text-[var(--color-charcoal)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Video indicator */}
            {post.media_type === 'video' && (
              <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Video
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
      {post.media_url && (
        <MediaModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mediaUrl={post.media_url}
          mediaType={post.media_type}
          guestName={post.guest_name}
        />
      )}
    </>
  );
}

