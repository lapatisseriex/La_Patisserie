// orderEmailService.js
// Frontend helper to trigger Vercel email API after successful order creation.

export async function sendOrderPlacedEmail({ orderNumber, userEmail, paymentMethod, grandTotal }) {
  try {
    const base = (import.meta.env.VITE_VERCEL_API_URL || '').replace(/\/$/, '');
    if (!base) {
      console.warn('[Email] VITE_VERCEL_API_URL not configured – skipping order placed email');
      return { skipped: true };
    }
    if (!orderNumber || !userEmail) {
      console.warn('[Email] Missing orderNumber or userEmail – skipping');
      return { skipped: true };
    }

    const payload = {
      orderNumber,
      userEmail,
      paymentMethod,
      grandTotal
    };

    const res = await fetch(`${base}/email-dispatch/order-placed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Email API failed (${res.status}): ${text || res.statusText}`);
    }

    const data = await res.json().catch(() => ({}));
    console.log('[Email] Order placed email sent:', data);
    return data;
  } catch (err) {
    console.warn('[Email] Failed to send order placed email:', err.message);
    return { success: false, error: err.message };
  }
}
