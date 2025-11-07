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

// Template for New Product - Simple and Plain (matching dispatch email style)
const newProductTemplate = (product) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Product - La Patisserie</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 5px;">
    
    <h2 style="color: #333333; margin-top: 0;">New Product Available!</h2>
    
    <p style="color: #555555; line-height: 1.6;">
      We're excited to introduce <strong>${product.name}</strong> to our menu!
    </p>
    
    ${product.image ? `
    <div style="margin: 20px 0;">
      <img src="${product.image}" alt="${product.name}" style="width: 100%; max-width: 500px; height: auto; display: block; border-radius: 5px;">
    </div>
    ` : ''}
    
    ${product.description ? `
    <div style="background-color: #f9f9f9; padding: 15px; border-left: 3px solid #4CAF50; margin: 20px 0;">
      <p style="margin: 0; color: #333333; font-size: 14px;">
        <strong>About this product:</strong><br>
        ${product.description}
      </p>
    </div>
    ` : ''}
    
    <div style="margin: 20px 0;">
      <p style="color: #555555; line-height: 1.6; margin: 5px 0;">
        <strong>Price:</strong> ₹${product.price}
      </p>
      ${product.category ? `
      <p style="color: #555555; line-height: 1.6; margin: 5px 0;">
        <strong>Category:</strong> ${product.category}
      </p>
      ` : ''}
    </div>
    
    <p style="color: #555555; line-height: 1.6;">
      Order now and enjoy this delicious new addition to our collection!
    </p>
    
    <p style="margin: 20px 0;">
      <a href="${product.link || 'https://www.lapatisserie.shop/products'}" style="display: inline-block; background-color: #4CAF50; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        View Product
      </a>
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

<<<<<<< HEAD
        <!-- Link -->
        <div style="text-align: center; margin: 35px 0 20px 0;">
          <p style="color: rgba(255, 255, 255, 0.8); font-size: 15px;">
            Explore collection: <a href="${category.link || 'https://lapatisserie.com/products'}" style="color: #A855F7; text-decoration: underline;">${category.link || 'https://lapatisserie.com/products'}</a>
          </p>
        </div>

=======
>>>>>>> 98602f4c1246afa2b779bcec4a4da072cb2c946f
        <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; line-height: 1.6; text-align: center; margin: 30px 0 0 0; font-style: italic;">
          "Life is short, eat dessert first." - <a href="${category.link || 'https://lapatisserie.com/products'}" style="color: #A855F7; text-decoration: underline; font-weight: 500;">Explore our new ${category.name} collection</a> today!
        </p>
      </div>
    </div>
  </div>

  ${getEmailFooter()}
</body>
</html>
`;

// Template for Discount/Special Offer - Simple and Plain (matching dispatch email style)
const discountTemplate = (discount) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Discount - La Patisserie</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 5px;">
    
    <h2 style="color: #333333; margin-top: 0;">🎊 Special Discount Offer!</h2>
    
    <p style="color: #555555; line-height: 1.6;">
      Great news! We have a special discount on <strong>${discount.productName}</strong>
    </p>
    
    ${discount.image ? `
    <div style="margin: 20px 0;">
      <img src="${discount.image}" alt="${discount.productName}" style="width: 100%; max-width: 500px; height: auto; display: block; border-radius: 5px;">
    </div>
    ` : ''}
    
    <div style="background-color: #fff3cd; padding: 20px; border-left: 3px solid #ff9800; margin: 20px 0; border-radius: 5px;">
      <p style="margin: 0 0 10px 0; color: #333333; font-size: 18px; font-weight: bold;">
        ${discount.discountPercentage}% OFF
      </p>
      <p style="margin: 5px 0; color: #555555; font-size: 14px;">
        <span style="text-decoration: line-through;">₹${discount.originalPrice}</span>
        <strong style="color: #ff9800; font-size: 24px; margin-left: 10px;">₹${discount.discountedPrice}</strong>
      </p>
      <p style="margin: 10px 0 0 0; color: #555555; font-size: 13px;">
        You save: <strong>₹${discount.originalPrice - discount.discountedPrice}</strong>
      </p>
    </div>
    
    ${discount.description ? `
    <div style="margin: 20px 0;">
      <p style="color: #333333; font-size: 14px; line-height: 1.6;">
        <strong>About this product:</strong><br>
        ${discount.description}
      </p>
    </div>
    ` : ''}
    
    ${discount.validUntil ? `
    <p style="color: #d32f2f; font-size: 14px; font-weight: bold; margin: 15px 0;">
      ⏰ Hurry! Offer valid until ${new Date(discount.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
    </p>
    ` : ''}
    
    <p style="color: #555555; line-height: 1.6;">
      Don't miss out on this exclusive offer!
    </p>
    
    <p style="margin: 20px 0;">
      <a href="${discount.link || 'https://www.lapatisserie.shop/products'}" style="display: inline-block; background-color: #ff9800; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Claim Discount Now
      </a>
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
<<<<<<< HEAD
        <div style="text-align: center; margin: 35px 0 20px 0;">
          <p style="color: rgba(255, 255, 255, 0.8); font-size: 15px;">
            ${content.ctaText}: <a href="${content.ctaLink}" style="color: #A855F7; text-decoration: underline;">${content.ctaLink}</a>
          </p>
        </div>
=======
        <p style="text-align: center; margin: 35px 0 20px 0;">
          <a href="${content.ctaLink}" style="color: #A855F7; text-decoration: underline; font-weight: 500; letter-spacing: 0.05em;">${content.ctaText}</a>
        </p>
>>>>>>> 98602f4c1246afa2b779bcec4a4da072cb2c946f
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
