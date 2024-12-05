import { metricsService } from ".";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class CacheService<T> {
  private cache: Map<string, CacheEntry<T>>;
  private ttl: number;

  constructor(ttlSeconds: number = 60) {
    this.cache = new Map();
    this.ttl = ttlSeconds * 1000; 
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      metricsService.cacheMisses.inc({ cache_key: key });
      return null;
    }

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      metricsService.cacheMisses.inc({ cache_key: key });
      return null;
    }
      
    metricsService.cacheHits.inc({ cache_key: key });
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
} 