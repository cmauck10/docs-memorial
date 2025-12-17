'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase, Post, MediaItem } from '@/lib/supabase';
import { getGuestToken } from '@/lib/guest-token';
import { processMedia } from '@/lib/media-utils';

interface SubmitFormProps {
  editPost?: Post | null;
  onCancel?: () => void;
  onSuccess?: () => void;
}

interface PendingMedia {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

const MAX_IMAGES = 10;
const MAX_VIDEOS = 1;

export default function SubmitForm({ editPost, onCancel, onSuccess }: SubmitFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(editPost?.guest_name || '');
  const [message, setMessage] = useState(editPost?.message || '');
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
  const [existingMedia, setExistingMedia] = useState<MediaItem[]>(editPost?.media || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [error, setError] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');

  const isEditing = !!editPost;

  const currentImageCount = pendingMedia.filter(m => m.type === 'image').length + 
                            existingMedia.filter(m => m.type === 'image').length;
  const currentVideoCount = pendingMedia.filter(m => m.type === 'video').length +
                            existingMedia.filter(m => m.type === 'video').length;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError('');
    setIsProcessingMedia(true);

    try {
      const newPendingMedia: PendingMedia[] = [];
      let imageCount = currentImageCount;
      let videoCount = currentVideoCount;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProcessingStatus(`Processing file ${i + 1} of ${files.length}...`);

        // Validate file size (100MB max before processing)
        if (file.size > 100 * 1024 * 1024) {
          setError(`${file.name} is too large (max 100MB)`);
          continue;
        }

        // Determine type
        const isImage = file.type.startsWith('image/') || 
                        file.name.toLowerCase().endsWith('.heic') ||
                        file.name.toLowerCase().endsWith('.heif');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
          setError(`${file.name} is not a supported format`);
          continue;
        }

        // Check limits
        if (isImage && imageCount >= MAX_IMAGES) {
          setError(`Maximum ${MAX_IMAGES} images allowed`);
          continue;
        }
        if (isVideo && videoCount >= MAX_VIDEOS) {
          setError(`Maximum ${MAX_VIDEOS} video allowed`);
          continue;
        }

        // Process the media
        const { file: processedFile, type } = await processMedia(file);

        // Create preview
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(processedFile);
        });

        newPendingMedia.push({
          file: processedFile,
          preview,
          type
        });

        if (type === 'image') imageCount++;
        if (type === 'video') videoCount++;
      }

      setPendingMedia(prev => [...prev, ...newPendingMedia]);
    } catch (err) {
      console.error('Media processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process media files');
    } finally {
      setIsProcessingMedia(false);
      setProcessingStatus('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePendingMedia = (index: number) => {
    setPendingMedia(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (index: number) => {
    setExistingMedia(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (file: File): Promise<string> => {
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

      // Upload all pending media
      const uploadedMedia: MediaItem[] = [...existingMedia];
      
      for (let i = 0; i < pendingMedia.length; i++) {
        setProcessingStatus(`Uploading ${i + 1} of ${pendingMedia.length}...`);
        const item = pendingMedia[i];
        const url = await uploadMedia(item.file);
        uploadedMedia.push({ url, type: item.type });
      }

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('posts')
          .update({
            guest_name: name.trim(),
            message: message.trim(),
            media: uploadedMedia,
            updated_at: new Date().toISOString()
          })
          .eq('id', editPost.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('posts')
          .insert({
            guest_name: name.trim(),
            message: message.trim(),
            media: uploadedMedia,
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
      setProcessingStatus('');
    }
  };

  const totalMedia = pendingMedia.length + existingMedia.length;
  const canAddMoreImages = currentImageCount < MAX_IMAGES;
  const canAddMoreVideos = currentVideoCount < MAX_VIDEOS;
  const canAddMore = canAddMoreImages || canAddMoreVideos;

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
          Photos & Video <span className="text-[var(--color-warm-gray)]">(optional)</span>
        </label>
        
        {/* Existing & Pending Media Grid */}
        {totalMedia > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
            {/* Existing media */}
            {existingMedia.map((item, index) => (
              <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover" />
                ) : (
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                )}
                {item.type === 'video' && (
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-xs">
                    Video
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeExistingMedia(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  aria-label="Remove"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            
            {/* Pending media */}
            {pendingMedia.map((item, index) => (
              <div key={`pending-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                {item.type === 'video' ? (
                  <video src={item.preview} className="w-full h-full object-cover" />
                ) : (
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                )}
                {item.type === 'video' && (
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white px-1.5 py-0.5 rounded text-xs">
                    Video
                  </div>
                )}
                <div className="absolute top-1 left-1 bg-[var(--color-sage)] text-white px-1.5 py-0.5 rounded text-xs">
                  New
                </div>
                <button
                  type="button"
                  onClick={() => removePendingMedia(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  aria-label="Remove"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area */}
        {isProcessingMedia ? (
          <div className="border-2 border-dashed border-[var(--color-sage)] rounded-lg p-6 text-center bg-[var(--color-sage)]/5">
            <div className="w-8 h-8 border-3 border-[var(--color-sage)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-[var(--color-charcoal)] font-medium text-sm">
              {processingStatus || 'Processing...'}
            </p>
          </div>
        ) : canAddMore ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--color-warm-gray)] rounded-lg p-6 text-center cursor-pointer hover:border-[var(--color-sage)] hover:bg-white/50 transition-all"
          >
            <svg className="w-10 h-10 mx-auto text-[var(--color-warm-gray)] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-[var(--color-charcoal)] font-medium text-sm mb-1">
              {totalMedia === 0 ? 'Add photos or video' : 'Add more'}
            </p>
            <p className="text-xs text-[var(--color-warm-gray)]">
              {canAddMoreImages && `${MAX_IMAGES - currentImageCount} images`}
              {canAddMoreImages && canAddMoreVideos && ' · '}
              {canAddMoreVideos && `${MAX_VIDEOS - currentVideoCount} video`}
              {' remaining'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-warm-gray)] text-center py-2">
            Maximum media reached ({MAX_IMAGES} images, {MAX_VIDEOS} video)
          </p>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.heic,.heif"
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        
        <p className="text-xs text-[var(--color-warm-gray)] mt-2">
          Images auto-compressed • HEIC supported • Videos up to 50MB
        </p>
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
              {processingStatus || (isEditing ? 'Saving...' : 'Submitting...')}
            </span>
          ) : (
            isEditing ? 'Save Changes' : 'Share Memory'
          )}
        </button>
      </div>
    </form>
  );
}
