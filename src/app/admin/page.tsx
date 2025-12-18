'use client';

import { useState, useEffect } from 'react';
import { getSupabase, Post } from '@/lib/supabase';
import { clearCache, CACHE_KEYS } from '@/lib/cache';
import PostCard from '@/components/PostCard';
import SubmitForm from '@/components/SubmitForm';

// Clear slideshow cache when admin makes changes
const invalidateSlideshowCache = () => {
  clearCache(CACHE_KEYS.SLIDESHOW_MEDIA);
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden' | 'pinned'>('all');
  
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const adminAuth = sessionStorage.getItem('admin_authenticated');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const supabase = getSupabase();
      // Simple auth check against admin_users table
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .single();

      if (error || !data) {
        setLoginError('Invalid username or password');
      } else {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_authenticated', 'true');
      }
    } catch (err) {
      setLoginError('An error occurred. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setUsername('');
    setPassword('');
  };

  const fetchAllPosts = async () => {
    setLoading(true);
    
    try {
      const supabase = getSupabase();
      // For admin, we need to fetch ALL posts including hidden ones
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
      } else {
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllPosts();
    }
  }, [isAuthenticated]);

  const handleHide = async (postId: string, isHidden: boolean) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('posts')
        .update({ is_hidden: isHidden })
        .eq('id', postId);

      if (error) {
        console.error('Error updating post:', error);
        alert('Failed to update post visibility');
      } else {
        invalidateSlideshowCache();
        fetchAllPosts();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handlePin = async (postId: string, isPinned: boolean) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('posts')
        .update({ is_pinned: isPinned })
        .eq('id', postId);

      if (error) {
        console.error('Error updating post:', error);
        alert('Failed to update post pin status');
      } else {
        invalidateSlideshowCache();
        fetchAllPosts();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const supabase = getSupabase();
      
      // First, get the post to find associated media
      const { data: post } = await supabase
        .from('posts')
        .select('media')
        .eq('id', postId)
        .single();

      // Delete media files from storage
      if (post?.media && post.media.length > 0) {
        const filePaths = post.media
          .map((item: { url: string }) => {
            // Extract file path from URL
            // URL format: https://xxx.supabase.co/storage/v1/object/public/media/posts/filename.jpg
            const match = item.url.match(/\/media\/(.+)$/);
            return match ? match[1] : null;
          })
          .filter(Boolean);

        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('media')
            .remove(filePaths);

          if (storageError) {
            console.error('Error deleting media files:', storageError);
            // Continue with post deletion even if media deletion fails
          }
        }
      }

      // Delete the post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      } else {
        invalidateSlideshowCache();
        fetchAllPosts();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingPost(null);
    invalidateSlideshowCache();
    fetchAllPosts();
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'visible') return !post.is_hidden;
    if (filter === 'hidden') return post.is_hidden;
    if (filter === 'pinned') return post.is_pinned;
    return true;
  });

  // Login Form
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[var(--color-warm-white)] to-[var(--color-tennessee-pale)]">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-[rgba(255,130,0,0.1)]">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--color-tennessee)] to-[var(--color-tennessee-dark)] flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-serif text-[var(--color-charcoal)]">
                Admin Access
              </h1>
              <p className="text-[var(--color-warm-gray)] text-sm mt-2">
                Enter your credentials to manage posts
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                  {loginError}
                </div>
              )}

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="input-field"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field"
                  placeholder="Enter password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="btn-primary w-full mt-6"
              >
                {isLoggingIn ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a 
                href="/" 
                className="text-sm text-[var(--color-warm-gray)] hover:text-[var(--color-tennessee)] transition-colors"
              >
                ← Return to Memorial Wall
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Admin Dashboard
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-[rgba(255,130,0,0.1)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-tennessee)] to-[var(--color-tennessee-dark)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-lg font-serif text-[var(--color-charcoal)]">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="/" 
              className="text-sm text-[var(--color-warm-gray)] hover:text-[var(--color-tennessee)] transition-colors"
            >
              View Site
            </a>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats & Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-[rgba(255,130,0,0.1)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-[var(--color-charcoal)]">{posts.length}</p>
                <p className="text-xs text-[var(--color-warm-gray)]">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-600">
                  {posts.filter(p => !p.is_hidden).length}
                </p>
                <p className="text-xs text-[var(--color-warm-gray)]">Visible</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-yellow-600">
                  {posts.filter(p => p.is_hidden).length}
                </p>
                <p className="text-xs text-[var(--color-warm-gray)]">Hidden</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-[var(--color-tennessee)]">
                  {posts.filter(p => p.is_pinned).length}
                </p>
                <p className="text-xs text-[var(--color-warm-gray)]">Pinned</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'visible' | 'hidden' | 'pinned')}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-tennessee)]"
              >
                <option value="all">All Posts</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
                <option value="pinned">Pinned</option>
              </select>
              <button
                onClick={fetchAllPosts}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <svg className="w-5 h-5 text-[var(--color-warm-gray)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[var(--color-tennessee)] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[var(--color-warm-gray)]">Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-[rgba(255,130,0,0.1)]">
            <p className="text-[var(--color-warm-gray)]">No posts found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPosts.map((post, index) => (
              <div key={post.id} className={post.is_hidden ? 'opacity-60' : ''}>
                <PostCard 
                  post={post} 
                  isAdmin={true}
                  onEdit={handleEdit}
                  onHide={handleHide}
                  onDelete={handleDelete}
                  onPin={handlePin}
                  animationDelay={index * 0.05}
                />
              </div>
            ))}
          </div>
        )}
      </div>

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
                  Edit Post
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
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
                onCancel={() => setShowEditModal(false)}
                onSuccess={handleEditSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
