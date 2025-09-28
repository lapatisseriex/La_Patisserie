// Simple in-memory cache utility
// For production, consider using Redis or another dedicated caching solution

class MemoryCache {
  constructor(defaultTtl = 300) { // Default TTL: 5 minutes
    this.cache = new Map();
    this.defaultTtl = defaultTtl;
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
    
    return item.value;
  }

  // Set an item in cache with optional TTL in seconds
  set(key, value, ttl = this.defaultTtl) {
    const expiry = Date.now() + (ttl * 1000);
    
    this.cache.set(key, {
      value,
      expiry
    });
    
    // Return the value for convenience
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
}

// Create singleton instance
export const cache = new MemoryCache();

// Set up automatic cache cleanup every 30 minutes
const CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes in ms

setInterval(() => {
  const cleanedCount = cache.cleanExpired();
  if (cleanedCount > 0) {
    console.log(`🧹 Cache cleanup: removed ${cleanedCount} expired items. Cache size: ${cache.size()}`);
  }
}, CACHE_CLEANUP_INTERVAL);

// Export the class for creating custom caches
export default MemoryCache;