import nodemailer from 'nodemailer';
import { getOrderStatusEmailTemplate } from './orderEmailTemplates.js';

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
export const sendOrderStatusNotification = async (orderDetails, newStatus, userEmail) => {
  try {
    const transporter = createTransporter();
    
    // Get email template for the new status
    const emailTemplate = getOrderStatusEmailTemplate(orderDetails, newStatus);
    
    if (!emailTemplate) {
      throw new Error(`No email template found for status: ${newStatus}`);
    }

    const mailOptions = {
      from: {
        name: 'La Patisserie',
        address: process.env.EMAIL_USER
      },
      to: userEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      // Add tracking for better delivery
      headers: {
        'X-Order-Number': orderDetails.orderNumber,
        'X-Status-Update': newStatus,
        'X-Priority': 'high'
      }
    };

    console.log(`Sending order status email to ${userEmail} for order ${orderDetails.orderNumber} - Status: ${newStatus}`);
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('Order status email sent successfully:', {
      messageId: result.messageId,
      orderNumber: orderDetails.orderNumber,
      newStatus,
      recipient: userEmail
    });

    return {
      success: true,
      messageId: result.messageId,
      orderNumber: orderDetails.orderNumber,
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
export const sendOrderConfirmationEmail = async (orderDetails, userEmail) => {
  try {
    const transporter = createTransporter();
    
    const { orderNumber, cartItems, orderSummary, userDetails } = orderDetails;
    
    const itemsList = cartItems.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">
          <div style="display: flex; align-items: center;">
            <img src="${item.productImage || ''}" alt="${item.productName || 'Item'}" style="width: 40px; height: 40px; border-radius: 8px; margin-right: 12px; object-fit: cover;">
            <div>
              <div style="font-weight: 600; color: #374151;">${item.productName || 'Item'}</div>
              <div style="font-size: 14px; color: #6B7280;">Qty: ${item.quantity || 0}</div>
            </div>
          </div>
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: right;">
          ₹${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
        </td>
      </tr>
    `).join('');

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
          <title>Order Received - ${orderNumber}</title>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              background-color: #f9fafb; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: white; 
              border-radius: 12px; 
              overflow: hidden; 
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); 
              color: white; 
              padding: 32px 24px; 
              text-align: center; 
            }
            .content { 
              padding: 32px 24px; 
            }
            .order-info { 
              background-color: #f9fafb; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0; 
            }
            .footer { 
              background-color: #374151; 
              color: white; 
              padding: 24px; 
              text-align: center; 
              font-size: 14px; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 16px 0; 
            }
            .btn {
              display: inline-block;
              background-color: #F59E0B;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 16px 0;
            }
          </style>
        </head>
        <body>
          <div style="padding: 20px;">
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 32px; font-weight: 700;">
                  🎂 Order Received!
                </h1>
                <p style="margin: 8px 0 0 0; font-size: 18px; opacity: 0.9;">
                  Order #${orderNumber}
                </p>
              </div>

              <div class="content">
                <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
                  Hello ${userDetails.name},
                </p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
                  Thank you for your order! We've received your request and will start preparing your delicious treats soon.
                </p>

                <div class="order-info">
                  <h3 style="margin: 0 0 16px 0; color: #374151;">Order Summary</h3>
                  
                  <table>
                    <thead>
                      <tr style="background-color: #f3f4f6;">
                        <th style="padding: 12px 8px; text-align: left; font-weight: 600; color: #374151;">Item</th>
                        <th style="padding: 12px 8px; text-align: right; font-weight: 600; color: #374151;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsList}
                    </tbody>
                  </table>

                  <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e7eb;">
                    <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                      <span style="font-weight: 700; color: #374151; font-size: 18px;">Total:</span>
                      <span style="font-weight: 700; color: #374151; font-size: 18px;">₹${orderSummary.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${orderNumber}" class="btn">
                    Track Your Order
                  </a>
                </div>

                <p style="font-size: 14px; color: #6B7280; line-height: 1.6;">
                  You'll receive updates as your order progresses. Thank you for choosing La Patisserie!
                </p>
              </div>

              <div class="footer">
                <h3 style="margin: 0 0 8px 0; color: #f9fafb;">La Patisserie</h3>
                <p style="margin: 0; opacity: 0.8;">Sweet moments start here!</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
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