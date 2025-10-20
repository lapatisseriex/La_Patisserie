// Email templates for order status updates
import Product from '../models/productModel.js';

// Helper function to fetch product details and images
const fetchProductDetails = async (productId) => {
  try {
    const product = await Product.findById(productId).select('name images featuredImage');
    return {
      name: product?.name || 'Product',
      images: product?.images || [],
      featuredImage: product?.featuredImage || null
    };
  } catch (error) {
    console.error('Error fetching product details:', error);
    return {
      name: 'Product',
      images: [],
      featuredImage: null
    };
  }
};

export const getOrderStatusEmailTemplate = async (orderDetails, newStatus, logoAttachmentCid = null) => {
  const { orderNumber, userDetails, cartItems, orderSummary } = orderDetails;
  
  const statusMessages = {
    confirmed: {
      subject: `Order Confirmed - ${orderNumber}`,
      title: 'Order Confirmed!',
      message: 'Great news! Your order has been confirmed and we\'re preparing to make your delicious treats.',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,11 12,14 22,4"></polyline><path d="m21,3-6.5,18a.55.55,0,0,1-1,0L10,14Z"></path></svg>`,
      color: '#10B981'
    },
    preparing: {
      subject: `Order Being Prepared - ${orderNumber}`,
      title: 'Your Order is Being Prepared!',
      message: 'Our talented bakers are now preparing your order with love and care.',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg>`,
      color: '#F59E0B'
    },
    ready: {
      subject: `Order Ready for Pickup/Delivery - ${orderNumber}`,
      title: 'Order Ready!',
      message: 'Your delicious treats are ready! We\'ll deliver them to you soon.',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>`,
      color: '#8B5CF6'
    },
    out_for_delivery: {
      subject: `Order Out for Delivery - ${orderNumber}`,
      title: 'Order on the Way!',
      message: 'Your order is out for delivery and will reach you soon. Get ready to enjoy!',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle></svg>`,
      color: '#3B82F6'
    },
    delivered: {
      subject: `Order Delivered - ${orderNumber}`,
      title: 'Order Delivered Successfully!',
      message: 'Your order has been delivered! We hope you enjoy every bite. Thank you for choosing La Patisserie!',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,11 12,14 22,4"></polyline><path d="m21,3-6.5,18a.55.55,0,0,1-1,0L10,14Z"></path></svg>`,
      color: '#059669'
    }
  };

  const status = statusMessages[newStatus];
  if (!status) return null;
  
  console.log("Cart Items", cartItems);
  
  // Fetch product details for all cart items
  const itemsWithDetails = await Promise.all(
    cartItems.map(async (item) => {
      const productDetails = await fetchProductDetails(item.productId);
      return {
        ...item,
        productDetails
      };
    })
  );
  console.log("User details", userDetails);
  const itemsList = itemsWithDetails.map(item => {
    const productImage = item.productDetails.featuredImage || 
                        (item.productDetails.images.length > 0 ? item.productDetails.images[0] : '');
    const productName = item.productName || item.productDetails.name;
    
    return `
    <tr class="product-item-row" style="border-bottom: 1px solid #f7e6cc; background: #ffffff;">
      <td style="padding: 20px 16px;">
        <div style="display: flex; align-items: center; gap: 20px;">
          <div style="flex-shrink: 0;">
            <img src="${productImage}" alt="${productName}" style="width: 64px; height: 64px; border-radius: 12px; object-fit: cover; border: 2px solid #f7e6cc; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);">
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; color: #281c20; font-size: 16px; line-height: 1.4; margin-bottom: 8px; letter-spacing: 0.01em;">${productName}</div>
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 13px; color: #6B7280;">
              <div style="display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #fff5f0 0%, #fdfbf9 100%); padding: 4px 10px; border-radius: 6px; border: 1px solid #f7e6cc;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #f59e0b;"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle></svg>
                <span style="font-weight: 500; color: #281c20;">Qty: ${item.quantity}</span>
              </div>
              ${item.variantLabel ? `<div style="display: flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #fff5f0 0%, #fdfbf9 100%); padding: 4px 10px; border-radius: 6px; border: 1px solid #f7e6cc;"><span style="font-weight: 500; color: #f59e0b;">${item.variantLabel}</span></div>` : ''}
            </div>
          </div>
        </div>
      </td>
      <td style="padding: 20px 16px; text-align: right;">
        <div style="font-weight: 700; color: #281c20; font-size: 17px; letter-spacing: 0.01em;">₹${(item.price * item.quantity).toFixed(2)}</div>
        ${item.originalPrice && item.originalPrice > item.price ? `<div style="font-size: 13px; color: #9CA3AF; text-decoration: line-through; margin-top: 4px;">₹${(item.originalPrice * item.quantity).toFixed(2)}</div>` : ''}
      </td>
    </tr>
  `;
  }).join('');

  return {
    subject: status.subject,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${status.subject}</title>
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
            padding: 24px 12px;
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
          .email-wrapper {
            background: #ffffff;
            padding: 0;
            min-height: 100vh;
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
            padding: 48px 32px; 
            text-align: center; 
            position: relative;
            border-bottom: 3px solid #f7e6cc;
          }
          .header::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 50%;
            transform: translateX(-50%);
            width: 60%;
            height: 3px;
            background: linear-gradient(90deg, transparent, #f59e0b, transparent);
          }
          .logo-section {
            display: table;
            margin: 0 auto 24px auto;
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
          .status-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 16px;
          }
          .status-icon {
            width: 24px;
            height: 24px;
            color: ${status.color};
            display: block;
          }
          .status-title {
            font-size: 24px;
            font-weight: 600;
            color: #281c20;
            margin: 0;
          }
          .order-number {
            font-size: 16px;
            opacity: 0.9;
            margin: 8px 0 0 0;
          }
          .content { 
            padding: 48px 32px; 
            background: #ffffff;
          }
          .status-badge { 
            display: inline-flex; 
            align-items: center;
            gap: 10px;
            background: linear-gradient(135deg, #fff5f0 0%, #fdfbf9 100%); 
            color: ${status.color}; 
            padding: 14px 28px; 
            border-radius: 30px; 
            font-size: 14px; 
            font-weight: 600; 
            margin-bottom: 28px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border: 2px solid #f7e6cc;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
          }
          .greeting {
            font-size: 20px;
            color: #281c20;
            margin-bottom: 18px;
            font-weight: 500;
            letter-spacing: 0.02em;
          }
          .message {
            font-size: 16px;
            line-height: 1.8;
            color: #412434;
            margin-bottom: 32px;
          }
          .progress-section {
            margin: 36px 0;
            padding: 28px;
            background: linear-gradient(135deg, #fff5f0 0%, #fdfbf9 100%);
            border-radius: 16px;
            border: 2px solid #f7e6cc;
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.08);
          }
          .progress-title {
            color: #281c20;
            font-size: 17px;
            font-weight: 600;
            margin-bottom: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .progress-bar {
            width: 100%;
            height: 8px;
            background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%);
            border-radius: 8px;
            margin: 18px 0;
            overflow: hidden;
            border: 1px solid #f7e6cc;
          }
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
            border-radius: 8px;
            transition: width 0.8s ease;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
          }
          .progress-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 12px;
            font-size: 11px;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .order-details { 
            background: #ffffff;
            border: 2px solid #f7e6cc;
            border-radius: 16px; 
            margin: 36px 0;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(245, 158, 11, 0.1);
          }
          .order-details-header {
            background: linear-gradient(135deg, #fff5f0 0%, #fdfbf9 100%);
            padding: 24px 28px;
            border-bottom: 2px solid #f7e6cc;
          }
          .order-details-title {
            font-size: 19px;
            font-weight: 600;
            color: #281c20;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 12px;
            letter-spacing: 0.02em;
          }
          .order-table {
            width: 100%;
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
            background: #ffffff;
          }
          .table-header {
            background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%);
            border-bottom: 2px solid #f7e6cc;
          }
          .table-header th {
            padding: 18px 16px;
            text-align: left;
            font-weight: 600;
            color: #281c20;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .table-header th:last-child {
            text-align: right;
          }
          .product-item-row {
            border-bottom: 1px solid #f7e6cc;
            background: #ffffff;
            transition: background 0.3s ease;
          }
          .product-item-row:hover {
            background: linear-gradient(135deg, #fdfbf9 0%, #ffffff 100%);
          }
          .product-item-row:last-child {
            border-bottom: none;
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
          .delivery-info {
            margin-top: 24px;
            padding: 20px;
            background: linear-gradient(135deg, #fff5f0 0%, #fdfbf9 100%);
            border-radius: 12px;
            border: 2px solid #f7e6cc;
            box-shadow: 0 2px 6px rgba(147, 51, 234, 0.06);
          }
          .delivery-title {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-size: 16px;
            font-weight: 600;
            color: #92400e;
          }
          .delivery-details {
            color: #92400e;
            line-height: 1.6;
            font-size: 14px;
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
          .footer-note {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 16px;
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
            .status-title {
              font-size: 20px !important;
            }
            .progress-labels {
              font-size: 10px !important;
            }
            .status-section {
              flex-direction: column !important;
              gap: 8px !important;
            }
            .progress-title, .order-details-title, .delivery-title {
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
              <img src="${process.env.BACKEND_URL || 'http://localhost:3000'}/public/images/logo.png" alt="La Patisserie Logo" class="logo-image">
              <div class="brand-name">La Pâtisserie</div>
            </div>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Status Banner -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="font-size: 32px; font-weight: 700; color: #281c20; margin: 0 0 12px 0; letter-spacing: -0.02em;">${status.title}</h1>
              <p style="font-size: 18px; color: #92400e; margin: 0;">Hello, ${userDetails.name}!</p>
            </div>

            <!-- Order Number Badge -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%); border: 2px solid #f7e6cc; border-radius: 8px;">
                <span style="font-size: 13px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Order Number</span>
                <div style="font-size: 24px; font-weight: 700; color: #281c20; margin-top: 4px; font-family: 'Courier New', monospace;">#${orderNumber}</div>
              </div>
            </div>

            <!-- Status Message Box -->
            <div style="background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%); border: 2px solid #f7e6cc; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.8; color: #92400e; text-align: center;">
                ${status.message}
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
                  Order Items
                </h3>
              </div>
              
              <table class="order-table">
                <tbody>
                  ${itemsList}
                </tbody>
              </table>

              <div class="order-summary">
                <div class="summary-row">
                  <span style="color: #6B7280;">Subtotal:</span>
                  <span style="font-weight: 600; color: #281c20;">₹${orderSummary.cartTotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                  <span style="color: #6B7280;">Delivery:</span>
                  <span style="font-weight: 600; color: #281c20;">₹${orderSummary.deliveryCharge.toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                  <span>Total Amount</span>
                  <span>₹${orderSummary.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <!-- Delivery Info -->
            <div class="delivery-info">
              <h4 class="delivery-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                Delivery Address
              </h4>
              <div class="delivery-details">
                ${userDetails.city}, ${userDetails.country}<br>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: middle;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"></path></svg>
                ${userDetails.phone}
              </div>
            </div>

            <!-- Track Order CTA -->
            <div class="cta-section">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${orderNumber}" class="cta-button">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <p style="color: #000000ff;">Track Your Order</p>
              </a>
              <p style="margin: 16px 0 0 0; font-size: 13px; color: #6B7280;">
                Click the button above to view real-time updates
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <h3 class="footer-brand">La Pâtisserie</h3>
            <p class="footer-tagline">Thank you for choosing us for your sweet moments! 🍰</p>
            <p style="font-size: 12px; opacity: 0.7; margin-top: 12px; color: #92400e;">
              Need help? Contact us anytime.
            </p>
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