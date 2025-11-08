import nodemailer from 'nodemailer';
import { sendPasswordResetOTP, sendSignupVerificationOTP } from '../utils/passwordResetService.js';
import { sendCustomNewsletter } from '../utils/newsletterEmailService.js';

// NOTE: Keep this file dead-simple for Vercel email sending.
// No delegation, no retries/timeouts. Just send the email.

const createTransporter = () => {
  // Prefer explicit SMTP settings from environment
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  // Fallbacks: allow 'gmail' shorthand via EMAIL_SERVICE, else basic gmail service
  if (String(process.env.EMAIL_SERVICE).toLowerCase() === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Last resort default to Gmail SMTP SSL if nothing provided
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
