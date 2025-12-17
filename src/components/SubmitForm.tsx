'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase, Post } from '@/lib/supabase';
import { getGuestToken } from '@/lib/guest-token';
import { processMedia } from '@/lib/media-utils';

interface SubmitFormProps {
  editPost?: Post | null;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function SubmitForm({ editPost, onCancel, onSuccess }: SubmitFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(editPost?.guest_name || '');
  const [message, setMessage] = useState(editPost?.message || '');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(editPost?.media_url || null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(editPost?.media_type || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [error, setError] = useState('');
  const [removeExistingMedia, setRemoveExistingMedia] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);

  const isEditing = !!editPost;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setCompressionInfo(null);
    setIsProcessingMedia(true);

    try {
      // Validate initial file size (100MB max before processing)
      if (file.size > 100 * 1024 * 1024) {
        setError('File size must be less than 100MB');
        setIsProcessingMedia(false);
        return;
      }

      // Validate file type
      const isImage = file.type.startsWith('image/') || 
                      file.name.toLowerCase().endsWith('.heic') ||
                      file.name.toLowerCase().endsWith('.heif');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        setError('Please upload an image or video file');
        setIsProcessingMedia(false);
        return;
      }

      // Process the media (compress images, validate videos)
      const originalSize = file.size;
      const { file: processedFile, type } = await processMedia(file);
      const newSize = processedFile.size;

      // Show compression info for images
      if (type === 'image' && originalSize !== newSize) {
        const savedPercent = Math.round((1 - newSize / originalSize) * 100);
        const originalMB = (originalSize / 1024 / 1024).toFixed(1);
        const newMB = (newSize / 1024 / 1024).toFixed(1);
        setCompressionInfo(`Compressed: ${originalMB}MB → ${newMB}MB (${savedPercent}% smaller)`);
      }

      setMediaFile(processedFile);
      setMediaType(type);
      setRemoveExistingMedia(false);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(processedFile);
    } catch (err) {
      console.error('Media processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process media file');
    } finally {
      setIsProcessingMedia(false);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setCompressionInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (isEditing && editPost?.media_url) {
      setRemoveExistingMedia(true);
    }
  };

  const uploadMedia = async (file: File): Promise<string | null> => {
    const supabase = getSupabase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload media');
    }

    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const supabase = getSupabase();
      const guestToken = getGuestToken();
      
      if (!guestToken) {
        throw new Error('Unable to create guest session');
      }

      let mediaUrl = isEditing && !removeExistingMedia ? editPost?.media_url : null;

      // Upload new media if provided
      if (mediaFile) {
        mediaUrl = await uploadMedia(mediaFile);
      }

      if (isEditing) {
        // Update existing post
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            guest_name: name.trim(),
            message: message.trim(),
            media_url: mediaUrl,
            media_type: mediaFile ? mediaType : (removeExistingMedia ? null : editPost?.media_type),
            updated_at: new Date().toISOString()
          })
          .eq('id', editPost.id);

        if (updateError) throw updateError;
      } else {
        // Create new post
        const { error: insertError } = await supabase
          .from('posts')
          .insert({
            guest_name: name.trim(),
            message: message.trim(),
            media_url: mediaUrl,
            media_type: mediaType,
            guest_token: guestToken
          });

        if (insertError) throw insertError;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">
          Your Name <span className="text-[var(--color-dusty-rose)]">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="input-field"
          placeholder="Enter your name"
          maxLength={100}
        />
      </div>

      {/* Message Field */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">
          Your Memory <span className="text-[var(--color-dusty-rose)]">*</span>
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={6}
          className="input-field resize-none"
          placeholder="Share your cherished memories, stories, or words of remembrance..."
          maxLength={2000}
        />
        <p className="text-xs text-[var(--color-warm-gray)] mt-1 text-right">
          {message.length}/2000 characters
        </p>
      </div>

      {/* Media Upload */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">
          Photo or Video <span className="text-[var(--color-warm-gray)]">(optional)</span>
        </label>
        
        {isProcessingMedia ? (
          <div className="border-2 border-dashed border-[var(--color-sage)] rounded-lg p-8 text-center bg-[var(--color-sage)]/5">
            <div className="w-10 h-10 border-3 border-[var(--color-sage)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[var(--color-charcoal)] font-medium">
              Processing your file...
            </p>
            <p className="text-sm text-[var(--color-warm-gray)] mt-1">
              Optimizing for best quality & size
            </p>
          </div>
        ) : mediaPreview ? (
          <div className="relative">
            <div className="rounded-lg overflow-hidden bg-gray-100">
              {mediaType === 'video' ? (
                <video 
                  src={mediaPreview} 
                  className="w-full max-h-64 object-contain"
                  controls
                />
              ) : (
                <img 
                  src={mediaPreview} 
                  alt="Preview" 
                  className="w-full max-h-64 object-contain"
                />
              )}
            </div>
            <button
              type="button"
              onClick={removeMedia}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
              aria-label="Remove media"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {compressionInfo && (
              <div className="mt-2 text-xs text-[var(--color-sage)] flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {compressionInfo}
              </div>
            )}
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--color-warm-gray)] rounded-lg p-8 text-center cursor-pointer hover:border-[var(--color-sage)] hover:bg-white/50 transition-all"
          >
            <svg className="w-12 h-12 mx-auto text-[var(--color-warm-gray)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[var(--color-charcoal)] font-medium mb-1">
              Click to upload
            </p>
            <p className="text-sm text-[var(--color-warm-gray)]">
              Images auto-compressed • HEIC supported • Videos up to 50MB
            </p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.heic,.heif"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
            disabled={isSubmitting || isProcessingMedia}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || isProcessingMedia || !name.trim() || !message.trim()}
          className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {isEditing ? 'Saving...' : 'Submitting...'}
            </span>
          ) : (
            isEditing ? 'Save Changes' : 'Share Memory'
          )}
        </button>
      </div>
    </form>
  );
}
