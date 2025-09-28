// Simple in-memory cache utility
// For production, consider using Redis or another dedicated caching solution

class MemoryCache {
  constructor(defaultTtl = 300, maxItems = 1000) { // Default TTL: 5 minutes, max 1000 items
    this.cache = new Map();
    this.defaultTtl = defaultTtl;
    this.maxItems = maxItems;
  }

  // Get an item from cache
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if item has expired
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    // Touch for naive LRU: reinsert to end
    this.cache.delete(key);
    this.cache.set(key, { ...item, lastAccess: Date.now() });
    return item.value;
  }

  // Set an item in cache with optional TTL in seconds
  set(key, value, ttl = this.defaultTtl) {
    const expiry = Date.now() + (ttl * 1000);

    // Evict if over capacity (remove oldest by insertion order)
    if (this.cache.size >= this.maxItems) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiry,
      lastAccess: Date.now()
    });

    return value;
  }

  // Delete an item from cache
  delete(key) {
    return this.cache.delete(key);
  }

  // Clear entire cache
  clear() {
    this.cache.clear();
  }

  // Get current cache size
  size() {
    return this.cache.size;
  }
  
  // Clean expired items (useful for periodic maintenance)
  cleanExpired() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  // Delete keys by prefix (namespace invalidation)
  deleteByPrefix(prefix) {
    let removed = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        removed++;
      }
    }
    return removed;
  }
}

// Export singleton instance
export const cache = new MemoryCache(Number(process.env.CACHE_DEFAULT_TTL || 300), Number(process.env.CACHE_MAX_ITEMS || 1000));

// Export the class for creating custom caches
export default MemoryCache;