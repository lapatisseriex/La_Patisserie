// Welcome email template for new users

export const getWelcomeEmailTemplate = (userDetails) => {
  const { name, email } = userDetails;

  return {
    subject: `Welcome to La Pâtisserie! 🎉`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Welcome to La Pâtisserie</title>
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
            padding: 32px; 
            text-align: center; 
            position: relative;
            border-bottom: 3px solid #f7e6cc;
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
          .content { 
            padding: 40px 32px; 
            background: #ffffff;
          }
          .welcome-banner {
            text-align: center;
            margin-bottom: 40px;
          }
          .welcome-icon {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            border-radius: 50px;
            margin-bottom: 16px;
          }
          .celebration-emoji {
            font-size: 32px;
            display: block;
          }
          .welcome-title {
            font-size: 32px;
            font-weight: 700;
            color: #281c20;
            margin: 0 0 12px 0;
            letter-spacing: -0.02em;
          }
          .welcome-subtitle {
            font-size: 18px;
            color: #92400e;
            margin: 0;
          }
          .info-box {
            background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%);
            border: 2px solid #f7e6cc;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
          }
          .info-text {
            margin: 0;
            font-size: 15px;
            line-height: 1.8;
            color: #92400e;
            text-align: center;
          }
          .features-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin: 32px 0;
          }
          .feature-card {
            background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%);
            border: 2px solid #f7e6cc;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
          }
          .feature-icon {
            width: 40px;
            height: 40px;
            margin: 0 auto 12px;
            color: #f59e0b;
          }
          .feature-title {
            font-size: 15px;
            font-weight: 600;
            color: #281c20;
            margin-bottom: 8px;
          }
          .feature-desc {
            font-size: 13px;
            color: #92400e;
            line-height: 1.5;
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
          
          @media only screen and (max-width: 620px) {
            .features-grid {
              grid-template-columns: 1fr;
            }
            .content {
              padding: 32px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <!-- Header -->
          <div class="header">
            <div class="logo-section">
              <img src="${process.env.BACKEND_URL}/public/images/logo.png" alt="La Patisserie Logo" class="logo-image">
              <div class="brand-name">La Pâtisserie</div>
            </div>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Welcome Banner -->
            <div class="welcome-banner">
              <div class="welcome-icon">
                <span class="celebration-emoji">🎉</span>
              </div>
              <h1 class="welcome-title">Welcome, ${name}!</h1>
              <p class="welcome-subtitle">We're thrilled to have you here</p>
            </div>

            <!-- Info Box -->
            <div class="info-box">
              <p class="info-text">
                Thank you for joining La Pâtisserie! You're now part of our community of dessert lovers. 
                Get ready to discover artisanal treats crafted with love and the finest ingredients.
              </p>
            </div>

            <!-- Features Grid -->
            <div class="features-grid">
              <div class="feature-card">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
                <div class="feature-title">Premium Quality</div>
                <p class="feature-desc">Handcrafted desserts made with finest ingredients</p>
              </div>

              <div class="feature-card">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path>
                  <path d="M15 18H9"></path>
                  <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path>
                  <circle cx="17" cy="18" r="2"></circle>
                  <circle cx="7" cy="18" r="2"></circle>
                </svg>
                <div class="feature-title">Fast Delivery</div>
                <p class="feature-desc">Fresh treats delivered right to your door</p>
              </div>

              <div class="feature-card">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <div class="feature-title">Track Orders</div>
                <p class="feature-desc">Real-time updates on your order status</p>
              </div>

              <div class="feature-card">
                <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <div class="feature-title">Save Favorites</div>
                <p class="feature-desc">Create your wishlist of favorite desserts</p>
              </div>
            </div>

            <!-- CTA Section -->
            <div class="cta-section">
              <h3 style="font-size: 20px; color: #281c20; margin-bottom: 16px;">Ready to explore?</h3>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/products" class="cta-button">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                Browse Our Collection
              </a>
              <p style="margin: 16px 0 0 0; font-size: 13px; color: #6B7280;">
                Discover our delicious range of cakes, pastries & more
              </p>
            </div>

            <!-- Account Info -->
            <div style="background: linear-gradient(135deg, #fdfbf9 0%, #fff5f0 100%); border: 2px solid #f7e6cc; border-radius: 12px; padding: 20px; margin-top: 32px;">
              <h4 style="font-size: 16px; color: #281c20; margin-bottom: 12px; text-align: center;">Your Account Details</h4>
              <p style="font-size: 14px; color: #92400e; text-align: center; margin: 0;">
                <strong>Email:</strong> ${email}
              </p>
              <p style="font-size: 13px; color: #6B7280; text-align: center; margin-top: 12px;">
                You can manage your profile and orders from your account dashboard
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <h3 class="footer-brand">La Pâtisserie</h3>
            <p class="footer-tagline">Sweet moments start here! 🍰</p>
            <p style="font-size: 12px; opacity: 0.7; margin-top: 12px; color: #92400e;">
              Need help? We're here for you anytime.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };
};
