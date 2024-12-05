import { CacheService } from '../cache';
import { metricsService } from '..';

// Mock metrics service
jest.mock('..', () => ({
  metricsService: {
    cacheHits: { inc: jest.fn() },
    cacheMisses: { inc: jest.fn() }
  }
}));

describe('CacheService', () => {
  let cache: CacheService<any>;

  beforeEach(() => {
    cache = new CacheService(1); // 1 second TTL for testing
    jest.clearAllMocks();
  });

  test('should store and retrieve values', () => {
    const testData = { id: 1, name: 'test' };
    cache.set('test-key', testData);
    
    const result = cache.get('test-key');
    expect(result).toEqual(testData);
    expect(metricsService.cacheHits.inc).toHaveBeenCalledWith({ cache_key: 'test-key' });
  });

  test('should return null for non-existent keys', () => {
    const result = cache.get('non-existent');
    expect(result).toBeNull();
    expect(metricsService.cacheMisses.inc).toHaveBeenCalledWith({ cache_key: 'non-existent' });
  });

  test('should expire items after TTL', async () => {
    const testData = { id: 1, name: 'test' };
    cache.set('test-key', testData);
    
    // Wait for TTL to expire
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const result = cache.get('test-key');
    expect(result).toBeNull();
    expect(metricsService.cacheMisses.inc).toHaveBeenCalledWith({ cache_key: 'test-key' });
  });

  test('should clear all items', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    cache.clear();
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });
});