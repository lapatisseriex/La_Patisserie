// Email templates for order status updates

export const getOrderStatusEmailTemplate = (orderDetails, newStatus) => {
  const { orderNumber, userDetails, cartItems, orderSummary } = orderDetails;
  
  const statusMessages = {
    confirmed: {
      subject: `Order Confirmed - ${orderNumber}`,
      title: 'Order Confirmed! 🎉',
      message: 'Great news! Your order has been confirmed and we\'re preparing to make your delicious treats.',
      emoji: '✅',
      color: '#10B981'
    },
    preparing: {
      subject: `Order Being Prepared - ${orderNumber}`,
      title: 'Your Order is Being Prepared! 👨‍🍳',
      message: 'Our talented bakers are now preparing your order with love and care.',
      emoji: '👨‍🍳',
      color: '#F59E0B'
    },
    ready: {
      subject: `Order Ready for Pickup/Delivery - ${orderNumber}`,
      title: 'Order Ready! 🎂',
      message: 'Your delicious treats are ready! We\'ll deliver them to you soon.',
      emoji: '📦',
      color: '#8B5CF6'
    },
    out_for_delivery: {
      subject: `Order Out for Delivery - ${orderNumber}`,
      title: 'Order on the Way! 🚛',
      message: 'Your order is out for delivery and will reach you soon. Get ready to enjoy!',
      emoji: '🚛',
      color: '#3B82F6'
    },
    delivered: {
      subject: `Order Delivered - ${orderNumber}`,
      title: 'Order Delivered Successfully! 🎉',
      message: 'Your order has been delivered! We hope you enjoy every bite. Thank you for choosing La Patisserie!',
      emoji: '✨',
      color: '#059669'
    }
  };

  const status = statusMessages[newStatus];
  if (!status) return null;

  const itemsList = cartItems.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">
        <div style="display: flex; align-items: center;">
          <img src="${item.productImage}" alt="${item.productName}" style="width: 40px; height: 40px; border-radius: 8px; margin-right: 12px; object-fit: cover;">
          <div>
            <div style="font-weight: 600; color: #374151;">${item.productName}</div>
            <div style="font-size: 14px; color: #6B7280;">Qty: ${item.quantity}</div>
          </div>
        </div>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 600; color: #374151;">
        ₹${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return {
    subject: status.subject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${status.subject}</title>
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
            background: linear-gradient(135deg, ${status.color} 0%, ${status.color}dd 100%); 
            color: white; 
            padding: 32px 24px; 
            text-align: center; 
          }
          .content { 
            padding: 32px 24px; 
          }
          .status-badge { 
            display: inline-block; 
            background-color: ${status.color}; 
            color: white; 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-size: 14px; 
            font-weight: 600; 
            margin-bottom: 16px;
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
          .progress-bar {
            width: 100%;
            height: 8px;
            background-color: #e5e7eb;
            border-radius: 4px;
            margin: 16px 0;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, ${status.color} 0%, ${status.color}dd 100%);
            border-radius: 4px;
            transition: width 0.3s ease;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 16px 0; 
          }
          .btn {
            display: inline-block;
            background-color: ${status.color};
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
            <!-- Header -->
            <div class="header">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700;">
                ${status.emoji} ${status.title}
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 18px; opacity: 0.9;">
                Order #${orderNumber}
              </p>
            </div>

            <!-- Content -->
            <div class="content">
              <div class="status-badge">
                ${status.emoji} ${newStatus.replace('_', ' ').toUpperCase()}
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
                Hello ${userDetails.name},
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
                ${status.message}
              </p>

              <!-- Progress Bar -->
              <div style="margin: 24px 0;">
                <h3 style="color: #374151; margin-bottom: 12px;">Order Progress</h3>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${getProgressPercentage(newStatus)}%;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: #6B7280;">
                  <span>Placed</span>
                  <span>Confirmed</span>
                  <span>Preparing</span>
                  <span>Ready</span>
                  <span>Delivered</span>
                </div>
              </div>

              <!-- Order Details -->
              <div class="order-info">
                <h3 style="margin: 0 0 16px 0; color: #374151;">Order Details</h3>
                
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
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6B7280;">Subtotal:</span>
                    <span style="font-weight: 600; color: #374151;">₹${orderSummary.cartTotal.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #6B7280;">Delivery:</span>
                    <span style="font-weight: 600; color: #374151;">₹${orderSummary.deliveryCharge.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                    <span style="font-weight: 700; color: #374151; font-size: 18px;">Total:</span>
                    <span style="font-weight: 700; color: #374151; font-size: 18px;">₹${orderSummary.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div style="margin-top: 20px; padding: 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                  <h4 style="margin: 0 0 8px 0; color: #92400e;">Delivery Address</h4>
                  <p style="margin: 0; color: #92400e; line-height: 1.4;">
                    ${userDetails.address}, ${userDetails.city}<br>
                    Phone: ${userDetails.phone}
                  </p>
                </div>
              </div>

              <!-- Call to Action -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${orderNumber}" class="btn">
                  Track Your Order
                </a>
              </div>

              <p style="font-size: 14px; color: #6B7280; line-height: 1.6;">
                If you have any questions about your order, please don't hesitate to contact us. We're here to help!
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <h3 style="margin: 0 0 8px 0; color: #f9fafb;">La Patisserie</h3>
              <p style="margin: 0; opacity: 0.8;">Thank you for choosing us for your sweet moments!</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.7;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
};

// Helper function to calculate progress percentage
const getProgressPercentage = (status) => {
  const progressMap = {
    'placed': 20,
    'confirmed': 40,
    'preparing': 60,
    'ready': 80,
    'out_for_delivery': 90,
    'delivered': 100
  };
  return progressMap[status] || 0;
};