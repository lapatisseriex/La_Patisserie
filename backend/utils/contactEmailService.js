import nodemailer from 'nodemailer';

// Create transporter with enhanced configuration
const createTransporter = () => {
  // Use environment variables for email configuration
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use app password for Gmail
      },
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 20000, // 20 seconds
      rateLimit: 5 // max 5 messages per rateDelta
    });
  } else if (process.env.EMAIL_SERVICE === 'smtp') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 20000, // 20 seconds
      rateLimit: 5 // max 5 messages per rateDelta
    });
  } else {
    // Fallback to console logging in development
    console.warn('⚠️ No email service configured. Emails will be logged to console.');
    return {
      sendMail: async (mailOptions) => {
        console.log('📧 Email would be sent:', mailOptions);
        return { messageId: 'console-log-' + Date.now() };
      }
    };
  }
};

// Send contact notification email to admin(s)
export const sendContactNotificationEmail = async (contact, adminEmails) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: adminEmails,
      subject: `New Contact Message - ${contact.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; margin-bottom: 20px; }
            .content { background-color: #fff; padding: 20px; border: 1px solid #dee2e6; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #495057; }
            .value { margin-top: 5px; }
            .message-box { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; }
            .footer { margin-top: 20px; padding: 15px; background-color: #f8f9fa; font-size: 12px; color: #6c757d; }
            .btn { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔔 New Contact Message Received</h2>
              <p>A new message has been submitted through the contact form.</p>
            </div>
            
            <div class="content">
              <div class="field">
                <div class="label">From:</div>
                <div class="value">${contact.name} (${contact.email})</div>
              </div>
              
              ${contact.phone ? `
              <div class="field">
                <div class="label">Phone:</div>
                <div class="value">${contact.phone}</div>
              </div>
              ` : ''}
              
              <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${contact.subject}</div>
              </div>
              
              <div class="field">
                <div class="label">Date:</div>
                <div class="value">${new Date(contact.createdAt).toLocaleString()}</div>
              </div>
              
              <div class="field">
                <div class="label">Message:</div>
                <div class="message-box">${contact.message.replace(/\n/g, '<br>')}</div>
              </div>
              
              ${contact.ipAddress ? `
              <div class="field">
                <div class="label">IP Address:</div>
                <div class="value">${contact.ipAddress}</div>
              </div>
              ` : ''}
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/contacts/${contact._id}" class="btn">
                View in Dashboard
              </a>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from La Patisserie contact system.</p>
              <p>Contact ID: ${contact._id}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('❌ Error sending contact notification email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send reply email to user
export const sendContactReplyEmail = async (contact, replyMessage, admin) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: contact.email,
      subject: `Re: ${contact.subject} - La Patisserie`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; margin-bottom: 20px; text-align: center; }
            .content { background-color: #fff; padding: 20px; border: 1px solid #dee2e6; }
            .original-message { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #6c757d; margin: 20px 0; }
            .reply-message { background-color: #e7f3ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
            .footer { margin-top: 20px; padding: 15px; background-color: #f8f9fa; font-size: 12px; color: #6c757d; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>La Patisserie</h2>
              <p>Thank you for contacting us!</p>
            </div>
            
            <div class="content">
              <p>Dear ${contact.name},</p>
              
              <p>Thank you for your message. We have reviewed your inquiry and here is our response:</p>
              
              <div class="reply-message">
                <strong>Our Reply:</strong><br>
                ${replyMessage.replace(/\n/g, '<br>')}
              </div>
              
              <div class="original-message">
                <strong>Your Original Message:</strong><br>
                <strong>Subject:</strong> ${contact.subject}<br>
                <strong>Date:</strong> ${new Date(contact.createdAt).toLocaleString()}<br>
                <strong>Message:</strong><br>
                ${contact.message.replace(/\n/g, '<br>')}
              </div>
              
              <p>If you have any further questions, please don't hesitate to contact us again.</p>
              
              <p>Best regards,<br>
              ${admin ? admin.name || 'La Patisserie Team' : 'La Patisserie Team'}</p>
            </div>
            
            <div class="footer">
              <p>This email was sent in response to your contact form submission.</p>
              <p>La Patisserie - Delicious Moments, Made Fresh</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('❌ Error sending contact reply email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Send weekly contact summary to admin
export const sendWeeklyContactSummary = async (adminEmails, stats, recentContacts) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: adminEmails,
      subject: 'Weekly Contact Summary - La Patisserie',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; margin-bottom: 20px; text-align: center; }
            .stats { display: flex; justify-content: space-between; margin: 20px 0; }
            .stat-item { text-align: center; padding: 15px; background-color: #f8f9fa; border-radius: 8px; }
            .stat-number { font-size: 24px; font-weight: bold; color: #007bff; }
            .contact-item { padding: 10px; border-bottom: 1px solid #dee2e6; }
            .footer { margin-top: 20px; padding: 15px; background-color: #f8f9fa; font-size: 12px; color: #6c757d; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📊 Weekly Contact Summary</h2>
              <p>Contact activity for the past 7 days</p>
            </div>
            
            <div class="stats">
              <div class="stat-item">
                <div class="stat-number">${stats.total || 0}</div>
                <div>Total Messages</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${stats.unread || 0}</div>
                <div>Unread</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${stats.resolved || 0}</div>
                <div>Resolved</div>
              </div>
            </div>
            
            ${recentContacts && recentContacts.length > 0 ? `
            <h3>Recent Messages</h3>
            ${recentContacts.map(contact => `
              <div class="contact-item">
                <strong>${contact.name}</strong> (${contact.email})<br>
                <strong>Subject:</strong> ${contact.subject}<br>
                <strong>Date:</strong> ${new Date(contact.createdAt).toLocaleDateString()}<br>
                <strong>Status:</strong> ${contact.status}
              </div>
            `).join('')}
            ` : '<p>No recent messages this week.</p>'}
            
            <div class="footer">
              <p>La Patisserie Contact Management System</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('❌ Error sending weekly contact summary:', error);
    return {
      success: false,
      error: error.message
    };
  }
};