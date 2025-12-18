'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabase, Post } from '@/lib/supabase';
import { getCached, setCache, isCacheValid, CACHE_KEYS } from '@/lib/cache';
import Header from '@/components/Header';
import PostCard from '@/components/PostCard';
import dynamic from 'next/dynamic';

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache for posts

// Lazy load the edit form modal
const SubmitForm = dynamic(() => import('@/components/SubmitForm'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-100 h-96 rounded-lg" />
});

const POSTS_PER_PAGE = 12;

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchPosts = useCallback(async (offset = 0, append = false, forceRefresh = false) => {
    // Check cache first for initial load
    if (offset === 0 && !append && !forceRefresh) {
      const cachedPosts = getCached<Post[]>(CACHE_KEYS.POSTS);
      const cachedCount = getCached<number>(CACHE_KEYS.POSTS_COUNT);
      
      if (cachedPosts && isCacheValid(CACHE_KEYS.POSTS, CACHE_TTL)) {
        setPosts(cachedPosts);
        setTotalCount(cachedCount || cachedPosts.length);
        setHasMore(cachedCount ? POSTS_PER_PAGE < cachedCount : false);
        setLoading(false);
        return;
      }
    }

    try {
      const supabase = getSupabase();
      const { data, error, count } = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('is_hidden', false)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + POSTS_PER_PAGE - 1);

      if (error) {
        console.error('Error fetching posts:', error);
      } else {
        const newPosts = data || [];
        if (append) {
          // Deduplicate posts when appending to avoid key conflicts
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
            const combined = [...prev, ...uniqueNewPosts];
            // Cache the combined results
            setCache(CACHE_KEYS.POSTS, combined);
            return combined;
          });
        } else {
          setPosts(newPosts);
          // Cache initial posts
          setCache(CACHE_KEYS.POSTS, newPosts);
          setCache(CACHE_KEYS.POSTS_COUNT, count || 0);
        }
        setTotalCount(count || 0);
        setHasMore(count ? offset + POSTS_PER_PAGE < count : false);
      }
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchPosts(posts.length, true);
  }, [loadingMore, hasMore, posts.length, fetchPosts]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000 &&
        hasMore &&
        !loadingMore
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, hasMore, loadingMore]);

  const handleEdit = useCallback((post: Post) => {
    setEditingPost(post);
    setShowEditModal(true);
  }, []);

  const handleEditSuccess = useCallback(() => {
    setShowEditModal(false);
    setEditingPost(null);
    // Force refresh after edit
    fetchPosts(0, false, true);
  }, [fetchPosts]);

  const handleCloseModal = useCallback(() => {
    setShowEditModal(false);
  }, []);

  // Memoize the posts grid to prevent unnecessary re-renders
  const postsGrid = useMemo(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {posts.map((post, index) => (
        <PostCard 
          key={post.id} 
          post={post} 
          onEdit={handleEdit}
          animationDelay={Math.min(index * 0.05, 0.3)} // Cap animation delay
          priority={index < 4} // First 4 cards get priority loading
        />
      ))}
    </div>
  ), [posts, handleEdit]);

  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-[var(--color-tennessee-pale)] to-transparent py-8 px-4">
        <div className="flex items-center justify-center gap-4">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
            <img 
              src="/michael-mauck.jpeg" 
              alt="Dr. Michael Mauck"
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
          <div className="text-left">
            <p className="text-[var(--color-warm-gray)] text-xs uppercase tracking-widest mb-1">
              In Loving Memory
            </p>
            <h1 className="text-2xl md:text-4xl font-serif text-[var(--color-charcoal)]">
              Dr. Michael Mauck
            </h1>
            <p className="text-[var(--color-warm-gray)] text-sm mt-1">
              Beloved father, husband, and surgeon
            </p>
            <div className="w-20 h-1 bg-gradient-to-r from-[var(--color-tennessee)] to-transparent mt-2 rounded-full" />
          </div>
        </div>
      </div>

      {/* Memorial Wall Section */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[var(--color-tennessee)] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[var(--color-warm-gray)]">Loading memories...</p>
          </div>
        ) : posts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--color-tennessee)] to-[var(--color-tennessee-dark)] flex items-center justify-center shadow-lg orange-glow">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif text-[var(--color-charcoal)] mb-2">
              Be the First to Share
            </h3>
            <p className="text-[var(--color-warm-gray)] mb-6 max-w-md mx-auto">
              No memories have been shared yet. Start the tribute by sharing your cherished memories.
            </p>
            <a href="/submit" className="btn-primary inline-block">
              Share a Memory
            </a>
          </div>
        ) : (
          <>
            {postsGrid}
            
            {/* Load more indicator */}
            {loadingMore && (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-[var(--color-tennessee)] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
            {/* End of posts indicator */}
            {!hasMore && posts.length > POSTS_PER_PAGE && (
              <p className="text-center text-[var(--color-warm-gray)] text-sm py-8">
                You&apos;ve seen all {posts.length} memories
              </p>
            )}
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="py-4 border-t border-[var(--color-light-gray)]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[var(--color-warm-gray)] text-sm">
            In loving memory of{' '}
            <a 
              href="/about" 
              className="text-[var(--color-tennessee)] font-medium hover:underline transition-colors"
            >
              Dr. Michael Mauck
            </a>
          </p>
        </div>
      </footer>

      {/* Edit Modal */}
      {showEditModal && editingPost && (
        <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div 
            className="bg-[var(--color-warm-white)] rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[var(--color-light-gray)]">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif text-[var(--color-charcoal)]">
                  Edit Your Memory
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-[var(--color-warm-gray)] hover:text-[var(--color-charcoal)] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <SubmitForm 
                editPost={editingPost}
                onCancel={handleCloseModal}
                onSuccess={handleEditSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
