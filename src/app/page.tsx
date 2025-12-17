'use client';

import { useState, useEffect } from 'react';
import { getSupabase, Post } from '@/lib/supabase';
import Header from '@/components/Header';
import PostCard from '@/components/PostCard';
import SubmitForm from '@/components/SubmitForm';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchPosts = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('is_hidden', false)
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
    fetchPosts();
  }, []);

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingPost(null);
    fetchPosts();
  };

  return (
    <main className="min-h-screen">
      <Header />

      {/* Memorial Wall Section */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif text-[var(--color-charcoal)] mb-3">
            Tributes & Memories
          </h2>
          <p className="text-[var(--color-warm-gray)] max-w-xl mx-auto">
            A collection of cherished memories shared by those whose lives were touched by Dr. Mauck.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[var(--color-sage)] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[var(--color-warm-gray)]">Loading memories...</p>
          </div>
        ) : posts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--color-sage)]/10 flex items-center justify-center">
              <svg className="w-12 h-12 text-[var(--color-sage)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif text-[var(--color-charcoal)] mb-2">
              Be the First to Share
            </h3>
            <p className="text-[var(--color-warm-gray)] mb-8 max-w-md mx-auto">
              No memories have been shared yet. Start the tribute by sharing your cherished memories of Dr. Mauck.
            </p>
            <a href="/submit" className="btn-primary inline-block">
              Share a Memory
            </a>
          </div>
        ) : (
          /* Posts Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onEdit={handleEdit}
                animationDelay={index * 0.1}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-warm-gray)]/20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[var(--color-warm-gray)] text-sm">
            In loving memory of Dr. Michael Mauck
          </p>
          <p className="text-[var(--color-warm-gray)]/60 text-xs mt-2">
            Forever in our hearts
          </p>
        </div>
      </footer>

      {/* Edit Modal */}
      {showEditModal && editingPost && (
        <div className="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div 
            className="bg-[var(--color-cream)] rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-[var(--color-warm-gray)]/20">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif text-[var(--color-charcoal)]">
                  Edit Your Memory
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
