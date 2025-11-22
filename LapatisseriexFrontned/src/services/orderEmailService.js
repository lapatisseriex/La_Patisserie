// orderEmailService.js
// Frontend helper to trigger Vercel email API after successful order creation.

export async function sendOrderPlacedEmail({ orderNumber, userEmail, paymentMethod, grandTotal }) {
  try {
    console.log('\n📧 ===== ORDER CONFIRMATION EMAIL - FRONTEND =====');
    console.log('📦 Input Parameters:', {
      orderNumber,
      userEmail,
      paymentMethod,
      grandTotal
    });

    const base = (import.meta.env.VITE_VERCEL_API_URL || '').replace(/\/$/, '');
    console.log('🔗 Vercel API URL:', base || 'NOT CONFIGURED');
    
    if (!base) {
      console.warn('❌ VITE_VERCEL_API_URL not configured – skipping order placed email');
      return { skipped: true };
    }
    if (!orderNumber || !userEmail) {
      console.warn('❌ Missing required fields:', {
        hasOrderNumber: !!orderNumber,
        hasUserEmail: !!userEmail
      });
      return { skipped: true };
    }

    const payload = {
      orderNumber,
      userEmail,
      paymentMethod,
      grandTotal
    };
    console.log('📧 Email Payload:', JSON.stringify(payload, null, 2));

    const requestUrl = `${base}/email-dispatch/order-placed`;
    console.log('🚀 Sending POST request to:', requestUrl);

    const res = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    console.log('📡 Response Status:', res.status, res.statusText);
    console.log('📡 Response Headers:', Object.fromEntries(res.headers.entries()));

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('❌ Email API failed:', {
        status: res.status,
        statusText: res.statusText,
        errorText: text
      });
      throw new Error(`Email API failed (${res.status}): ${text || res.statusText}`);
    }

    const data = await res.json().catch(() => ({}));
    console.log('✅ ===== ORDER CONFIRMATION EMAIL SENT =====');
    console.log('📨 Response Data:', JSON.stringify(data, null, 2));
    console.log('===========================================\n');
    return data;
  } catch (err) {
    console.error('\n❌ ===== ORDER CONFIRMATION EMAIL ERROR =====');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    console.error('============================================\n');
    return { success: false, error: err.message };
  }
}
