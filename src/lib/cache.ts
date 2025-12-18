// Simple client-side cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

const CACHE_PREFIX = 'memorial_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default

export function getCached<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    return entry.data;
  } catch {
    return null;
  }
}

export function getCacheTimestamp(key: string): number | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (!cached) return null;
    
    const entry = JSON.parse(cached);
    return entry.timestamp;
  } catch {
    return null;
  }
}

export function isCacheValid(key: string, ttl: number = DEFAULT_TTL): boolean {
  const timestamp = getCacheTimestamp(key);
  if (!timestamp) return false;
  return Date.now() - timestamp < ttl;
}

export function setCache<T>(key: string, data: T, etag?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      etag
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    // localStorage might be full, clear old entries
    console.warn('Cache storage failed, clearing old entries');
    clearOldCache();
  }
}

export function clearCache(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CACHE_PREFIX + key);
}

export function clearAllCache(): void {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
}

function clearOldCache(): void {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(localStorage);
  const now = Date.now();
  
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const entry = JSON.parse(cached);
          // Remove entries older than 1 hour
          if (now - entry.timestamp > 60 * 60 * 1000) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  });
}

// Cache keys - only slideshow uses caching to minimize API calls
export const CACHE_KEYS = {
  SLIDESHOW_MEDIA: 'slideshow_media'
} as const;

