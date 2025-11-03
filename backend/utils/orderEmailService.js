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

// Create transporter with simple configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Simple minimal email template
const buildMinimalEmailHTML = (brandName, orderNumber, trackUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${brandName} – Order #${orderNumber}</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border: 1px solid #ddd;">
        
        <h1 style="text-align: center; color: #333; margin-bottom: 10px;">${brandName}</h1>
        <p style="text-align: center; color: #666; font-size: 14px; margin-bottom: 30px;">Order #${orderNumber}</p>
        
        <p style="text-align: center; color: #555; font-size: 15px; margin: 30px 0;">
          Track your order: <a href="${trackUrl}" style="color: #333; text-decoration: underline;">${trackUrl}</a>
        </p>
        
        <p style="text-align: center; color: #666; font-size: 13px; margin-top: 30px;">
          Thank you for your order!<br>
          PDF invoice is attached to this email.
        </p>
        
      </div>
    </body>
    </html>
  `;
};

// Dispatch email template with delivery information
const buildDispatchEmailHTML = (brandName, orderNumber, trackUrl, orderDetails) => {
  const deliveryLocation = orderDetails?.deliveryLocation || 'your specified location';
  const hostelName = orderDetails?.hostelName || '';
  const deliveryAddress = hostelName ? `${deliveryLocation}, ${hostelName}` : deliveryLocation;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${brandName} – Order Dispatched!</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border: 1px solid #ddd; border-radius: 8px;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px; font-size: 28px;">${brandName}</h1>
          <p style="color: #666; font-size: 14px; margin: 5px 0;">Order #${orderNumber}</p>
        </div>
        
        <!-- Delivery Information -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 18px;">Delivery Details</h3>
          <p style="margin: 8px 0; color: #555; font-size: 15px; line-height: 1.6;">
            <strong>Delivering to:</strong><br>
            ${deliveryAddress}
          </p>
        </div>
        
        <!-- Message -->
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 10px 0;">
            Your delicious treats are on their way!
          </p>
          <p style="color: #777; font-size: 14px; line-height: 1.6; margin: 0;">
            Our delivery team will reach you shortly.
          </p>
        </div>
        
        <!-- Track Order Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackUrl}" style="display: inline-block; background: #333; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Track Your Order
          </a>
        </div>
        
        <!-- Footer Message -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999; font-size: 13px; margin: 5px 0;">
            Thank you for choosing ${brandName}!
          </p>
          <p style="color: #999; font-size: 12px; margin: 5px 0;">
            Questions? Contact us anytime.
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};

// Simple dispatch email template (no logo, no attachments, default styling)
const buildSimpleDispatchEmail = (orderNumber, deliveryAddress, trackUrl) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Dispatched</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 5px;">
        
        <h2 style="color: #333333; margin-top: 0;">Order Dispatched</h2>
        
        <p style="color: #555555; line-height: 1.6;">
          Your order <strong>#${orderNumber}</strong> has been dispatched and is on its way to you!
        </p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 3px solid #4CAF50; margin: 20px 0;">
          <p style="margin: 0; color: #333333; font-size: 14px;">
            <strong>Delivery Address:</strong><br>
            ${deliveryAddress}
          </p>
        </div>
        
        <p style="color: #555555; line-height: 1.6;">
          Our delivery team will reach you shortly. You can track your order status using the link below:
        </p>
        
        <p style="margin: 20px 0;">
          <a href="${trackUrl}" style="color: #1a73e8; text-decoration: none;">${trackUrl}</a>
        </p>
        
        <p style="color: #555555; line-height: 1.6;">
          Thank you for choosing La Patisserie!
        </p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="color: #999999; font-size: 12px; text-align: center; margin: 0;">
          If you have any questions, feel free to contact us.
        </p>
        
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
    
    // Special handling for dispatch emails - simple template, no attachments
    if (newStatus === 'out_for_delivery') {
      const trackUrl = `https://www.lapatisserie.shop/orders/${orderNumber}`;
      const deliveryAddress = orderDetails?.deliveryLocation || 'Your delivery location';
      
      const mailOptions = {
        from: {
          name: 'La Patisserie',
          address: process.env.EMAIL_USER
        },
        to: userEmail,
        subject: `Order #${orderNumber} - Dispatched`,
        html: buildSimpleDispatchEmail(orderNumber, deliveryAddress, trackUrl),
        headers: {
          'X-Order-Number': orderNumber,
          'X-Status-Update': newStatus,
          'X-Priority': 'high'
        }
      };

      console.log(`Sending simple dispatch email to ${userEmail} for order ${orderNumber}`);
      
      const result = await transporter.sendMail(mailOptions);
      
      console.log('Dispatch email sent successfully:', {
        messageId: result.messageId,
        orderNumber,
        recipient: userEmail
      });

      return {
        success: true,
        messageId: result.messageId,
        orderNumber,
        status: newStatus,
        recipient: userEmail
      };
    }
    
    // For other status updates, use the template-based system with attachments
    const logoCid = 'logo@lapatisserie';
    
    // Create logo attachment
    const logoAttachment = createLogoAttachment(logoData);
    
    // Create product image attachments with unique CIDs
    const productAttachments = productImagesData
      .map((imgData, index) => {
        if (!imgData || !imgData.buffer) return null;
        
        const cid = `product${index}@lapatisserie`;
        return {
          filename: imgData.filename || `product-${index}.jpg`,
          content: imgData.buffer,
          cid: cid
        };
      })
      .filter(Boolean);
    
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

// Send order confirmation email (when order is first created) - SIMPLE & ROBUST
export const sendOrderConfirmationEmail = async (orderDetails, userEmail, logoData = null, productImagesData = []) => {
  // Validate essential data first
  if (!userEmail) {
    console.error('❌ Cannot send order confirmation: no email provided');
    return { success: false, error: 'No email provided' };
  }

  const orderNumber = orderDetails?.orderNumber || `ORDER-${Date.now()}`;
  const brandName = 'La Pâtisserie';
  const trackUrl = `https://www.lapatisserie.shop/orders/${orderNumber}`;
  
  console.log(`📧 Attempting to send order confirmation email to ${userEmail} for order #${orderNumber}`);
  
  let transporter;
  try {
    // Create transporter first - if this fails, email can't be sent
    transporter = createTransporter();
    console.log('✅ Email transporter created');
  } catch (transportError) {
    console.error('❌ Failed to create email transporter:', transportError.message);
    return {
      success: false,
      error: `Transporter creation failed: ${transportError.message}`,
      orderNumber,
      recipient: userEmail
    };
  }
  
  // Generate invoice PDF (non-blocking - continue if fails)
  const attachments = [];
  if (orderDetails) {
    try {
      const { filename, buffer } = await generateInvoicePdf(orderDetails);
      attachments.push({ filename, content: buffer, contentType: 'application/pdf' });
      console.log(`✅ Invoice PDF generated: ${filename}`);
    } catch (e) {
      console.error('⚠️ Failed to generate invoice PDF (continuing without it):', e.message);
      // Continue without PDF - email is more important
    }
  } else {
    console.warn('⚠️ No order details provided - skipping PDF generation');
  }

  // Send email
  try {
    const mailOptions = {
      from: {
        name: 'La Patisserie',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: `Order Confirmation — #${orderNumber}`,
      html: buildMinimalEmailHTML(brandName, orderNumber, trackUrl),
      attachments
    };

    console.log('📤 Sending email now...');
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Order confirmation email sent successfully!', {
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
    console.error('❌ Error sending order confirmation email:', {
      error: error.message,
      stack: error.stack,
      orderNumber,
      recipient: userEmail
    });

    return {
      success: false,
      error: error.message,
      orderNumber,
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
      subject: `New Order #${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>New Order #${orderNumber}</title>
        </head>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border: 1px solid #ddd;">
            
            <div style="background: #333; color: #fff; padding: 15px; text-align: center; margin-bottom: 20px;">
              <strong>NEW ORDER ALERT</strong>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Order #${orderNumber}</h2>
            
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 10px;">
              <strong>Customer Email:</strong> ${customerEmail}
            </p>
            
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 10px;">
              <strong>Payment Method:</strong> ${paymentMethod || 'N/A'}
            </p>
            
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 10px;">
              <strong>Order Total:</strong> ₹${orderSummary?.grandTotal || 0}
            </p>
            
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              <strong>Order Date:</strong> ${createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}
            </p>
            
            <div style="margin-top: 30px; padding: 15px; background: #f5f5f5; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 13px;">Complete order details are attached in the PDF invoice.</p>
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
      subject: `Order #${orderNumber} - ${statusLabel}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Order Status Update #${orderNumber}</title>
        </head>
        <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border: 1px solid #ddd;">
            
            <div style="background: #333; color: #fff; padding: 15px; text-align: center; margin-bottom: 20px;">
              <strong>ORDER STATUS UPDATE</strong>
            </div>
            
            <h2 style="color: #333; margin-bottom: 10px;">Order #${orderNumber}</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 20px;"><strong>New Status:</strong> ${statusLabel}</p>
            
            <div style="padding: 15px; background: #f5f5f5; border-left: 4px solid #333; margin-bottom: 20px;">
              <p style="margin: 0; color: #555;">${statusMessages[newStatus] || 'Order status has been updated.'}</p>
            </div>
            
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
              <strong>Order Total:</strong> ₹${orderSummary?.grandTotal || 0}
            </p>
            
            <div style="margin-top: 30px; padding: 15px; background: #f5f5f5; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 13px;">Complete order details are attached in the PDF invoice.</p>
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