// Lightweight shared live cache/poller for product documents
// - Single in-flight request per product
// - Throttled refreshes (default: 30s)
// - Only polls when there are subscribers (e.g., visible cards)
// - Pauses when tab is hidden

import api from '../services/apiService';

const DEFAULT_TTL = 60 * 1000; // 60s cache freshness window
const POLL_INTERVAL = 30 * 1000; // 30s background refresh

class ProductLiveCache {
  constructor() {
    this.store = new Map(); // id -> { data, ts, inFlight, subs:Set<fn>, timerId }
    this.handleVisibility = this.handleVisibility.bind(this);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibility);
    }
  }

  handleVisibility() {
    const hidden = document.visibilityState === 'hidden';
    // Pause timers when hidden; resume on visible
    for (const [id, entry] of this.store.entries()) {
      if (entry.timerId) {
        clearInterval(entry.timerId);
        entry.timerId = null;
      }
      if (!hidden && entry.subs && entry.subs.size > 0) {
        // restart polling when visible again
        entry.timerId = setInterval(() => this.refresh(id, entry.apiBase), POLL_INTERVAL);
      }
    }
  }

  async fetchOnce(id, apiBase) {
    let entry = this.store.get(id);
    if (!entry) {
      entry = { data: null, ts: 0, inFlight: null, subs: new Set(), timerId: null, apiBase: apiBase };
      this.store.set(id, entry);
    }
    // Persist latest apiBase for this entry
    if (apiBase) entry.apiBase = apiBase;

    if (entry.inFlight) return entry.inFlight;

    // Use centralized API client so auth/baseURL/headers are consistent
    entry.inFlight = api
      .get(`/products/${id}`, { timeout: 10000 })
      .then((resp) => {
        entry.data = resp.data;
        entry.ts = Date.now();
        // notify subscribers
        entry.subs.forEach((cb) => {
          try { cb(entry.data); } catch (_) {}
        });
        return entry.data;
      })
      .finally(() => {
        entry.inFlight = null;
      });

    return entry.inFlight;
  }

  async get(id, apiBase, { force = false, ttl = DEFAULT_TTL } = {}) {
    const entry = this.store.get(id);
    const fresh = entry && (Date.now() - entry.ts < ttl) && entry.data;
    if (fresh && !force) return entry.data;
    return this.fetchOnce(id, apiBase);
  }

  subscribe(id, apiBase, callback) {
    let entry = this.store.get(id);
    if (!entry) {
      entry = { data: null, ts: 0, inFlight: null, subs: new Set(), timerId: null, apiBase: apiBase };
      this.store.set(id, entry);
    }
    // Persist api base on subscribe
    if (apiBase) entry.apiBase = apiBase;
    entry.subs.add(callback);

    // Start polling if not started and page is visible
    const isVisible = typeof document === 'undefined' || document.visibilityState === 'visible';
    if (!entry.timerId && isVisible) {
      entry.timerId = setInterval(() => this.refresh(id, entry.apiBase || apiBase), POLL_INTERVAL);
    }

    // Immediately provide current data if we have it
    if (entry.data) {
      try { callback(entry.data); } catch (_) {}
    } else {
      // kick an initial fetch
      this.fetchOnce(id, apiBase).catch(() => {});
    }

    // return unsubscribe
    return () => {
      const e = this.store.get(id);
      if (!e) return;
      e.subs.delete(callback);
      if (e.subs.size === 0) {
        if (e.timerId) {
          clearInterval(e.timerId);
          e.timerId = null;
        }
      }
    };
  }

  async refresh(id, apiBase) {
    try {
      await this.fetchOnce(id, apiBase);
    } catch (_) {
      // swallow errors during background refresh
    }
  }
}

const productLiveCache = new ProductLiveCache();
export default productLiveCache;
