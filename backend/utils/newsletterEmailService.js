import nodemailer from 'nodemailer';
import Newsletter from '../models/newsletterModel.js';
import {
  newProductTemplate,
  newCategoryTemplate,
  discountTemplate,
  customNewsletterTemplate
} from './newsletterEmailTemplates.js';

// Create reusable transporter with enhanced configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'lapatisserielapatisserie@gmail.com',
      pass: process.env.EMAIL_PASS
    },
    pool: true, // Use connection pooling
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 20000, // 20 seconds
    rateLimit: 5 // max 5 messages per rateDelta
  });
};

/**
 * Send email to a single subscriber
 */
const sendEmailToSubscriber = async (email, subject, htmlContent) => {
  try {
    const transporter = createTransporter();
    
    // Replace unsubscribe link placeholder with actual link
    const unsubscribeLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe?email=${encodeURIComponent(email)}`;
    const finalHtml = htmlContent.replace(/{{unsubscribeLink}}/g, unsubscribeLink);

    const mailOptions = {
      from: {
        name: 'La Pâtisserie',
        address: process.env.EMAIL_USER || 'lapatisserielapatisserie@gmail.com'
      },
      to: email,
      subject: subject,
      html: finalHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send newsletter to all active subscribers
 */
const sendNewsletterToAll = async (subject, htmlContent, type = 'custom') => {
  try {
    // Get all active subscribers
    const subscribers = await Newsletter.getActiveSubscribers();
    
    if (subscribers.length === 0) {
      return {
        success: false,
        message: 'No active subscribers found',
        sent: 0,
        failed: 0
      };
    }

    console.log(`Sending newsletter to ${subscribers.length} subscribers...`);

    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    // Send emails in batches to avoid overwhelming the server
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const promises = batch.map(async (subscriber) => {
        const result = await sendEmailToSubscriber(subscriber.email, subject, htmlContent);
        
        if (result.success) {
          results.sent++;
          // Update last email sent timestamp
          await Newsletter.findByIdAndUpdate(subscriber._id, {
            lastEmailSent: new Date()
          });
        } else {
          results.failed++;
          results.errors.push({ email: subscriber.email, error: result.error });
        }
      });

      await Promise.all(promises);
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Newsletter sent: ${results.sent} successful, ${results.failed} failed`);

    return {
      success: true,
      message: `Newsletter sent to ${results.sent} subscribers`,
      sent: results.sent,
      failed: results.failed,
      totalSubscribers: subscribers.length,
      errors: results.errors
    };
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return {
      success: false,
      message: 'Failed to send newsletter',
      error: error.message
    };
  }
};

/**
 * Send new product announcement
 */
const sendNewProductNewsletter = async (product) => {
  try {
    const subject = `🍰 New Dessert Alert: ${product.name} - La Pâtisserie`;
    
    // Get price from product variants (use first variant's price, or lowest price if multiple variants)
    let price = product.price; // fallback to direct price if exists
    if (product.variants && product.variants.length > 0) {
      // Get the lowest price from all variants
      const prices = product.variants
        .filter(v => v.price && v.price > 0)
        .map(v => v.price);
      if (prices.length > 0) {
        price = Math.min(...prices);
      }
    }
    
    // Get image - handle different possible structures
    let image = null;
    
    // Check images array first (most common in your schema)
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      // Handle if image is an object with url property or just a string
      image = typeof firstImage === 'string' ? firstImage : (firstImage?.url || firstImage);
    }
    
    // Fallback to featuredImage virtual
    if (!image && product.featuredImage) {
      image = typeof product.featuredImage === 'string' ? product.featuredImage : (product.featuredImage?.url || product.featuredImage);
    }
    
    // Fallback to direct image field
    if (!image && product.image) {
      image = typeof product.image === 'string' ? product.image : (product.image?.url || product.image);
    }
    
    console.log('Newsletter image extracted:', image);
    console.log('Product images array:', product.images);
    
    const productData = {
      name: product.name,
      description: product.description,
      price: price,
      image: image,
      category: product.category?.name || product.categoryName,
      link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/products/${product._id}`
    };

    const htmlContent = newProductTemplate(productData);
    
    return await sendNewsletterToAll(subject, htmlContent, 'new_product');
  } catch (error) {
    console.error('Error sending new product newsletter:', error);
    throw error;
  }
};

/**
 * Send new category announcement
 */
const sendNewCategoryNewsletter = async (category) => {
  try {
    const subject = `🎉 New Collection: ${category.name} - La Pâtisserie`;
    
    const categoryData = {
      name: category.name,
      description: category.description,
      link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/products?category=${category._id}`
    };

    const htmlContent = newCategoryTemplate(categoryData);
    
    return await sendNewsletterToAll(subject, htmlContent, 'new_category');
  } catch (error) {
    console.error('Error sending new category newsletter:', error);
    throw error;
  }
};

/**
 * Send discount announcement
 */
const sendDiscountNewsletter = async (product) => {
  try {
    const subject = `🎊 Special Offer: ${product.discountPercentage}% OFF on ${product.name} - La Pâtisserie`;
    
    const discountData = {
      productName: product.name,
      description: product.description,
      discountPercentage: product.discountPercentage,
      originalPrice: product.originalPrice || product.price,
      discountedPrice: product.discountedPrice || (product.price * (1 - product.discountPercentage / 100)),
      image: product.image?.url || product.image,
      validUntil: product.discountValidUntil,
      link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/products/${product._id}`
    };

    const htmlContent = discountTemplate(discountData);
    
    return await sendNewsletterToAll(subject, htmlContent, 'discount');
  } catch (error) {
    console.error('Error sending discount newsletter:', error);
    throw error;
  }
};

/**
 * Send custom newsletter (manual)
 */
const sendCustomNewsletter = async (newsletterContent) => {
  try {
    const subject = newsletterContent.subject || 'Update from La Pâtisserie';
    
    const htmlContent = customNewsletterTemplate(newsletterContent);
    
    return await sendNewsletterToAll(subject, htmlContent, 'custom');
  } catch (error) {
    console.error('Error sending custom newsletter:', error);
    throw error;
  }
};

/**
 * Send welcome email to new subscriber
 */
const sendWelcomeEmail = async (email) => {
  try {
    const subject = 'Welcome to La Pâtisserie Newsletter! 🍰';
    
    const welcomeContent = {
      title: '✨ WELCOME TO OUR FAMILY ✨',
      body: `
        <h2 style="color: #A855F7; text-align: center; font-weight: 300; letter-spacing: 0.1em;">
          Thank You for Subscribing!
        </h2>
        <p style="text-align: center; margin: 25px 0;">
          We're thrilled to have you join our community of dessert lovers! 
        </p>
        <p style="text-align: center; margin: 20px 0;">
          You'll now be the first to know about:
        </p>
        <div style="margin: 30px 0; padding: 20px; background: rgba(168, 85, 247, 0.05); border-radius: 8px; border-left: 4px solid #A855F7;">
          <p style="margin: 10px 0;">🍰 <strong style="color: #A855F7;">New Desserts</strong> - Be the first to try our latest creations</p>
          <p style="margin: 10px 0;">🎉 <strong style="color: #A855F7;">Exclusive Offers</strong> - Special discounts just for subscribers</p>
          <p style="margin: 10px 0;">✨ <strong style="color: #A855F7;">New Collections</strong> - Discover new categories of treats</p>
          <p style="margin: 10px 0;">💝 <strong style="color: #A855F7;">Special Events</strong> - Limited-time promotions and more</p>
        </div>
        <p style="text-align: center; margin: 25px 0; font-size: 15px;">
          Get ready to indulge in the finest desserts Coimbatore has to offer!
        </p>
      `,
      ctaText: 'EXPLORE OUR MENU',
      ctaLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/products`
    };

    const htmlContent = customNewsletterTemplate(welcomeContent);
    
    return await sendEmailToSubscriber(email, subject, htmlContent);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

export {
  sendEmailToSubscriber,
  sendNewsletterToAll,
  sendNewProductNewsletter,
  sendNewCategoryNewsletter,
  sendDiscountNewsletter,
  sendCustomNewsletter,
  sendWelcomeEmail
};
