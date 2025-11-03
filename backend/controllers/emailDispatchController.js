import { sendOrderConfirmationEmail, sendOrderPlacedAdminNotification, sendOrderStatusNotification } from '../utils/orderEmailService.js';
import { sendPasswordResetOTP, sendSignupVerificationOTP } from '../utils/passwordResetService.js';
import { sendCustomNewsletter } from '../utils/newsletterEmailService.js';
import { getLogoData } from '../utils/logoUtils.js';

// Each handler accepts a payload and triggers local nodemailer sending on this instance.
// This file enables a second server (Render) to delegate email work to this server (Vercel).

export const sendOrderConfirmation = async (req, res) => {
  try {
    const { orderDetails, userEmail } = req.body || {};
    if (!orderDetails || !userEmail) {
      return res.status(400).json({ success: false, message: 'orderDetails and userEmail are required' });
    }
    const logoData = getLogoData();
    const result = await sendOrderConfirmationEmail(orderDetails, userEmail, logoData);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const sendAdminOrderPlaced = async (req, res) => {
  try {
    const { orderDetails, adminEmails } = req.body || {};
    if (!orderDetails || !Array.isArray(adminEmails) || adminEmails.length === 0) {
      return res.status(400).json({ success: false, message: 'orderDetails and adminEmails[] are required' });
    }
    const result = await sendOrderPlacedAdminNotification(orderDetails, adminEmails);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const sendStatusUpdate = async (req, res) => {
  try {
    const { orderDetails, newStatus, userEmail } = req.body || {};
    if (!orderDetails || !newStatus || !userEmail) {
      return res.status(400).json({ success: false, message: 'orderDetails, newStatus and userEmail are required' });
    }
    const logoData = getLogoData();
    const result = await sendOrderStatusNotification(orderDetails, newStatus, userEmail, logoData);
    return res.status(200).json({ success: true, ...result });
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
