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
const REFRESH_INTERVAL = 60000; // Check for new media every 60 seconds
const CACHE_TTL = 60000; // 1 minute cache for slideshow

export default function SlideshowPage() {
  const [allMedia, setAllMedia] = useState<MediaWithAuthor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls after inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Show controls on mouse move
  useEffect(() => {
    const handleMouseMove = () => resetControlsTimer();
    const handleTouch = () => resetControlsTimer();
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouch);
    resetControlsTimer();
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouch);
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, [resetControlsTimer]);

  // Fetch all media from posts
  const fetchMedia = useCallback(async (forceRefresh = false) => {
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

      setCache(CACHE_KEYS.SLIDESHOW_MEDIA, mediaList);

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

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  useEffect(() => {
    const interval = setInterval(() => fetchMedia(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMedia]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % allMedia.length);
  }, [allMedia.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + allMedia.length) % allMedia.length);
  }, [allMedia.length]);

  useEffect(() => {
    if (allMedia.length === 0 || isPaused) return;

    const currentMedia = allMedia[currentIndex];
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (currentMedia?.type === 'image') {
      timerRef.current = setTimeout(goToNext, IMAGE_DURATION);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex, allMedia, goToNext, isPaused]);

  const handleVideoEnd = useCallback(() => {
    goToNext();
  }, [goToNext]);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetControlsTimer();
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
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
  }, [goToNext, goToPrevious, toggleFullscreen, isFullscreen, resetControlsTimer]);

  const currentMedia = allMedia[currentIndex];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--color-tennessee)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading slideshow...</p>
        </div>
      </div>
    );
  }

  if (allMedia.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
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
      className="fixed inset-0 bg-black flex flex-col cursor-none"
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {/* Full-screen media display */}
      <div className="absolute inset-0 flex items-center justify-center">
        {currentMedia.type === 'video' ? (
          <video
            ref={videoRef}
            key={currentMedia.url}
            src={currentMedia.url}
            className="w-full h-full object-contain"
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
            className="w-full h-full object-contain animate-fade-in"
          />
        )}
      </div>

      {/* Navigation arrows - show on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
        className={`absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-all p-2 md:p-4 bg-black/40 rounded-full hover:bg-black/60 hover:scale-110 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        aria-label="Previous"
      >
        <svg className="w-6 h-6 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goToNext(); }}
        className={`absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-all p-2 md:p-4 bg-black/40 rounded-full hover:bg-black/60 hover:scale-110 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        aria-label="Next"
      >
        <svg className="w-6 h-6 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Back button - top left */}
      <Link 
        href="/" 
        className={`absolute top-4 left-4 text-white/70 hover:text-white transition-all p-2 bg-black/40 rounded-full hover:bg-black/60 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </Link>

      {/* Bottom controls bar */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-16 pb-4 px-4 transition-opacity duration-300 z-10 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-6xl mx-auto">
          {/* Progress bar */}
          <div className="flex gap-0.5 mb-3">
            {allMedia.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-[var(--color-tennessee)]' 
                    : index < currentIndex 
                      ? 'bg-white/50' 
                      : 'bg-white/25'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            {/* Left: Counter & Author */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-white/80 text-sm font-medium tabular-nums">
                {currentIndex + 1} / {allMedia.length}
              </span>
              <span className="text-white/40">•</span>
              <span className="text-white/70 text-sm truncate">
                Shared by <span className="text-[var(--color-tennessee)] font-medium">{currentMedia.guestName}</span>
              </span>
            </div>

            {/* Center: Play/Pause status */}
            {isPaused && (
              <span className="text-yellow-400 text-sm flex items-center gap-1 px-3 py-1 bg-yellow-400/10 rounded-full">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
                Paused
              </span>
            )}

            {/* Right: Control buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPaused(prev => !prev)}
                className="text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
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
                className="text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                title="Fullscreen (F)"
              >
                {isFullscreen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v4m0-4h4m7 5l5-5m0 0v4m0-4h-4M9 15l-5 5m0 0v-4m0 4h4m7-5l5 5m0 0v-4m0 4h-4" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
