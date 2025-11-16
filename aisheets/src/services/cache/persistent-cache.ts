import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { appConfig } from '~/config';

interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  size: number;
}

/**
 * Persistent cache that stores cache entries in a JSON file
 * This ensures cache survives server restarts
 */
class PersistentCache {
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, size: 0 };
  private cacheFilePath: string;
  private readonly defaultTTL = 60 * 60 * 1000; // 1 hour in ms
  private readonly maxKeys = 50000;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(cacheDir?: string) {
    const dataDir = cacheDir || appConfig.data.dataDir;
    const cacheDirectory = join(dataDir, 'cache');

    // Ensure cache directory exists
    if (!existsSync(cacheDirectory)) {
      mkdirSync(cacheDirectory, { recursive: true });
    }

    this.cacheFilePath = join(cacheDirectory, 'prompt-cache.json');
    this.loadFromDisk();
    this.startCleanupInterval();
  }

  private loadFromDisk(): void {
    try {
      if (existsSync(this.cacheFilePath)) {
        const data = readFileSync(this.cacheFilePath, 'utf-8');
        const entries: CacheEntry[] = JSON.parse(data);

        const now = Date.now();
        let loaded = 0;

        for (const entry of entries) {
          // Only load non-expired entries
          if (now - entry.timestamp < entry.ttl) {
            this.cache.set(entry.key, entry);
            loaded++;
          }
        }

        this.stats.size = loaded;
        console.log(`📦 Loaded ${loaded} cache entries from disk`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load cache from disk:', error);
      this.cache.clear();
    }
  }

  private saveToDisk(): void {
    try {
      const entries = Array.from(this.cache.values());
      writeFileSync(this.cacheFilePath, JSON.stringify(entries, null, 2), 'utf-8');
    } catch (error) {
      console.warn('⚠️ Failed to save cache to disk:', error);
    }
  }

  private startCleanupInterval(): void {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.stats.size = this.cache.size;
      this.saveToDisk();
      console.log(`🧹 Cleaned up ${removed} expired cache entries`);
    }
  }

  private evictOldest(): void {
    // If we exceed max keys, remove the oldest 10%
    if (this.cache.size >= this.maxKeys) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = Math.floor(this.maxKeys * 0.1);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }

      console.log(`🗑️ Evicted ${toRemove} oldest cache entries`);
    }
  }

  get(key: any): any | undefined {
    const cacheKey = this.normalizeKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    const now = Date.now();
    if (now - entry.timestamp >= entry.ttl) {
      // Expired
      this.cache.delete(cacheKey);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return undefined;
    }

    this.stats.hits++;
    return entry.value;
  }

  set(key: any, value: any, ttl?: number): void {
    if (!key || value === undefined) {
      console.warn('⚠️ Cache key or value is undefined');
      return;
    }

    const cacheKey = this.normalizeKey(key);
    const entry: CacheEntry = {
      key: cacheKey,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    this.cache.set(cacheKey, entry);
    this.stats.sets++;
    this.stats.size = this.cache.size;

    // Evict oldest if needed
    this.evictOldest();

    // Save to disk periodically (every 100 sets)
    if (this.stats.sets % 100 === 0) {
      this.saveToDisk();
    }
  }

  has(key: any): boolean {
    const cacheKey = this.normalizeKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp >= entry.ttl) {
      this.cache.delete(cacheKey);
      return false;
    }

    return true;
  }

  delete(key: any): void {
    const cacheKey = this.normalizeKey(key);
    this.cache.delete(cacheKey);
    this.stats.size = this.cache.size;
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, size: 0 };
    this.saveToDisk();
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  flush(): void {
    this.saveToDisk();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.saveToDisk();
  }

  private normalizeKey(key: any): string {
    if (typeof key === 'string') {
      return key;
    }
    return JSON.stringify(key, (_, v) =>
      typeof v === 'bigint' ? v.toString() : v,
    );
  }
}

// Singleton instance
let persistentCacheInstance: PersistentCache | null = null;

export const getPersistentCache = (): PersistentCache => {
  if (!persistentCacheInstance) {
    persistentCacheInstance = new PersistentCache();
  }
  return persistentCacheInstance;
};

export const persistentCacheGet = (key: any): any | undefined => {
  return getPersistentCache().get(key);
};

export const persistentCacheSet = (key: any, value: any, ttl?: number): void => {
  getPersistentCache().set(key, value, ttl);
};

export const persistentCacheHas = (key: any): boolean => {
  return getPersistentCache().has(key);
};

export const persistentCacheStats = (): CacheStats => {
  return getPersistentCache().getStats();
};

export const persistentCacheFlush = (): void => {
  getPersistentCache().flush();
};
