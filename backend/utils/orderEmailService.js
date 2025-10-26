import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOrderStatusEmailTemplate } from './orderEmailTemplates.js';
import { generateInvoicePdf } from './invoicePdf.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to create logo attachment from provided logo data or fallback to public URL
const createLogoAttachment = (logoData) => {
  try {
    if (logoData) {
      console.log('✅ Creating logo attachment from provided data');
      console.log('📧 Using CID: logo@lapatisserie for embedded image');
      
      return {
        filename: 'logo.png',
        content: logoData, // Use provided logo data
        cid: 'logo@lapatisserie'
      };
    } else {
      // Fallback: Read logo from public directory
      console.log('⚠️  No logo data provided, using public directory fallback');
      const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
      
      if (fs.existsSync(logoPath)) {
        console.log('✅ Logo file found in public directory:', logoPath);
        console.log('📧 Using CID: logo@lapatisserie for embedded image');
        
        return {
          filename: 'logo.png',
          path: logoPath,
          cid: 'logo@lapatisserie'
        };
      } else {
        console.log('⚠️  Logo file not found in public directory either');
        return null;
      }
    }
  } catch (error) {
    console.error('❌ Error creating logo attachment:', error);
    return null;
  }
};

// Create transporter with enhanced configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    pool: true, // Use connection pooling
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 20000, // 20 seconds
    rateLimit: 5 // max 5 messages per rateDelta
  });
};

// Simple minimal email template with brand and yellow track button
const buildMinimalEmailHTML = (brandName, orderNumber, trackUrl, logoCid) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${brandName} – Order #${orderNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body { 
          margin: 0; 
          padding: 0; 
          background: linear-gradient(135deg, #fef3c7 0%, #ffffff 50%, #fce7f3 100%); 
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          color: #111827; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 40px 24px; 
        }
        .brandRow { 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 16px; 
          margin-bottom: 32px; 
          padding: 24px; 
          background: #ffffff; 
          border-radius: 16px; 
          box-shadow: 0 4px 12px rgba(115, 56, 87, 0.12); 
        }
        .brandLogo { 
          width: 50px; 
          height: 50px; 
          object-fit: contain; 
        }
        .brand { 
          font-size: 28px; 
          font-weight: 700; 
          letter-spacing: 0.02em; 
          background: linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .card { 
          border: 2px solid #733857; 
          border-radius: 16px; 
          padding: 40px 32px; 
          background: #ffffff; 
          box-shadow: 0 10px 30px rgba(115, 56, 87, 0.15);
          text-align: center;
        }
        .order-badge {
          display: inline-block;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
          padding: 10px 24px;
          border-radius: 24px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 16px;
          border: 1px solid #fbbf24;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
        }
        .title { 
          font-size: 26px; 
          font-weight: 700; 
          text-align: center; 
          margin: 0 0 12px 0; 
          color: #733857; 
          letter-spacing: 0.01em;
        }
        .muted { 
          text-align: center; 
          color: #6b7280; 
          font-size: 15px; 
          margin: 0 0 28px 0; 
          line-height: 1.7;
        }
        .cta-wrap { 
          text-align: center; 
          margin-top: 16px; 
        }
        .cta { 
          display: inline-block; 
          background: linear-gradient(135deg, #facc15 0%, #fbbf24 100%); 
          color: #000000; 
          text-decoration: none; 
          font-weight: 700; 
          padding: 16px 40px; 
          border-radius: 12px; 
          border: 2px solid #f59e0b;
          font-size: 16px;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 14px rgba(251, 191, 36, 0.4);
          text-transform: uppercase;
        }
        .cta:hover {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        }
        .footer { 
          text-align: center; 
          color: #9ca3af; 
          font-size: 13px; 
          margin-top: 32px; 
          padding: 20px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 12px;
          line-height: 1.7;
        }
        .footer a {
          color: #733857;
          text-decoration: none;
          word-break: break-all;
          font-weight: 500;
        }
        .divider {
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, #733857 50%, transparent 100%);
          margin: 24px 0;
          opacity: 0.3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="brandRow">
          ${logoCid ? `<img class="brandLogo" src="cid:${logoCid}" alt="${brandName} logo" />` : ''}
          <div class="brand">${brandName}</div>
        </div>
        <div class="card">
          <div>
            <span class="order-badge">✓ Order Confirmed</span>
          </div>
          <h1 class="title">Order #${orderNumber}</h1>
          <div class="divider"></div>
          <p class="muted">
            Thank you for your order! Your detailed invoice is attached to this email.<br>
            Click the button below to track your order status and delivery.
          </p>
          <div class="cta-wrap">
            <a class="cta" href="${trackUrl}">Track Your Order</a>
          </div>
        </div>
        <div class="footer">
          <strong>Need help?</strong><br>
          If the button doesn't work, copy and paste this link:<br>
          <a href="${trackUrl}">${trackUrl}</a>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send order status update notification
export const sendOrderStatusNotification = async (orderDetails, newStatus, userEmail, logoData = null, productImagesData = []) => {
  try {
    const transporter = createTransporter();
    
    const orderNumber = orderDetails?.orderNumber || '';
    const brandName = 'La Pâtisserie';
    const trackUrl = `https://www.lapatisserie.shop/orders/${orderNumber}`;
    
    // Create logo attachment from provided data
    const logoAttachment = createLogoAttachment(logoData);
    const logoCid = logoAttachment ? logoAttachment.cid : null;
    
    // Generate invoice PDF
    const attachments = [];
    if (logoAttachment) attachments.push(logoAttachment);
    
    try {
      const { filename, buffer } = await generateInvoicePdf(orderDetails);
      attachments.push({ filename, content: buffer, contentType: 'application/pdf' });
    } catch (e) {
      console.error('Failed to generate invoice PDF:', e.message);
    }

    const mailOptions = {
      from: {
        name: 'La Patisserie',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: `Order #${orderNumber} — Update`,
      html: buildMinimalEmailHTML(brandName, orderNumber, trackUrl, logoCid),
      attachments,
      headers: {
        'X-Order-Number': orderNumber,
        'X-Status-Update': newStatus,
        'X-Priority': 'high'
      }
    };

    console.log(`Sending order status email to ${userEmail} for order ${orderNumber}`);
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('Order status email sent successfully:', {
      messageId: result.messageId,
      orderNumber,
      newStatus,
      recipient: userEmail
    });

    return {
      success: true,
      messageId: result.messageId,
      orderNumber,
      status: newStatus,
      recipient: userEmail
    };

  } catch (error) {
    console.error('Error sending order status email:', {
      error: error.message,
      orderNumber: orderDetails.orderNumber,
      newStatus,
      recipient: userEmail
    });

    return {
      success: false,
      error: error.message,
      orderNumber: orderDetails.orderNumber,
      status: newStatus,
      recipient: userEmail
    };
  }
};

// Send order confirmation email (when order is first created) - UPDATED
export const sendOrderConfirmationEmail = async (orderDetails, userEmail, logoData = null, productImagesData = []) => {
  try {
    const transporter = createTransporter();
    
    const orderNumber = orderDetails?.orderNumber || '';
    const brandName = 'La Pâtisserie';
    const trackUrl = `https://www.lapatisserie.shop/orders/${orderNumber}`;
    
    // Create logo attachment from provided data
    const logoAttachment = createLogoAttachment(logoData);
    const logoCid = logoAttachment ? logoAttachment.cid : null;
    
    // Generate invoice PDF
    const attachments = [];
    if (logoAttachment) attachments.push(logoAttachment);
    
    try {
      const { filename, buffer } = await generateInvoicePdf(orderDetails);
      attachments.push({ filename, content: buffer, contentType: 'application/pdf' });
    } catch (e) {
      console.error('Failed to generate invoice PDF:', e.message);
    }

    const mailOptions = {
      from: {
        name: 'La Patisserie',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: `Order Confirmation — #${orderNumber}`,
      html: buildMinimalEmailHTML(brandName, orderNumber, trackUrl, logoCid),
      attachments
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('Order confirmation email sent successfully:', {
      messageId: result.messageId,
      orderNumber,
      recipient: userEmail
    });

    return {
      success: true,
      messageId: result.messageId,
      orderNumber,
      recipient: userEmail
    };

  } catch (error) {
    console.error('Error sending order confirmation email:', {
      error: error.message,
      orderNumber: orderDetails.orderNumber,
      recipient: userEmail
    });

    return {
      success: false,
      error: error.message,
      orderNumber: orderDetails.orderNumber,
      recipient: userEmail
    };
  }
};

// OLD IMPLEMENTATION BELOW - Will be replaced
const OLD_sendOrderConfirmationEmail = async (orderDetails, userEmail, logoData = null, productImagesData = []) => {
  try {
    const transporter = createTransporter();
    
    // Create logo attachment from provided data
    const logoAttachment = createLogoAttachment(logoData);
    const logoCid = logoAttachment ? logoAttachment.cid : null;
    
    // Create product image attachments from provided data
    const productAttachments = [];
    if (Array.isArray(productImagesData) && productImagesData.length > 0) {
      productImagesData.forEach((imageData, index) => {
        if (imageData && imageData.content) {
          productAttachments.push({
            filename: imageData.filename || `product-${index}.jpg`,
            content: imageData.content,
            cid: imageData.cid || `product-${index}@lapatisserie`
          });
        }
      });
    }
    
    // Get email template for the new status with logo CID
    const emailTemplate = await getOrderStatusEmailTemplate(orderDetails, newStatus, logoCid);
    
    if (!emailTemplate) {
      throw new Error(`No email template found for status: ${newStatus}`);
    }

    // Combine all attachments
    const attachments = [];
    if (logoAttachment) {
      attachments.push(logoAttachment);
    }
    if (productAttachments.length > 0) {
      attachments.push(...productAttachments);
    }

    const mailOptions = {
      from: {
        name: 'La Patisserie',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      // Add logo and product images as attachments
      attachments: attachments,
      // Add tracking for better delivery
      headers: {
        'X-Order-Number': orderDetails.orderNumber,
        'X-Status-Update': newStatus,
        'X-Priority': 'high'
      }
    };

    console.log(`Sending order status email to ${userEmail} for order ${orderDetails.orderNumber} - Status: ${newStatus}`);
    console.log(`📧 Attachments: ${attachments.length} (Logo: ${!!logoAttachment}, Products: ${productAttachments.length})`);
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('Order status email sent successfully:', {
      messageId: result.messageId,
      orderNumber: orderDetails.orderNumber,
      newStatus,
      recipient: userEmail,
      attachmentsCount: attachments.length
    });

    return {
      success: true,
      messageId: result.messageId,
      orderNumber: orderDetails.orderNumber,
      status: newStatus,
      recipient: userEmail,
      attachmentsCount: attachments.length
    };

  } catch (error) {
    console.error('Error sending order status email:', {
      error: error.message,
      orderNumber: orderDetails.orderNumber,
      newStatus,
      recipient: userEmail
    });

    // Don't throw error to prevent order update failure
    // Just log the email sending failure
    return {
      success: false,
      error: error.message,
      orderNumber: orderDetails.orderNumber,
      status: newStatus,
      recipient: userEmail
    };
  }
};


const formatStatusLabel = (status) => {
  if (!status) return 'Status';
  return status
    .split('_')
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const buildAdminItemsTable = (cartItems = []) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return "<tr><td colspan='3' style='padding: 8px; text-align: center; color: #6B7280;'>No items recorded</td></tr>";
  }

  return cartItems.map(item => `
    <tr>
      <td style='padding: 8px; border-bottom: 1px solid #f3f4f6;'>
        ${item.productName || 'Item'}
      </td>
      <td style='padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: center;'>
        ${item.quantity || 0}
      </td>
      <td style='padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: right;'>
        ₹${(((item.price || 0) * (item.quantity || 0)) || 0).toFixed(2)}
      </td>
    </tr>
  `).join('');
};

const buildAdminOrderHeader = (orderDetails = {}) => {
  const customerName = orderDetails?.userDetails?.name || orderDetails?.userId?.name || 'Customer';
  const customerPhone = orderDetails?.userDetails?.phone || orderDetails?.userId?.phone || 'Not provided';
  const delivery = orderDetails?.deliveryLocation || 'Not provided';
  const hostel = orderDetails?.hostelName || 'Not provided';

  return `
    <div style='margin-bottom: 20px;'>
      <p style='margin: 4px 0; color: #1F2937;'><strong>Customer:</strong> ${customerName}</p>
      <p style='margin: 4px 0; color: #1F2937;'><strong>Phone:</strong> ${customerPhone}</p>
      <p style='margin: 4px 0; color: #1F2937;'><strong>Delivery:</strong> ${delivery}</p>
      <p style='margin: 4px 0; color: #1F2937;'><strong>Hostel:</strong> ${hostel}</p>
    </div>
  `;
};

export const sendOrderPlacedAdminNotification = async (orderDetails, adminEmails) => {
  if (!Array.isArray(adminEmails) || adminEmails.length === 0) {
    return { success: false, skipped: true, reason: 'No admin recipients' };
  }

  try {
    const transporter = createTransporter();
    const { orderNumber, orderSummary, cartItems, paymentMethod, orderStatus, createdAt } = orderDetails;
    const customerEmail = orderDetails?.userDetails?.email || orderDetails?.userId?.email || 'Not provided';

    // Generate invoice PDF
    const attachments = [];
    try {
      const { filename, buffer } = await generateInvoicePdf(orderDetails);
      attachments.push({ filename, content: buffer, contentType: 'application/pdf' });
    } catch (e) {
      console.error('Failed to generate invoice PDF for admin:', e.message);
    }

    const mailOptions = {
      from: {
        name: 'La Patisserie Alerts',
        address: process.env.EMAIL_USER
      },
      to: adminEmails,
      subject: `🔔 New Order #${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>La Pâtisserie – Order #${orderNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              margin: 0; 
              padding: 0; 
              background: linear-gradient(135deg, #fef3c7 0%, #ffffff 50%, #fce7f3 100%); 
              font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              color: #111827; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 40px 24px; 
            }
            .brandRow { 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              gap: 16px; 
              margin-bottom: 32px; 
              padding: 24px; 
              background: #ffffff; 
              border-radius: 16px; 
              box-shadow: 0 4px 12px rgba(115, 56, 87, 0.12); 
            }
            .brand { 
              font-size: 28px; 
              font-weight: 700; 
              letter-spacing: 0.02em; 
              background: linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .card { 
              border: 2px solid #733857; 
              border-radius: 16px; 
              padding: 40px 32px; 
              background: #ffffff; 
              box-shadow: 0 10px 30px rgba(115, 56, 87, 0.15);
              text-align: center;
            }
            .admin-badge {
              display: inline-block;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: #ffffff;
              padding: 10px 24px;
              border-radius: 24px;
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              margin-bottom: 16px;
              border: 1px solid #b91c1c;
              box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
            }
            .title { 
              font-size: 26px; 
              font-weight: 700; 
              text-align: center; 
              margin: 0 0 12px 0; 
              color: #733857; 
              letter-spacing: 0.01em;
            }
            .muted { 
              text-align: center; 
              color: #6b7280; 
              font-size: 15px; 
              margin: 0 0 28px 0; 
              line-height: 1.7;
            }
            .cta-wrap { 
              text-align: center; 
              margin-top: 16px; 
            }
            .cta { 
              display: inline-block; 
              background: linear-gradient(135deg, #facc15 0%, #fbbf24 100%); 
              color: #000000; 
              text-decoration: none; 
              font-weight: 700; 
              padding: 16px 40px; 
              border-radius: 12px; 
              border: 2px solid #f59e0b;
              font-size: 16px;
              letter-spacing: 0.05em;
              box-shadow: 0 4px 14px rgba(251, 191, 36, 0.4);
              text-transform: uppercase;
            }
            .cta:hover {
              background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            }
            .footer { 
              text-align: center; 
              color: #9ca3af; 
              font-size: 13px; 
              margin-top: 32px; 
              padding: 20px;
              background: rgba(255, 255, 255, 0.7);
              border-radius: 12px;
              line-height: 1.7;
            }
            .divider {
              height: 2px;
              background: linear-gradient(90deg, transparent 0%, #733857 50%, transparent 100%);
              margin: 24px 0;
              opacity: 0.3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="brandRow">
              <div class="brand">La Pâtisserie</div>
            </div>
            <div class="card">
              <div>
                <span class="admin-badge">🔔 New Order Alert</span>
              </div>
              <h1 class="title">Order #${orderNumber}</h1>
              <div class="divider"></div>
              <p class="muted">
                A new order has been placed. The detailed invoice is attached to this email.<br>
                Customer: ${orderDetails?.userDetails?.name || 'N/A'} | Total: ₹${(orderSummary?.grandTotal ?? 0).toFixed(2)}<br>
                Placed at: ${new Date(createdAt || Date.now()).toLocaleString()}
              </p>
              <div class="cta-wrap">
                <a class="cta" href="https://www.lapatisserie.shop/admin/orders">View Orders Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <strong>Admin Notification</strong><br>
              Payment: ${(paymentMethod || 'N/A').toUpperCase()} | Status: ${formatStatusLabel(orderStatus)}<br>
              Email: ${customerEmail}
            </div>
          </div>
        </body>
        </html>
      `,
      attachments
    };

    const result = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: result.messageId,
      orderNumber,
      recipients: adminEmails
    };
  } catch (error) {
    console.error('Error sending admin order placed email:', {
      error: error.message,
      orderNumber: orderDetails?.orderNumber
    });

    return {
      success: false,
      error: error.message,
      orderNumber: orderDetails?.orderNumber
    };
  }
};

export const sendAdminOrderStatusNotification = async (orderDetails, newStatus, adminEmails) => {
  if (!Array.isArray(adminEmails) || adminEmails.length === 0) {
    return { success: false, skipped: true, reason: 'No admin recipients' };
  }

  try {
    const transporter = createTransporter();
    const { orderNumber, orderSummary, cartItems } = orderDetails;
    const statusLabel = formatStatusLabel(newStatus);

    const statusMessages = {
      confirmed: 'Kitchen has confirmed the order and preparation will begin shortly.',
      preparing: 'Kitchen has started preparing the items.',
      ready: 'The order is ready for dispatch or pickup.',
      out_for_delivery: 'The delivery team has collected the order.',
      delivered: 'The customer has received the complete order.'
    };

    // Generate invoice PDF
    const attachments = [];
    try {
      const { filename, buffer } = await generateInvoicePdf(orderDetails);
      attachments.push({ filename, content: buffer, contentType: 'application/pdf' });
    } catch (e) {
      console.error('Failed to generate invoice PDF for admin:', e.message);
    }

    const mailOptions = {
      from: {
        name: 'La Patisserie Alerts',
        address: process.env.EMAIL_USER
      },
      to: adminEmails,
      subject: `📦 Order #${orderNumber} - ${statusLabel}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>La Pâtisserie – Order #${orderNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              margin: 0; 
              padding: 0; 
              background: linear-gradient(135deg, #fef3c7 0%, #ffffff 50%, #fce7f3 100%); 
              font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              color: #111827; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 40px 24px; 
            }
            .brandRow { 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              gap: 16px; 
              margin-bottom: 32px; 
              padding: 24px; 
              background: #ffffff; 
              border-radius: 16px; 
              box-shadow: 0 4px 12px rgba(115, 56, 87, 0.12); 
            }
            .brand { 
              font-size: 28px; 
              font-weight: 700; 
              letter-spacing: 0.02em; 
              background: linear-gradient(135deg, #733857 0%, #8d4466 50%, #412434 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .card { 
              border: 2px solid #733857; 
              border-radius: 16px; 
              padding: 40px 32px; 
              background: #ffffff; 
              box-shadow: 0 10px 30px rgba(115, 56, 87, 0.15);
              text-align: center;
            }
            .status-badge {
              display: inline-block;
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: #ffffff;
              padding: 10px 24px;
              border-radius: 24px;
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              margin-bottom: 16px;
              border: 1px solid #1d4ed8;
              box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
            }
            .title { 
              font-size: 26px; 
              font-weight: 700; 
              text-align: center; 
              margin: 0 0 12px 0; 
              color: #733857; 
              letter-spacing: 0.01em;
            }
            .muted { 
              text-align: center; 
              color: #6b7280; 
              font-size: 15px; 
              margin: 0 0 28px 0; 
              line-height: 1.7;
            }
            .cta-wrap { 
              text-align: center; 
              margin-top: 16px; 
            }
            .cta { 
              display: inline-block; 
              background: linear-gradient(135deg, #facc15 0%, #fbbf24 100%); 
              color: #000000; 
              text-decoration: none; 
              font-weight: 700; 
              padding: 16px 40px; 
              border-radius: 12px; 
              border: 2px solid #f59e0b;
              font-size: 16px;
              letter-spacing: 0.05em;
              box-shadow: 0 4px 14px rgba(251, 191, 36, 0.4);
              text-transform: uppercase;
            }
            .cta:hover {
              background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            }
            .footer { 
              text-align: center; 
              color: #9ca3af; 
              font-size: 13px; 
              margin-top: 32px; 
              padding: 20px;
              background: rgba(255, 255, 255, 0.7);
              border-radius: 12px;
              line-height: 1.7;
            }
            .divider {
              height: 2px;
              background: linear-gradient(90deg, transparent 0%, #733857 50%, transparent 100%);
              margin: 24px 0;
              opacity: 0.3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="brandRow">
              <div class="brand">La Pâtisserie</div>
            </div>
            <div class="card">
              <div>
                <span class="status-badge">📦 Status Update</span>
              </div>
              <h1 class="title">Order #${orderNumber}</h1>
              <div class="divider"></div>
              <p class="muted">
                Order status changed to: <strong>${statusLabel}</strong><br>
                ${statusMessages[newStatus] || 'Order status has been updated.'}<br>
                The detailed invoice is attached to this email.
              </p>
              <div class="cta-wrap">
                <a class="cta" href="https://www.lapatisserie.shop/admin/orders">View Orders Dashboard</a>
              </div>
            </div>
            <div class="footer">
              <strong>Admin Notification</strong><br>
              Customer: ${orderDetails?.userDetails?.name || 'N/A'} | Total: ₹${(orderSummary?.grandTotal ?? 0).toFixed(2)}
            </div>
          </div>
        </body>
        </html>
      `,
      attachments
    };

    const result = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: result.messageId,
      orderNumber,
      status: newStatus,
      recipients: adminEmails
    };
  } catch (error) {
    console.error('Error sending admin status email:', {
      error: error.message,
      orderNumber: orderDetails?.orderNumber,
      status: newStatus
    });

    return {
      success: false,
      error: error.message,
      orderNumber: orderDetails?.orderNumber,
      status: newStatus
    };
  }
};