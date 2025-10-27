import nodemailer from 'nodemailer';
import { getWelcomeEmailTemplate } from './welcomeEmailTemplate.js';

// Create reusable transporter with enhanced configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'lapatisserielapatisserie@gmail.com',
      pass: process.env.EMAIL_PASS
    },
    pool: true, // Use connection pooling
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 20000, // 20 seconds
    rateLimit: 5 // max 5 messages per rateDelta
  });
};

/**
 * Send welcome email to new user
 * @param {Object} userDetails - User details containing name and email
 * @param {string} userDetails.name - User's name
 * @param {string} userDetails.email - User's email address
 * @returns {Promise<Object>} - Result of email sending operation
 */
export const sendWelcomeEmail = async (userDetails) => {
  try {
    const { name, email } = userDetails;

    if (!email) {
      throw new Error('Email is required to send welcome email');
    }

    console.log(`Preparing to send welcome email to ${email}`);

    // Get email template
    const { subject, html } = getWelcomeEmailTemplate({ 
      name: name || 'Valued Customer', 
      email 
    });

    // Create transporter
    const transporter = createTransporter();

    // Email options
    const mailOptions = {
      from: {
        name: 'La Pâtisserie',
        address: process.env.EMAIL_USER || 'lapatisserielapatisserie@gmail.com'
      },
      to: email,
      subject: subject,
      html: html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent successfully to ${email}: ${info.messageId}`);
    
    return { 
      success: true, 
      messageId: info.messageId,
      email: email
    };
  } catch (error) {
    console.error(`❌ Error sending welcome email to ${userDetails?.email}:`, error.message);
    return { 
      success: false, 
      error: error.message,
      email: userDetails?.email
    };
  }
};

export default sendWelcomeEmail;
