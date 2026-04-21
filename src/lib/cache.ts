// Bug #22 FIX: cache now enforces a max size limit (50 entries) with LRU-style eviction
const CACHE_PREFIX = 'kessabcom_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 50;

/** Returns all cache keys belonging to this app (sorted oldest first). */
const getCacheKeys = (): string[] => {
  const keys: { key: string; ts: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(CACHE_PREFIX)) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          keys.push({ key: k, ts: parsed.timestamp ?? 0 });
        }
      } catch {
        keys.push({ key: k, ts: 0 });
      }
    }
  }
  return keys.sort((a, b) => a.ts - b.ts).map(x => x.key);
};

/** Evict expired entries, then oldest entries if still over limit. */
const evictIfNeeded = () => {
  // First pass: remove expired
  const now = Date.now();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(CACHE_PREFIX)) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const item = JSON.parse(raw);
          if (now - item.timestamp >= CACHE_DURATION) {
            localStorage.removeItem(k);
            i--;
          }
        }
      } catch {
        localStorage.removeItem(k!);
        i--;
      }
    }
  }
  // Second pass: LRU eviction if still over limit
  const keys = getCacheKeys();
  if (keys.length >= MAX_CACHE_ENTRIES) {
    const toRemove = keys.slice(0, keys.length - MAX_CACHE_ENTRIES + 1);
    toRemove.forEach(k => localStorage.removeItem(k));
  }
};

export const getCachedData = (key: string) => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (Date.now() - item.timestamp < CACHE_DURATION) {
      return item.data;
    }
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
};

export const setCachedData = (key: string, data: any) => {
  try {
    evictIfNeeded();
    const item = { data, timestamp: Date.now() };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
  } catch (error) {
    // QuotaExceededError: clear all cache entries as fallback
    console.warn('Cache write error (quota?), clearing cache:', error);
    clearAllCache();
  }
};

/** Remove a specific cache entry manually (e.g. after a mutation). */
export const invalidateCache = (key: string) => {
  localStorage.removeItem(`${CACHE_PREFIX}${key}`);
};

/** Clear all cache entries for this app. */
export const clearAllCache = () => {
  const keys = getCacheKeys();
  keys.forEach(k => localStorage.removeItem(k));
};

/** Clear only expired entries (can be called on app startup). */
export const clearExpiredCache = () => {
  const now = Date.now();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(CACHE_PREFIX)) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const item = JSON.parse(raw);
          if (now - item.timestamp >= CACHE_DURATION) {
            localStorage.removeItem(k);
            i--;
          }
        }
      } catch {
        localStorage.removeItem(k!);
        i--;
      }
    }
  }
};
