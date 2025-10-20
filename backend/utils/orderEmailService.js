import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getOrderStatusEmailTemplate } from './orderEmailTemplates.js';

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

// Send order status update notification
export const sendOrderStatusNotification = async (orderDetails, newStatus, userEmail, logoData = null, productImagesData = []) => {
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

// Send order confirmation email (when order is first created)
export const sendOrderConfirmationEmail = async (orderDetails, userEmail, logoData = null, productImagesData = []) => {
  try {
    const transporter = createTransporter();
    
    // Create logo attachment from provided data
    const logoAttachment = createLogoAttachment(logoData);
    const logoCid = logoAttachment ? logoAttachment.cid : null;
    
    // Create product image attachments from provided data
    const productAttachments = [];
    const productImageCids = {};
    
    if (Array.isArray(productImagesData) && productImagesData.length > 0) {
      productImagesData.forEach((imageData, index) => {
        if (imageData && imageData.content) {
          const cid = imageData.cid || `product-${index}@lapatisserie`;
          productAttachments.push({
            filename: imageData.filename || `product-${index}.jpg`,
            content: imageData.content,
            cid: cid
          });
          // Map product IDs to CIDs for template usage
          if (imageData.productId) {
            productImageCids[imageData.productId] = cid;
          }
        }
      });
    }
    
    const { orderNumber, cartItems, orderSummary, userDetails } = orderDetails;
    
    // Fetch product details for cart items to get images
    const Product = (await import('../models/productModel.js')).default;
    const itemsListPromises = cartItems.map(async (item) => {
      try {
        const product = await Product.findById(item.productId).select('name images featuredImage');
        const productImage = product?.featuredImage || 
                            (product?.images?.length > 0 ? product.images[0] : '');
        const productName = item.productName || product?.name || 'Item';
        
        // Use attached product image if available, otherwise use fetched image
        const productImageSrc = productImageCids[item.productId] 
          ? `cid:${productImageCids[item.productId]}` 
          : productImage;
        
        return `
        <tr style="border-bottom: 1px solid #f7e6cc;">
          <td style="padding: 16px 8px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${productImageSrc}" alt="${productName}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover; border: 2px solid #f7e6cc;">
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #281c20; font-size: 15px; line-height: 1.3; margin-bottom: 4px;">${productName}</div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6B7280;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #f59e0b;"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle></svg>
                  <span>Qty: ${item.quantity || 0}</span>
                  ${item.variantLabel ? `<span style="color: #f59e0b;">• ${item.variantLabel}</span>` : ''}
                </div>
              </div>
            </div>
          </td>
          <td style="padding: 16px 8px; text-align: right; font-weight: 600; color: #281c20; font-size: 15px;">
            ₹${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
          </td>
        </tr>
      `;
      } catch (error) {
        console.error('Error fetching product details for email:', error);
        // Fallback to basic item info
        return `
        <tr style="border-bottom: 1px solid #f7e6cc;">
          <td style="padding: 16px 8px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 48px; height: 48px; border-radius: 8px; background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%); border: 2px solid #f7e6cc; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 14px; color: #f59e0b;">🍰</span>
              </div>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #281c20; font-size: 15px; line-height: 1.3; margin-bottom: 4px;">${item.productName || 'Item'}</div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #6B7280;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #f59e0b;"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle></svg>
                  <span>Qty: ${item.quantity || 0}</span>
                  ${item.variantLabel ? `<span style="color: #f59e0b;">• ${item.variantLabel}</span>` : ''}
                </div>
              </div>
            </div>
          </td>
          <td style="padding: 16px 8px; text-align: right; font-weight: 600; color: #281c20; font-size: 15px;">
            ₹${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
          </td>
        </tr>
      `;
      }
    });
    
    const itemsListResults = await Promise.all(itemsListPromises);
    const itemsList = itemsListResults.join('');

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
      subject: `Order Received - ${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <title>Order Received - ${orderNumber}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              margin: 0; 
              padding: 0; 
              background: #ffffff;
              font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #281c20;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
            table {
              border-collapse: collapse;
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
            img {
              -ms-interpolation-mode: bicubic;
              border: 0;
              height: auto;
              line-height: 100%;
              outline: none;
              text-decoration: none;
            }
            .email-container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #ffffff;
              border-radius: 0; 
              overflow: hidden; 
              box-shadow: none;
              border: none;
            }
            .header { 
              background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 50%, #fdfbf9 100%);
              color: #281c20; 
              padding: 32px 32px; 
              text-align: center; 
              position: relative;
              border-bottom: 3px solid #f7e6cc;
            }
            .header::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 2px;
              background: linear-gradient(90deg, transparent, #f59e0b, transparent);
            }
            .logo-section {
              display: table;
              margin: 0 auto;
            }
            .logo-image {
              width: 60px;
              height: 60px;
              object-fit: contain;
              display: inline-block;
              vertical-align: middle;
              margin-right: 16px;
            }
            .brand-name {
              font-size: 24px;
              font-weight: 300;
              letter-spacing: 0.15em;
              text-transform: uppercase;
              color: #281c20;
              display: inline-block;
              vertical-align: middle;
              line-height: 60px;
            }
            .order-received-section {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              margin-bottom: 16px;
            }
            .celebration-icon {
              width: 32px;
              height: 32px;
              color: #10B981;
              display: block;
            }
            .celebration-title {
              font-size: 28px;
              font-weight: 600;
              color: #281c20;
              margin: 0;
            }
            .order-number {
              font-size: 16px;
              opacity: 0.8;
              margin: 8px 0 0 0;
              color: #92400e;
            }
            .content { 
              padding: 40px 32px;
              background: #ffffff;
            }
            .greeting {
              font-size: 18px;
              color: #281c20;
              margin-bottom: 16px;
              font-weight: 500;
            }
            .message {
              font-size: 16px;
              line-height: 1.7;
              color: #92400e;
              margin-bottom: 32px;
            }
            .order-details { 
              background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%);
              border: 2px solid #f7e6cc;
              border-radius: 12px; 
              margin: 32px 0;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(147, 51, 234, 0.1);
            }
            .order-details-header {
              background: linear-gradient(135deg, #fff5f0 0%, #fdfbf9 100%);
              padding: 20px 24px;
              border-bottom: 2px solid #f7e6cc;
            }
            .order-details-title {
              font-size: 18px;
              font-weight: 600;
              color: #281c20;
              margin: 0;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .order-table {
              width: 100%;
              border-collapse: collapse;
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
            .table-header {
              background: linear-gradient(135deg, #fff5f0 0%, #fdfbf9 100%);
            }
            .table-header th {
              padding: 16px 12px;
              text-align: left;
              font-weight: 600;
              color: #92400e;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .table-header th:last-child {
              text-align: right;
            }
            .order-summary {
              padding: 24px;
              background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 50%, #fdfbf9 100%);
              border-radius: 12px;
              box-shadow: 0 2px 8px rgba(147, 51, 234, 0.08);
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              font-size: 15px;
              color: #92400e;
              padding: 8px 0;
            }
            .summary-row.total {
              padding: 16px;
              margin: 12px -8px 0 -8px;
              border-radius: 8px;
              background: linear-gradient(135deg, #fff5f0 0%, #fdfbf9 100%);
              border: 2px solid #f7e6cc;
              font-size: 18px;
              font-weight: 700;
              color: #281c20;
              letter-spacing: 0.025em;
            }
            .cta-section {
              text-align: center;
              margin: 40px 0;
              padding: 32px 24px;
              background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%);
              border-radius: 12px;
            }
            .cta-button {
              display: inline-flex;
              align-items: center;
              gap: 10px;
              background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%);
              color: #281c20;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 15px;
              transition: all 0.3s ease;
              letter-spacing: 0.025em;
              box-shadow: 0 4px 12px rgba(147, 51, 234, 0.15);
              border: 2px solid #f7e6cc;
            }
            .footer { 
              background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 50%, #fdfbf9 100%);
              color: #281c20; 
              padding: 32px 24px; 
              text-align: center; 
              font-size: 14px;
              border-top: 3px solid #f7e6cc;
            }
            .footer-brand {
              font-size: 20px;
              font-weight: 300;
              letter-spacing: 0.1em;
              margin-bottom: 8px;
              color: #281c20;
            }
            .footer-tagline {
              opacity: 0.8;
              margin-bottom: 16px;
              color: #92400e;
            }
            
            /* Outlook specific styles */
            table[class="body"] {
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
            }
            
            /* Mobile responsive styles */
            @media only screen and (max-width: 620px) {
              .email-container {
                margin: 0 !important;
                border-radius: 0 !important;
                width: 100% !important;
              }
              .header, .content, .order-summary, .footer {
                padding-left: 20px !important;
                padding-right: 20px !important;
              }
              .logo-section {
                flex-direction: column !important;
                gap: 12px !important;
              }
              .brand-name {
                font-size: 24px !important;
              }
              .celebration-title {
                font-size: 24px !important;
              }
              .order-received-section {
                flex-direction: column !important;
                gap: 8px !important;
              }
              .order-details-title {
                flex-direction: column !important;
                text-align: center !important;
                gap: 6px !important;
              }
              .cta-button {
                padding: 14px 24px !important;
                font-size: 14px !important;
              }
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              .email-container {
                border-color: rgba(115, 56, 87, 0.2) !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <!-- Header -->
            <div class="header">
              <div class="logo-section">
                <img src="${logoCid ? `cid:${logoCid}` : `${process.env.FRONTEND_URL || 'http://localhost:5173'}/images/logo.png`}" alt="La Patisserie Logo" class="logo-image">
                <div class="brand-name">La Pâtisserie</div>
              </div>
            </div>

            <!-- Content -->
            <div class="content">
              <!-- Success Banner -->
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 50px; margin-bottom: 16px;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h1 style="font-size: 32px; font-weight: 700; color: #281c20; margin: 0 0 12px 0; letter-spacing: -0.02em;">Order Received!</h1>
                <p style="font-size: 18px; color: #92400e; margin: 0;">Thank you, ${userDetails.name}!</p>
              </div>

              <!-- Order Number Badge -->
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%); border: 2px solid #f7e6cc; border-radius: 8px;">
                  <span style="font-size: 13px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Order Number</span>
                  <div style="font-size: 24px; font-weight: 700; color: #281c20; margin-top: 4px; font-family: 'Courier New', monospace;">#${orderNumber}</div>
                </div>
              </div>

              <!-- Info Box -->
              <div style="background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%); border: 2px solid #f7e6cc; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #92400e; text-align: center;">
                  🎉 We've received your order and will start preparing your delicious treats soon. You'll receive email updates as your order progresses.
                </p>
              </div>

              <!-- Order Items -->
              <div class="order-details">
                <div class="order-details-header">
                  <h3 class="order-details-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #92400e;">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    Your Items
                  </h3>
                </div>
                
                <table class="order-table">
                  <tbody>
                    ${itemsList}
                  </tbody>
                </table>

                <div class="order-summary">
                  <div class="summary-row total">
                    <span>Total Amount</span>
                    <span>₹${orderSummary.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <!-- Track Order CTA -->
              <div class="cta-section">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${orderNumber}" class="cta-button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Track Your Order
                </a>
                <p style="margin: 16px 0 0 0; font-size: 13px; color: #6B7280;">
                  Click the button above to view real-time updates
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <h3 class="footer-brand">La Pâtisserie</h3>
              <p class="footer-tagline">Sweet moments start here! 🍰</p>
              <p style="font-size: 12px; opacity: 0.7; margin-top: 12px; color: #92400e;">
                Need help? Contact us anytime.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: attachments
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

    const mailOptions = {
      from: {
        name: 'La Patisserie Alerts',
        address: process.env.EMAIL_USER
      },
      to: adminEmails,
      subject: `🔔 New Order #${orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html lang='en'>
        <head>
          <meta charset='UTF-8'>
          <meta name='viewport' content='width=device-width, initial-scale=1.0'>
          <title>New Order Placed</title>
          <style>
            body { margin: 0; padding: 0; background: #ffffff; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 50%, #fdfbf9 100%); padding: 32px; text-align: center; border-bottom: 3px solid #f7e6cc; }
            .logo-section { display: table; margin: 0 auto; }
            .logo-image { width: 60px; height: 60px; object-fit: contain; display: inline-block; vertical-align: middle; margin-right: 16px; }
            .brand-name { font-size: 24px; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; color: #281c20; display: inline-block; vertical-align: middle; line-height: 60px; }
            .content { padding: 40px 32px; background: #ffffff; }
            .alert-badge { display: inline-block; padding: 16px 32px; background: #f59e0b; border-radius: 50px; margin-bottom: 16px; }
            .alert-icon { width: 32px; height: 32px; color: white; display: block; margin: 0 auto; }
            .order-details { background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%); border: 2px solid #f7e6cc; border-radius: 12px; overflow: hidden; margin: 24px 0; }
            .order-header { background: linear-gradient(135deg, #fff5f0 0%, #fdfbf9 100%); padding: 20px 24px; border-bottom: 2px solid #f7e6cc; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
            .info-item { padding: 12px; background: white; border-radius: 8px; border: 1px solid #f7e6cc; }
            .info-label { font-size: 12px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
            .info-value { font-size: 15px; color: #281c20; font-weight: 500; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; }
            th { padding: 12px; text-align: left; font-size: 12px; color: #92400e; font-weight: 600; text-transform: uppercase; background: linear-gradient(135deg, #fff5f0 0%, #fdfbf9 100%); }
            td { padding: 12px; border-bottom: 1px solid #f7e6cc; color: #281c20; }
            .total-section { padding: 20px; background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%); border-radius: 8px; margin: 16px 0; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .total-row.grand { font-size: 18px; font-weight: 700; color: #281c20; padding-top: 12px; border-top: 2px solid #f7e6cc; }
            .footer { background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 50%, #fdfbf9 100%); padding: 24px; text-align: center; border-top: 3px solid #f7e6cc; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-section">
                <img src="${process.env.BACKEND_URL || 'http://localhost:3000'}/public/images/logo.png" alt="La Patisserie Logo" class="logo-image">
                <div class="brand-name">La Pâtisserie</div>
              </div>
            </div>
            
            <div class="content">
              <div style="text-align: center; margin-bottom: 32px;">
                <div class="alert-badge">
                  <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <h1 style="font-size: 28px; font-weight: 700; color: #281c20; margin: 0 0 8px 0;">New Order Alert</h1>
                <p style="font-size: 16px; color: #92400e; margin: 0;">Order #${orderNumber} has been placed</p>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Customer</div>
                  <div class="info-value">${orderDetails?.userDetails?.name || orderDetails?.userId?.name || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Phone</div>
                  <div class="info-value">${orderDetails?.userDetails?.phone || orderDetails?.userId?.phone || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Delivery Location</div>
                  <div class="info-value">${orderDetails?.deliveryLocation || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Hostel</div>
                  <div class="info-value">${orderDetails?.hostelName || 'N/A'}</div>
                </div>
              </div>

              <div class="order-details">
                <div class="order-header">
                  <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #281c20;">Order Items</h3>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style="text-align: center;">Qty</th>
                      <th style="text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${buildAdminItemsTable(cartItems)}
                  </tbody>
                </table>
              </div>

              <div class="total-section">
                <div class="total-row">
                  <span style="color: #92400e;">Payment Method:</span>
                  <span style="font-weight: 600;">${(paymentMethod || 'N/A').toUpperCase()}</span>
                </div>
                <div class="total-row">
                  <span style="color: #92400e;">Status:</span>
                  <span style="font-weight: 600; color: #f59e0b;">${formatStatusLabel(orderStatus)}</span>
                </div>
                <div class="total-row">
                  <span style="color: #92400e;">Customer Email:</span>
                  <span style="font-weight: 600;">${customerEmail}</span>
                </div>
                <div class="total-row grand">
                  <span>Grand Total</span>
                  <span>₹${(orderSummary?.grandTotal ?? 0).toFixed(2)}</span>
                </div>
              </div>

              <p style="font-size: 13px; color: #6B7280; text-align: center; margin: 24px 0 0 0;">
                Placed at: ${new Date(createdAt || Date.now()).toLocaleString()}
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0; font-size: 14px; color: #92400e;">La Pâtisserie Admin Alert</p>
            </div>
          </div>
        </body>
        </html>
      `
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

    const mailOptions = {
      from: {
        name: 'La Patisserie Alerts',
        address: process.env.EMAIL_USER
      },
      to: adminEmails,
      subject: `📦 Order #${orderNumber} - ${statusLabel}`,
      html: `
        <!DOCTYPE html>
        <html lang='en'>
        <head>
          <meta charset='UTF-8'>
          <meta name='viewport' content='width=device-width, initial-scale=1.0'>
          <title>Order Status Update</title>
          <style>
            body { margin: 0; padding: 0; background: #ffffff; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 50%, #fdfbf9 100%); padding: 32px; text-align: center; border-bottom: 3px solid #f7e6cc; }
            .logo-section { display: table; margin: 0 auto; }
            .logo-image { width: 60px; height: 60px; object-fit: contain; display: inline-block; vertical-align: middle; margin-right: 16px; }
            .brand-name { font-size: 24px; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; color: #281c20; display: inline-block; vertical-align: middle; line-height: 60px; }
            .content { padding: 40px 32px; background: #ffffff; }
            .status-badge { display: inline-block; padding: 16px 32px; background: #3B82F6; border-radius: 50px; margin-bottom: 16px; }
            .status-icon { width: 32px; height: 32px; color: white; display: block; margin: 0 auto; }
            .order-details { background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%); border: 2px solid #f7e6cc; border-radius: 12px; overflow: hidden; margin: 24px 0; }
            .order-header { background: linear-gradient(135deg, #fff5f0 0%, #fdfbf9 100%); padding: 20px 24px; border-bottom: 2px solid #f7e6cc; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
            .info-item { padding: 12px; background: white; border-radius: 8px; border: 1px solid #f7e6cc; }
            .info-label { font-size: 12px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
            .info-value { font-size: 15px; color: #281c20; font-weight: 500; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; }
            th { padding: 12px; text-align: left; font-size: 12px; color: #92400e; font-weight: 600; text-transform: uppercase; background: linear-gradient(135deg, #fff5f0 0%, #fdfbf9 100%); }
            td { padding: 12px; border-bottom: 1px solid #f7e6cc; color: #281c20; }
            .total-section { padding: 20px; background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%); border-radius: 8px; margin: 16px 0; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .total-row.grand { font-size: 18px; font-weight: 700; color: #281c20; padding-top: 12px; border-top: 2px solid #f7e6cc; }
            .footer { background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 50%, #fdfbf9 100%); padding: 24px; text-align: center; border-top: 3px solid #f7e6cc; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-section">
                <img src="${process.env.BACKEND_URL || 'http://localhost:3000'}/public/images/logo.png" alt="La Patisserie Logo" class="logo-image">
                <div class="brand-name">La Pâtisserie</div>
              </div>
            </div>
            
            <div class="content">
              <div style="text-align: center; margin-bottom: 32px;">
                <div class="status-badge">
                  <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </div>
                <h1 style="font-size: 28px; font-weight: 700; color: #281c20; margin: 0 0 8px 0;">Status Update</h1>
                <p style="font-size: 16px; color: #92400e; margin: 0;">Order #${orderNumber} → ${statusLabel}</p>
              </div>

              <div style="background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%); border: 2px solid #f7e6cc; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 15px; color: #92400e; text-align: center;">
                  ${statusMessages[newStatus] || 'Order status has been updated.'}
                </p>
              </div>

              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Customer</div>
                  <div class="info-value">${orderDetails?.userDetails?.name || orderDetails?.userId?.name || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Phone</div>
                  <div class="info-value">${orderDetails?.userDetails?.phone || orderDetails?.userId?.phone || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Delivery Location</div>
                  <div class="info-value">${orderDetails?.deliveryLocation || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Hostel</div>
                  <div class="info-value">${orderDetails?.hostelName || 'N/A'}</div>
                </div>
              </div>

              <div class="order-details">
                <div class="order-header">
                  <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #281c20;">Order Items</h3>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style="text-align: center;">Qty</th>
                      <th style="text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${buildAdminItemsTable(cartItems)}
                  </tbody>
                </table>
              </div>

              <div class="total-section">
                <div class="total-row">
                  <span style="color: #92400e;">New Status:</span>
                  <span style="font-weight: 600; color: #3B82F6;">${statusLabel}</span>
                </div>
                <div class="total-row grand">
                  <span>Grand Total</span>
                  <span>₹${(orderSummary?.grandTotal ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="footer">
              <p style="margin: 0; font-size: 14px; color: #92400e;">La Pâtisserie Admin Alert</p>
            </div>
          </div>
        </body>
        </html>
      `
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