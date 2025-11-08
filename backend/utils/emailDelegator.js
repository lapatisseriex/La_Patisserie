// Centralized email delegation helper to route email tasks to a remote API (e.g., Vercel)
// without modifying or formatting the provided API base URL.

// Node 18+ provides global fetch

const getEmailDelegateApiBase = () => {
  // Use the Vercel API URL if provided, or a custom EMAIL_API_URL.
  // DO NOT format or change the value; return exactly as configured.
  return process.env.VITE_VERCEL_API_URL || process.env.EMAIL_API_URL || null;
};

const isDelegationEnabled = () => {
  // Explicit toggle to enable delegation from this server
  // Set EMAIL_VIA_VERCEL=true on Render to route email tasks to Vercel
  return String(process.env.EMAIL_VIA_VERCEL || '').toLowerCase() === 'true';
};

/**
 * Delegate email sending to remote server
 * @param {string} endpoint - API endpoint
 * @param {Object} payload - Email payload
 * @returns {Promise<Object>} - Response from remote server
 */
const delegateEmailPost = async (endpoint, payload) => {
  const base = getEmailDelegateApiBase();
  if (!base) throw new Error('Email delegation base URL not configured');
  // IMPORTANT: Do not format base; simply concatenate
  const url = `${base}${endpoint}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.message || `Delegated email request failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
};

export { getEmailDelegateApiBase, isDelegationEnabled, delegateEmailPost };
