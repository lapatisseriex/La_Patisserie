// Lightweight retry helper for transient HTTP errors
// Usage: await withRetry(() => axios.get(url), { retries: 2, delay: 300 })

export async function withRetry(fn, options = {}) {
  const {
    retries = 2,
    delay = 300,
    backoff = 2,
    retryOn = (err) => {
      const status = err?.response?.status;
      return (
        status === 429 || // rate limited
        status === 503 || // service unavailable / pool guard
        status === 502 || // bad gateway (hosting edge)
        status === 504 || // gateway timeout
        status === 500 || // occasional server hiccup
        err?.code === 'ECONNABORTED' || // timeout
        err?.message === 'Network Error'
      );
    }
  } = options;

  let attempt = 0;
  let wait = Math.max(0, delay);
  let lastError;

  // Small jitter to avoid thundering herd
  const jitter = () => Math.floor(Math.random() * 100);

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === retries || !retryOn(err)) {
        throw err;
      }
      // Wait with exponential backoff + jitter
      await new Promise((res) => setTimeout(res, wait + jitter()));
      wait = Math.min(wait * backoff, 3000);
      attempt += 1;
    }
  }

  // Should not reach here; throw last error as fallback
  throw lastError;
}

export default withRetry;
