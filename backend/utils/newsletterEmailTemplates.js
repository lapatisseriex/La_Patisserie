/**
 * Newsletter Email Templates for La Pâtisserie
 * Matching the website's color scheme: purple (#A855F7), dark backgrounds, elegant styling
 */

const getEmailHeader = () => `
  <div style="background: linear-gradient(135deg, #040404 0%, #281c20 50%, #412434 100%); padding: 40px 20px; text-align: center; border-bottom: 2px solid #733857;">
    <div style="max-width: 600px; margin: 0 auto;">
      <div style="display: inline-block; margin-bottom: 20px;">
        <h1 style="color: #ffffff; font-size: 36px; font-weight: 300; letter-spacing: 0.3em; margin: 0; font-family: system-ui, -apple-system, sans-serif; text-transform: uppercase;">
          LA PÂTISSERIE
        </h1>
      </div>
      <p style="color: rgba(245, 245, 245, 0.6); font-size: 14px; letter-spacing: 0.15em; margin: 10px 0 0 0; font-family: system-ui, -apple-system, sans-serif;">
        The Authentic Tiramisu
      </p>
    </div>
  </div>
`;

const getEmailFooter = () => `
  <div style="background: linear-gradient(135deg, #040404 0%, #281c20 50%, #412434 100%); padding: 40px 20px; text-align: center; border-top: 2px solid #733857; margin-top: 40px;">
    <div style="max-width: 600px; margin: 0 auto;">
      <div style="margin-bottom: 30px;">
        <a href="tel:+917845712388" style="color: #A855F7; text-decoration: none; margin: 0 15px; font-size: 14px; font-family: system-ui, -apple-system, sans-serif;">
          📞 +91 7845712388
        </a>
        <a href="mailto:lapatisserielapatisserie@gmail.com" style="color: #A855F7; text-decoration: none; margin: 0 15px; font-size: 14px; font-family: system-ui, -apple-system, sans-serif;">
          ✉️ Contact Us
        </a>
      </div>
      
      <div style="margin-bottom: 25px;">
        <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; margin: 5px 0; font-family: system-ui, -apple-system, sans-serif;">
          📍 LIG 208 Gandhi Nagar, Peelamedu, Coimbatore
        </p>
      </div>

      <div style="border-top: 1px solid rgba(115, 56, 87, 0.3); padding-top: 25px; margin-top: 25px;">
        <p style="color: rgba(255, 255, 255, 0.4); font-size: 12px; margin: 10px 0; font-family: system-ui, -apple-system, sans-serif;">
          © ${new Date().getFullYear()} La Pâtisserie. All rights reserved.
        </p>
        <p style="color: rgba(255, 255, 255, 0.3); font-size: 11px; margin: 15px 0 5px 0; font-family: system-ui, -apple-system, sans-serif;">
          You're receiving this email because you subscribed to our newsletter.
        </p>
        <a href="{{unsubscribeLink}}" style="color: #A855F7; text-decoration: none; font-size: 11px; font-family: system-ui, -apple-system, sans-serif;">
          Unsubscribe from newsletter
        </a>
      </div>
    </div>
  </div>
`;

// Template for New Product
const newProductTemplate = (product) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Dessert Alert - La Pâtisserie</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: system-ui, -apple-system, sans-serif;">
  ${getEmailHeader()}
  
  <div style="background-color: #1a1a1a; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #281c20 0%, #1a1a1a 100%); border-radius: 12px; overflow: hidden; border: 1px solid rgba(168, 85, 247, 0.2);">
      
      <!-- Announcement Badge -->
      <div style="background: linear-gradient(90deg, #A855F7 0%, #733857 100%); padding: 15px; text-align: center;">
        <h2 style="color: #ffffff; font-size: 18px; font-weight: 500; letter-spacing: 0.2em; margin: 0; text-transform: uppercase;">
          ✨ NEW DESSERT ALERT ✨
        </h2>
      </div>

      <!-- Product Image -->
      ${product.image ? `
      <div style="padding: 0;">
        <img src="${product.image}" alt="${product.name}" style="width: 100%; height: auto; display: block; max-height: 400px; object-fit: cover;">
      </div>
      ` : ''}

      <!-- Product Details -->
      <div style="padding: 40px 30px;">
        <h1 style="color: #A855F7; font-size: 32px; font-weight: 300; letter-spacing: 0.1em; margin: 0 0 15px 0; text-align: center;">
          ${product.name}
        </h1>
        
        ${product.description ? `
        <p style="color: rgba(255, 255, 255, 0.8); font-size: 16px; line-height: 1.8; margin: 20px 0; text-align: center;">
          ${product.description}
        </p>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: rgba(168, 85, 247, 0.1); border: 2px solid #A855F7; border-radius: 8px; padding: 15px 30px;">
            <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; letter-spacing: 0.15em; margin: 0 0 5px 0; text-transform: uppercase;">
              Price
            </p>
            <p style="color: #A855F7; font-size: 28px; font-weight: 600; margin: 0;">
              ₹${product.price}
            </p>
          </div>
        </div>

        ${product.category ? `
        <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; text-align: center; margin: 20px 0;">
          Category: <span style="color: #A855F7;">${product.category}</span>
        </p>
        ` : ''}

        <!-- CTA Button -->
        <div style="text-align: center; margin: 35px 0 20px 0;">
          <a href="${product.link || 'https://lapatisserie.com/products'}" style="display: inline-block; background: linear-gradient(90deg, #A855F7 0%, #733857 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 14px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; transition: all 0.3s;">
            ORDER NOW
          </a>
        </div>

        <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; line-height: 1.6; text-align: center; margin: 30px 0 0 0;">
          Indulge in our latest creation, crafted with love and the finest ingredients. Order now and treat yourself to something extraordinary!
        </p>
      </div>
    </div>
  </div>

  ${getEmailFooter()}
</body>
</html>
`;

// Template for New Category
const newCategoryTemplate = (category) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Category - La Pâtisserie</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: system-ui, -apple-system, sans-serif;">
  ${getEmailHeader()}
  
  <div style="background-color: #1a1a1a; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #281c20 0%, #1a1a1a 100%); border-radius: 12px; overflow: hidden; border: 1px solid rgba(168, 85, 247, 0.2);">
      
      <!-- Announcement Badge -->
      <div style="background: linear-gradient(90deg, #733857 0%, #A855F7 100%); padding: 15px; text-align: center;">
        <h2 style="color: #ffffff; font-size: 18px; font-weight: 500; letter-spacing: 0.2em; margin: 0; text-transform: uppercase;">
          🎉 NEW COLLECTION 🎉
        </h2>
      </div>

      <!-- Category Details -->
      <div style="padding: 50px 30px;">
        <h1 style="color: #A855F7; font-size: 36px; font-weight: 300; letter-spacing: 0.1em; margin: 0 0 20px 0; text-align: center;">
          ${category.name}
        </h1>
        
        ${category.description ? `
        <p style="color: rgba(255, 255, 255, 0.8); font-size: 16px; line-height: 1.8; margin: 25px 0; text-align: center;">
          ${category.description}
        </p>
        ` : ''}

        <div style="text-align: center; margin: 40px 0;">
          <div style="display: inline-block; padding: 20px;">
            <p style="color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.8; max-width: 500px;">
              Discover our newest collection of handcrafted desserts, each made with premium ingredients and traditional techniques. Every bite tells a story of passion and perfection.
            </p>
          </div>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 35px 0 20px 0;">
          <a href="${category.link || 'https://lapatisserie.com/products'}" style="display: inline-block; background: transparent; color: #A855F7; text-decoration: none; padding: 16px 40px; border-radius: 6px; border: 2px solid #A855F7; font-size: 14px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase;">
            EXPLORE COLLECTION
          </a>
        </div>

        <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; line-height: 1.6; text-align: center; margin: 30px 0 0 0; font-style: italic;">
          "Life is short, eat dessert first." - Explore our new ${category.name} collection today!
        </p>
      </div>
    </div>
  </div>

  ${getEmailFooter()}
</body>
</html>
`;

// Template for Discount/Special Offer
const discountTemplate = (discount) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Discount - La Pâtisserie</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: system-ui, -apple-system, sans-serif;">
  ${getEmailHeader()}
  
  <div style="background-color: #1a1a1a; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #281c20 0%, #1a1a1a 100%); border-radius: 12px; overflow: hidden; border: 1px solid rgba(168, 85, 247, 0.2);">
      
      <!-- Announcement Badge -->
      <div style="background: linear-gradient(90deg, #ff6b6b 0%, #A855F7 100%); padding: 15px; text-align: center;">
        <h2 style="color: #ffffff; font-size: 18px; font-weight: 500; letter-spacing: 0.2em; margin: 0; text-transform: uppercase;">
          🎊 SPECIAL OFFER 🎊
        </h2>
      </div>

      <!-- Product Image (if available) -->
      ${discount.image ? `
      <div style="padding: 0;">
        <img src="${discount.image}" alt="${discount.productName}" style="width: 100%; height: auto; display: block; max-height: 350px; object-fit: cover;">
      </div>
      ` : ''}

      <!-- Discount Details -->
      <div style="padding: 40px 30px;">
        <!-- Discount Badge -->
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #A855F7 0%, #ff6b6b 100%); border-radius: 50%; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(168, 85, 247, 0.3);">
            <div style="text-align: center;">
              <p style="color: #ffffff; font-size: 36px; font-weight: 700; margin: 0; line-height: 1;">
                ${discount.discountPercentage}%
              </p>
              <p style="color: #ffffff; font-size: 14px; font-weight: 500; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">
                OFF
              </p>
            </div>
          </div>
        </div>

        <h1 style="color: #A855F7; font-size: 28px; font-weight: 300; letter-spacing: 0.1em; margin: 0 0 15px 0; text-align: center;">
          ${discount.productName}
        </h1>
        
        ${discount.description ? `
        <p style="color: rgba(255, 255, 255, 0.8); font-size: 16px; line-height: 1.8; margin: 20px 0; text-align: center;">
          ${discount.description}
        </p>
        ` : ''}

        <!-- Price Comparison -->
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: rgba(168, 85, 247, 0.1); border-radius: 8px; padding: 20px 30px;">
            <p style="color: rgba(255, 255, 255, 0.5); font-size: 16px; text-decoration: line-through; margin: 0 0 10px 0;">
              ₹${discount.originalPrice}
            </p>
            <p style="color: #A855F7; font-size: 32px; font-weight: 600; margin: 0;">
              ₹${discount.discountedPrice}
            </p>
            <p style="color: rgba(255, 255, 255, 0.6); font-size: 13px; margin: 10px 0 0 0; letter-spacing: 0.1em;">
              YOU SAVE ₹${discount.originalPrice - discount.discountedPrice}
            </p>
          </div>
        </div>

        ${discount.validUntil ? `
        <p style="color: #ff6b6b; font-size: 14px; text-align: center; margin: 25px 0; font-weight: 500;">
          ⏰ Hurry! Offer valid until ${new Date(discount.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        ` : ''}

        <!-- CTA Button -->
        <div style="text-align: center; margin: 35px 0 20px 0;">
          <a href="${discount.link || 'https://lapatisserie.com/products'}" style="display: inline-block; background: linear-gradient(90deg, #A855F7 0%, #ff6b6b 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 14px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; box-shadow: 0 5px 20px rgba(168, 85, 247, 0.4);">
            CLAIM DISCOUNT NOW
          </a>
        </div>

        <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; line-height: 1.6; text-align: center; margin: 30px 0 0 0;">
          Don't miss out on this exclusive offer! Treat yourself or someone special to our delicious desserts at an amazing price.
        </p>
      </div>
    </div>
  </div>

  ${getEmailFooter()}
</body>
</html>
`;

// Template for Manual/Custom Newsletter
const customNewsletterTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.subject || 'Newsletter'} - La Pâtisserie</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: system-ui, -apple-system, sans-serif;">
  ${getEmailHeader()}
  
  <div style="background-color: #1a1a1a; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #281c20 0%, #1a1a1a 100%); border-radius: 12px; overflow: hidden; border: 1px solid rgba(168, 85, 247, 0.2);">
      
      ${content.title ? `
      <div style="background: linear-gradient(90deg, #A855F7 0%, #733857 100%); padding: 15px; text-align: center;">
        <h2 style="color: #ffffff; font-size: 18px; font-weight: 500; letter-spacing: 0.2em; margin: 0; text-transform: uppercase;">
          ${content.title}
        </h2>
      </div>
      ` : ''}

      <div style="padding: 40px 30px;">
        <div style="color: rgba(255, 255, 255, 0.8); font-size: 16px; line-height: 1.8;">
          ${content.body}
        </div>

        ${content.ctaText && content.ctaLink ? `
        <div style="text-align: center; margin: 35px 0 20px 0;">
          <a href="${content.ctaLink}" style="display: inline-block; background: linear-gradient(90deg, #A855F7 0%, #733857 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 14px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase;">
            ${content.ctaText}
          </a>
        </div>
        ` : ''}
      </div>
    </div>
  </div>

  ${getEmailFooter()}
</body>
</html>
`;

export {
  newProductTemplate,
  newCategoryTemplate,
  discountTemplate,
  customNewsletterTemplate
};
