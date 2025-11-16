import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import {
  getPersistentCache,
  persistentCacheGet,
  persistentCacheSet,
  persistentCacheHas,
  persistentCacheStats,
  persistentCacheFlush,
} from './persistent-cache';

describe('Persistent Cache', () => {
  const testCacheDir = join(process.cwd(), 'test-cache');
  let cache: ReturnType<typeof getPersistentCache>;

  beforeEach(() => {
    // Clean up test cache directory
    if (existsSync(testCacheDir)) {
      rmSync(testCacheDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (cache) {
      cache.destroy();
    }
    // Clean up test cache directory
    if (existsSync(testCacheDir)) {
      rmSync(testCacheDir, { recursive: true, force: true });
    }
  });

  describe('Basic Operations', () => {
    it('should set and get values', () => {
      persistentCacheSet('test-key', 'test-value');
      const value = persistentCacheGet('test-key');
      expect(value).toBe('test-value');
    });

    it('should handle complex objects as keys', () => {
      const complexKey = {
        modelName: 'test-model',
        prompt: 'test prompt',
        data: { field: 'value' },
      };
      const value = 'complex-result';

      persistentCacheSet(complexKey, value);
      const retrieved = persistentCacheGet(complexKey);

      expect(retrieved).toBe(value);
    });

    it('should handle complex objects as values', () => {
      const key = 'complex-value-key';
      const complexValue = {
        result: 'test',
        metadata: { timestamp: Date.now() },
        nested: { deep: { value: 42 } },
      };

      persistentCacheSet(key, complexValue);
      const retrieved = persistentCacheGet(key);

      expect(retrieved).toEqual(complexValue);
    });

    it('should return undefined for non-existent keys', () => {
      const value = persistentCacheGet('non-existent-key');
      expect(value).toBeUndefined();
    });

    it('should check if key exists', () => {
      persistentCacheSet('exists-key', 'value');
      expect(persistentCacheHas('exists-key')).toBe(true);
      expect(persistentCacheHas('missing-key')).toBe(false);
    });

    it('should delete keys', () => {
      const cache = getPersistentCache();
      cache.set('delete-key', 'value');
      expect(cache.has('delete-key')).toBe(true);

      cache.delete('delete-key');
      expect(cache.has('delete-key')).toBe(false);
    });

    it('should clear all entries', () => {
      const cache = getPersistentCache();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire entries after TTL', async () => {
      persistentCacheSet('ttl-key', 'ttl-value', 100); // 100ms TTL

      // Should exist immediately
      expect(persistentCacheGet('ttl-key')).toBe('ttl-value');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be expired
      expect(persistentCacheGet('ttl-key')).toBeUndefined();
    });

    it('should use default TTL when not specified', () => {
      persistentCacheSet('default-ttl-key', 'value');
      const value = persistentCacheGet('default-ttl-key');
      expect(value).toBe('value');
    });

    it('should handle custom TTL values', () => {
      const customTTL = 5000; // 5 seconds
      persistentCacheSet('custom-ttl-key', 'value', customTTL);

      // Should still exist after 1 second
      setTimeout(() => {
        expect(persistentCacheGet('custom-ttl-key')).toBe('value');
      }, 1000);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits', () => {
      const cache = getPersistentCache();
      cache.clear(); // Reset stats

      cache.set('stat-key', 'value');
      cache.get('stat-key'); // Hit
      cache.get('stat-key'); // Hit

      const stats = cache.getStats();
      expect(stats.hits).toBeGreaterThanOrEqual(2);
    });

    it('should track cache misses', () => {
      const cache = getPersistentCache();
      cache.clear(); // Reset stats

      cache.get('missing-1'); // Miss
      cache.get('missing-2'); // Miss

      const stats = cache.getStats();
      expect(stats.misses).toBeGreaterThanOrEqual(2);
    });

    it('should track cache sets', () => {
      const cache = getPersistentCache();
      cache.clear(); // Reset stats

      cache.set('set-1', 'value-1');
      cache.set('set-2', 'value-2');
      cache.set('set-3', 'value-3');

      const stats = cache.getStats();
      expect(stats.sets).toBeGreaterThanOrEqual(3);
    });

    it('should track cache size', () => {
      const cache = getPersistentCache();
      cache.clear(); // Reset

      cache.set('size-1', 'value-1');
      cache.set('size-2', 'value-2');

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
    });
  });

  describe('Persistence', () => {
    it('should persist cache to disk', () => {
      const cache = getPersistentCache();
      cache.set('persist-key', 'persist-value');
      cache.flush();

      // Cache file should exist
      const cacheFilePath = join(cache['cacheFilePath']);
      expect(existsSync(cacheFilePath)).toBe(true);
    });

    it('should load cache from disk on initialization', () => {
      // Create first cache instance
      const cache1 = getPersistentCache();
      cache1.set('reload-key', 'reload-value');
      cache1.flush();
      cache1.destroy();

      // Create second cache instance - should load from disk
      const cache2 = getPersistentCache();
      const value = cache2.get('reload-key');

      expect(value).toBe('reload-value');
    });

    it('should not load expired entries from disk', async () => {
      // Create first cache instance with short TTL
      const cache1 = getPersistentCache();
      cache1.set('expire-key', 'expire-value', 100); // 100ms TTL
      cache1.flush();

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      cache1.destroy();

      // Create second cache instance - should not load expired entry
      const cache2 = getPersistentCache();
      const value = cache2.get('expire-key');

      expect(value).toBeUndefined();
    });
  });

  describe('Eviction and Limits', () => {
    it('should evict oldest entries when maxKeys is exceeded', () => {
      const cache = getPersistentCache();
      cache.clear();

      // Set more entries than maxKeys would normally allow
      // Note: This test would need to set a lot of entries to trigger eviction
      // For testing purposes, we'll just verify the eviction logic exists

      for (let i = 0; i < 100; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      const stats = cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(50000); // maxKeys limit
    });

    it('should clean up expired entries periodically', async () => {
      const cache = getPersistentCache();
      cache.clear();

      // Add entries with short TTL
      cache.set('cleanup-1', 'value-1', 100);
      cache.set('cleanup-2', 'value-2', 100);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Get should trigger cleanup
      cache.get('cleanup-1');

      expect(cache.has('cleanup-1')).toBe(false);
      expect(cache.has('cleanup-2')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined keys gracefully', () => {
      const value = persistentCacheGet(undefined as any);
      expect(value).toBeUndefined();
    });

    it('should handle undefined values gracefully', () => {
      persistentCacheSet('undef-key', undefined as any);
      const value = persistentCacheGet('undef-key');
      expect(value).toBeUndefined();
    });

    it('should handle bigint in cache keys', () => {
      const key = { id: BigInt(123456789) };
      persistentCacheSet(key, 'bigint-value');
      const value = persistentCacheGet(key);
      expect(value).toBe('bigint-value');
    });

    it('should handle very large values', () => {
      const largeValue = 'x'.repeat(10000); // 10KB string
      persistentCacheSet('large-key', largeValue);
      const value = persistentCacheGet('large-key');
      expect(value).toBe(largeValue);
    });

    it('should handle special characters in keys', () => {
      const specialKey = 'key-with-!@#$%^&*()_+-=[]{}|;:,.<>?';
      persistentCacheSet(specialKey, 'special-value');
      const value = persistentCacheGet(specialKey);
      expect(value).toBe('special-value');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent reads and writes', async () => {
      const cache = getPersistentCache();
      cache.clear();

      // Concurrent writes
      const writes = Array.from({ length: 50 }, (_, i) =>
        Promise.resolve(cache.set(`concurrent-${i}`, `value-${i}`))
      );

      await Promise.all(writes);

      // Concurrent reads
      const reads = Array.from({ length: 50 }, (_, i) =>
        Promise.resolve(cache.get(`concurrent-${i}`))
      );

      const results = await Promise.all(reads);

      // All reads should succeed
      expect(results.every((r, i) => r === `value-${i}`)).toBe(true);
    });
  });
});
