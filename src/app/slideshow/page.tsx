'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabase, MediaItem } from '@/lib/supabase';
import { getCached, setCache, isCacheValid, CACHE_KEYS } from '@/lib/cache';
import Link from 'next/link';

interface MediaWithAuthor extends MediaItem {
  guestName: string;
  postId: string;
}

const IMAGE_DURATION = 2000; // 2 seconds for images
const REFRESH_INTERVAL = 60000; // Check for new media every 60 seconds (reduced from 30)
const CACHE_TTL = 60000; // 1 minute cache for slideshow

export default function SlideshowPage() {
  const [allMedia, setAllMedia] = useState<MediaWithAuthor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all media from posts
  const fetchMedia = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cachedMedia = getCached<MediaWithAuthor[]>(CACHE_KEYS.SLIDESHOW_MEDIA);
      if (cachedMedia && cachedMedia.length > 0 && isCacheValid(CACHE_KEYS.SLIDESHOW_MEDIA, CACHE_TTL)) {
        setAllMedia(cachedMedia);
        setIsLoading(false);
        return;
      }
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('posts')
        .select('id, guest_name, media')
        .eq('is_hidden', false)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching media:', error);
        return;
      }

      // Flatten all media from all posts
      const mediaList: MediaWithAuthor[] = [];
      data?.forEach(post => {
        if (post.media && Array.isArray(post.media)) {
          post.media.forEach((item: MediaItem) => {
            mediaList.push({
              ...item,
              guestName: post.guest_name,
              postId: post.id
            });
          });
        }
      });

      // Cache the results
      setCache(CACHE_KEYS.SLIDESHOW_MEDIA, mediaList);

      // Only update if there are changes (to avoid resetting during slideshow)
      setAllMedia(prev => {
        const prevIds = prev.map(m => m.url).join(',');
        const newIds = mediaList.map(m => m.url).join(',');
        if (prevIds !== newIds) {
          return mediaList;
        }
        return prev;
      });
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Auto-refresh for new media (force refresh to bypass cache)
  useEffect(() => {
    const interval = setInterval(() => fetchMedia(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMedia]);

  // Handle slideshow progression
  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % allMedia.length);
  }, [allMedia.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + allMedia.length) % allMedia.length);
  }, [allMedia.length]);

  // Auto-advance for images
  useEffect(() => {
    if (allMedia.length === 0 || isPaused) return;

    const currentMedia = allMedia[currentIndex];
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Only set timer for images, videos will trigger goToNext on end
    if (currentMedia?.type === 'image') {
      timerRef.current = setTimeout(goToNext, IMAGE_DURATION);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, allMedia, goToNext, isPaused]);

  // Handle video end
  const handleVideoEnd = useCallback(() => {
    goToNext();
  }, [goToNext]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          goToNext();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'p':
        case 'P':
          setIsPaused(prev => !prev);
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, toggleFullscreen, isFullscreen]);

  const currentMedia = allMedia[currentIndex];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--color-tennessee)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading slideshow...</p>
        </div>
      </div>
    );
  }

  if (allMedia.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--color-tennessee)] to-[var(--color-tennessee-dark)] flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif text-white mb-2">No Media Yet</h2>
          <p className="text-white/60 mb-6">Be the first to share a photo or video!</p>
          <Link href="/submit" className="btn-primary">
            Share a Memory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-black flex flex-col"
    >
      {/* Header - hidden in fullscreen */}
      {!isFullscreen && (
        <header className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm absolute top-0 left-0 right-0 z-20">
          <Link href="/" className="text-white/80 hover:text-white transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
          <h1 className="text-white font-serif text-lg">Memory Slideshow</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </header>
      )}

      {/* Main slideshow area */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Media display */}
        <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
          {currentMedia.type === 'video' ? (
            <video
              ref={videoRef}
              key={currentMedia.url}
              src={currentMedia.url}
              className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnd}
            />
          ) : (
            <img
              key={currentMedia.url}
              src={currentMedia.url}
              alt={`Shared by ${currentMedia.guestName}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-fade-in"
            />
          )}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-3 bg-black/30 rounded-full hover:bg-black/50"
          aria-label="Previous"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-3 bg-black/30 rounded-full hover:bg-black/50"
          aria-label="Next"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Author credit */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
          <p className="text-white/90 text-sm">
            Shared by <span className="font-medium text-[var(--color-tennessee)]">{currentMedia.guestName}</span>
          </p>
        </div>
      </div>

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress bar */}
          <div className="flex gap-1 mb-4">
            {allMedia.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-[var(--color-tennessee)]' 
                    : index < currentIndex 
                      ? 'bg-white/40' 
                      : 'bg-white/20'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-white/60 text-sm">
                {currentIndex + 1} / {allMedia.length}
              </span>
              {isPaused && (
                <span className="text-yellow-400 text-sm flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                  Paused
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(prev => !prev)}
                className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                title={isPaused ? 'Play (P)' : 'Pause (P)'}
              >
                {isPaused ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                )}
              </button>
              <button
                onClick={toggleFullscreen}
                className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                title="Fullscreen (F)"
              >
                {isFullscreen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            </div>

            <div className="text-white/40 text-xs hidden md:block">
              Press F for fullscreen • P to pause • Arrow keys to navigate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

