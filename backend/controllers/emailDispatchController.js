import nodemailer from 'nodemailer';
import { sendPasswordResetOTP, sendSignupVerificationOTP } from '../utils/passwordResetService.js';
import { sendCustomNewsletter } from '../utils/newsletterEmailService.js';

// NOTE: Keep this file dead-simple for Vercel email sending.
// No delegation, no retries/timeouts. Just send the email.

const createTransporter = () => {
  console.log('\n🔧 ===== CREATING EMAIL TRANSPORTER =====');
  console.log('📋 Environment Variables Check:');
  console.log('  - SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('  - SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('  - SMTP_SECURE:', process.env.SMTP_SECURE || 'NOT SET');
  console.log('  - SMTP_USER:', process.env.SMTP_USER ? '✓ SET' : 'NOT SET');
  console.log('  - SMTP_PASS:', process.env.SMTP_PASS ? '✓ SET (hidden)' : 'NOT SET');
  console.log('  - EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'NOT SET');
  console.log('  - EMAIL_USER:', process.env.EMAIL_USER ? `✓ SET (${process.env.EMAIL_USER})` : 'NOT SET');
  console.log('  - EMAIL_PASS:', process.env.EMAIL_PASS ? '✓ SET (hidden)' : 'NOT SET');

  // Prefer explicit SMTP settings from environment
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    
    console.log('✅ Using EXPLICIT SMTP Configuration:');
    console.log('  - Host:', process.env.SMTP_HOST);
    console.log('  - Port:', port);
    console.log('  - Secure:', secure);
    console.log('  - User:', user ? `✓ (${user})` : '❌ MISSING');
    console.log('  - Pass:', pass ? '✓ (length: ' + pass.length + ')' : '❌ MISSING');
    
    if (!user || !pass) {
      console.error('❌ ERROR: Missing authentication credentials!');
      console.error('   Set SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS in .env');
    }
    console.log('========================================\n');
    
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: user,
        pass: pass,
      },
    });
  }

  // Fallbacks: allow 'gmail' shorthand via EMAIL_SERVICE, else basic gmail service
  if (String(process.env.EMAIL_SERVICE).toLowerCase() === 'gmail') {
    console.log('✅ Using GMAIL SERVICE Configuration:');
    console.log('  - Service: gmail');
    console.log('  - User:', process.env.EMAIL_USER ? '✓' : 'MISSING');
    console.log('  - Pass:', process.env.EMAIL_PASS ? '✓' : 'MISSING');
    console.log('========================================\n');
    
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Last resort default to Gmail SMTP SSL if nothing provided
  console.log('⚠️ Using DEFAULT GMAIL SMTP Configuration (fallback):');
  console.log('  - Host: smtp.gmail.com');
  console.log('  - Port: 465');
  console.log('  - Secure: true');
  console.log('  - User:', process.env.EMAIL_USER ? '✓' : 'MISSING');
  console.log('  - Pass:', process.env.EMAIL_PASS ? '✓' : 'MISSING');
  console.log('========================================\n');
  
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const buildTrackUrl = (orderNumber) => {
  // Use production tracking link directly to avoid URL formatting issues
  return `https://www.lapatisserie.shop/orders/${orderNumber}`;
};

const minimalStatusUpdateHtml = (orderNumber, statusLabel, trackUrl) => `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Order #${orderNumber} – ${statusLabel}</title></head>
  <body style="margin:0;padding:20px;font-family:Arial,sans-serif;background:#f5f5f5;color:#333">
    <div style="max-width:600px;margin:0 auto;background:#fff;padding:24px;border:1px solid #e5e5e5">
      <h2 style="margin:0 0 8px 0;color:#111">Order Update</h2>
      <p style="margin:0 0 12px 0;color:#666">Order #${orderNumber}</p>
      <p style="margin:0 0 16px 0;color:#333">Status: <strong>${statusLabel}</strong></p>
      <p style="margin:16px 0;color:#333">Track your order: <a href="${trackUrl}" style="color:#111">${trackUrl}</a></p>
    </div>
  </body>
  </html>`;

const formatStatusLabel = (status) => {
  if (!status) return 'Update';
  return status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
};

// Each handler accepts a payload and triggers local nodemailer sending on this instance.
// This file enables a second server (Render) to delegate email work to this server (Vercel).

export const sendStatusUpdate = async (req, res) => {
  try {
    const { orderDetails, newStatus, userEmail } = req.body || {};
    if (!orderDetails || !newStatus || !userEmail) {
      return res.status(400).json({ success: false, message: 'orderDetails, newStatus and userEmail are required' });
    }

    const transporter = createTransporter();
    const orderNumber = orderDetails?.orderNumber || `ORDER-${Date.now()}`;
    const statusLabel = formatStatusLabel(newStatus);
    const trackUrl = buildTrackUrl(orderNumber);
    const html = minimalStatusUpdateHtml(orderNumber, statusLabel, trackUrl);
    const text = `Order Update\nOrder #${orderNumber}\nStatus: ${statusLabel}\nTrack your order: ${trackUrl}`;

    const info = await transporter.sendMail({
      from: { name: 'La Patisserie', address: process.env.EMAIL_USER },
      to: userEmail,
      subject: `Order #${orderNumber} - ${statusLabel}`,
      html,
      text,
    });

    return res.status(200).json({ success: true, messageId: info.messageId, orderNumber, status: newStatus });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const sendPasswordReset = async (req, res) => {
  try {
    const { userEmail, otp } = req.body || {};
    if (!userEmail || !otp) {
      return res.status(400).json({ success: false, message: 'userEmail and otp are required' });
    }
    const result = await sendPasswordResetOTP(userEmail, otp);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const sendSignupOtp = async (req, res) => {
  try {
    const { userEmail, otp } = req.body || {};
    if (!userEmail || !otp) {
      return res.status(400).json({ success: false, message: 'userEmail and otp are required' });
    }
    const result = await sendSignupVerificationOTP(userEmail, otp);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const sendNewsletter = async (req, res) => {
  try {
    const { subject, title, body, ctaText, ctaLink } = req.body || {};
    if (!subject || !body) {
      return res.status(400).json({ success: false, message: 'subject and body are required' });
    }
    const newsletterContent = { subject, title, body, ctaText, ctaLink };
    const result = await sendCustomNewsletter(newsletterContent);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- New: Order Placed Email (initial confirmation) ---
// Lightweight confirmation separate from status-update so frontend can call Vercel directly after DB order creation.
export const sendOrderPlacedEmail = async (req, res) => {
  try {
    console.log('\n📧 ===== ORDER CONFIRMATION EMAIL - BACKEND =====');
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    
    const { orderNumber, userEmail, paymentMethod, grandTotal } = req.body || {};
    
    console.log('📋 Extracted Parameters:');
    console.log('  - Order Number:', orderNumber);
    console.log('  - User Email:', userEmail);
    console.log('  - Payment Method:', paymentMethod);
    console.log('  - Grand Total:', grandTotal);
    
    if (!orderNumber || !userEmail) {
      console.error('❌ Missing required fields:', {
        hasOrderNumber: !!orderNumber,
        hasUserEmail: !!userEmail
      });
      return res.status(400).json({ success: false, message: 'orderNumber and userEmail are required' });
    }

    console.log('🔧 Creating email transporter...');
    const transporter = createTransporter();
    console.log('✅ Transporter created');
    
    console.log('🔗 Building tracking URL...');
    const trackUrl = buildTrackUrl(orderNumber);
    console.log('✅ Tracking URL:', trackUrl);
    
    const pmLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment';
    const totalLabel = typeof grandTotal === 'number' ? `₹${grandTotal}` : 'your selected amount';
    console.log('📝 Email Labels:', { pmLabel, totalLabel });

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f8f9fb;padding:0;margin:0;">`
      + `<div style="max-width:620px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e5e7eb">`
      + `<h2 style="margin:0 0 12px;color:#111">Order Confirmation</h2>`
      + `<p style="margin:0 0 8px;color:#374151">Thank you for your order at <strong>La Patisserie</strong>.</p>`
      + `<p style="margin:0 0 8px;color:#374151">Order Number: <strong>${orderNumber}</strong></p>`
      + `<p style="margin:0 0 8px;color:#374151">Payment Method: <strong>${pmLabel}</strong></p>`
      + `<p style="margin:0 0 16px;color:#374151">Total: <strong>${totalLabel}</strong></p>`
      + `<p style="margin:0 0 12px;color:#374151">You can track your order status here:</p>`
      + `<p style="margin:0 0 20px"><a href="${trackUrl}" style="color:#733857;text-decoration:none;font-weight:600">${trackUrl}</a></p>`
      + `<p style="margin:0 0 6px;color:#4b5563;font-size:12px">This is an automated message. Please do not reply.</p>`
      + `</div></body></html>`;
    const text = `Order Confirmation\nOrder Number: ${orderNumber}\nPayment Method: ${pmLabel}\nTotal: ${totalLabel}\nTrack: ${trackUrl}`;

    console.log('📧 Preparing email configuration...');
    const mailOptions = {
      from: { name: 'La Patisserie', address: process.env.EMAIL_USER },
      to: userEmail,
      subject: `Your La Patisserie Order ${orderNumber} Confirmed`,
      html,
      text
    };
    console.log('📬 Mail Options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      htmlLength: html.length,
      textLength: text.length
    });

    console.log('🚀 Sending email via transporter...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('📊 Response Info:', JSON.stringify(info, null, 2));

    console.log(`\n✅ ===== ORDER CONFIRMATION EMAIL SENT =====`);
    console.log(`   Recipient: ${userEmail}`);
    console.log(`   Order: ${orderNumber}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`==========================================\n`);

    return res.status(200).json({ success: true, messageId: info.messageId, orderNumber });
  } catch (err) {
    console.error('\n❌ ===== ORDER CONFIRMATION EMAIL ERROR =====');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    console.error('Full Error:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    console.error('============================================\n');
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- New: Order Dispatched Email ---
export const sendOrderDispatchedEmail = async (req, res) => {
  try {
    console.log('\n📧 ===== ORDER DISPATCH EMAIL REQUEST =====');
    console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
    
    const { orderNumber, userEmail, userName, dispatchType, itemsDispatched, totalItems } = req.body || {};
    
    console.log('📋 Extracted Parameters:');
    console.log('  - Order Number:', orderNumber);
    console.log('  - User Email:', userEmail);
    console.log('  - User Name:', userName);
    console.log('  - Dispatch Type:', dispatchType);
    console.log('  - Items Dispatched:', itemsDispatched);
    console.log('  - Total Items:', totalItems);
    
    if (!orderNumber || !userEmail) {
      console.error('❌ Missing required fields - orderNumber or userEmail');
      return res.status(400).json({ 
        success: false, 
        message: 'orderNumber and userEmail are required' 
      });
    }

    console.log('🔧 Creating email transporter...');
    const transporter = createTransporter();
    console.log('✅ Transporter created');
    
    console.log('🔗 Building tracking URL...');
    const trackUrl = buildTrackUrl(orderNumber);
    console.log('✅ Tracking URL:', trackUrl);
    
    // Determine dispatch message based on type
    console.log('📝 Building dispatch message...');
    let dispatchMessage = '';
    if (dispatchType === 'complete') {
      dispatchMessage = 'Your complete order has been dispatched and is on its way!';
    } else if (dispatchType === 'partial') {
      const dispatched = itemsDispatched || 0;
      const total = totalItems || dispatched;
      dispatchMessage = `${dispatched} out of ${total} items from your order have been dispatched.`;
    } else {
      dispatchMessage = 'Your order has been dispatched and is on its way!';
    }
    console.log('✅ Dispatch Message:', dispatchMessage);
    
    const greetingName = userName ? userName.split(' ')[0] : 'Valued Customer';
    console.log('👤 Greeting Name:', greetingName);

    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f8f9fb;padding:0;margin:0;">`
      + `<div style="max-width:620px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e5e7eb">`
      + `<h2 style="margin:0 0 12px;color:#111">Order Dispatched</h2>`
      + `<p style="margin:0 0 8px;color:#374151">Great news! ${dispatchMessage}</p>`
      + `<p style="margin:0 0 8px;color:#374151">Order Number: <strong>${orderNumber}</strong></p>`
      + `<p style="margin:0 0 16px;color:#374151">Status: <strong>Out for Delivery</strong></p>`
      + `<p style="margin:0 0 12px;color:#374151">Our delivery partner will reach you shortly. Please keep your phone handy for any delivery updates.</p>`
      + `<p style="margin:0 0 12px;color:#374151">You can track your order status here:</p>`
      + `<p style="margin:0 0 20px"><a href="${trackUrl}" style="color:#733857;text-decoration:none;font-weight:600">${trackUrl}</a></p>`
      + `<p style="margin:0 0 6px;color:#4b5563;font-size:12px">This is an automated message. Please do not reply.</p>`
      + `</div></body></html>`;
    const text = `Order Dispatched\n\n${dispatchMessage}\n\nOrder Number: ${orderNumber}\nStatus: Out for Delivery\n\nOur delivery partner will reach you shortly. Please keep your phone handy for any delivery updates.\n\nTrack: ${trackUrl}`;

    console.log('📧 Preparing email configuration...');
    const mailOptions = {
      from: { name: 'La Patisserie', address: process.env.EMAIL_USER },
      to: userEmail,
      subject: `Your Order ${orderNumber} is Out for Delivery!`,
      html,
      text
    };
    console.log('📬 Mail Options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      htmlLength: html.length,
      textLength: text.length
    });

    console.log('🚀 Sending email via transporter...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('📊 Response Info:', JSON.stringify(info, null, 2));

    console.log(`\n✅ ===== DISPATCH EMAIL SENT SUCCESSFULLY =====`);
    console.log(`   Recipient: ${userEmail}`);
    console.log(`   Order: ${orderNumber}`);
    console.log(`   Type: ${dispatchType}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`=============================================\n`);
    
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId, 
      orderNumber,
      dispatchType 
    });
  } catch (err) {
    console.error('\n❌ ===== DISPATCH EMAIL ERROR =====');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    console.error('Full Error:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    console.error('===================================\n');
    return res.status(500).json({ success: false, message: err.message });
  }
};
