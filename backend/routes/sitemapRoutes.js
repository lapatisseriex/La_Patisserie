import express from 'express';
import Category from '../models/categoryModel.js';
import Product from '../models/productModel.js';

const router = express.Router();

/**
 * Dynamic Sitemap Generator for La Patisserie
 * Generates XML sitemap with all products, categories, and static pages
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = 'https://lapatisserie.shop';
    const currentDate = new Date().toISOString().split('T')[0];

    // Static pages with priority and keywords
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: '1.0', lastmod: currentDate, keywords: 'cakes online coimbatore, bakery, tiramisu' },
      { url: '/products', changefreq: 'daily', priority: '0.9', lastmod: currentDate, keywords: 'buy cakes online, desserts, tiramisu delivery' },
      { url: '/about', changefreq: 'monthly', priority: '0.7', lastmod: currentDate, keywords: 'about la patisserie, coimbatore bakery' },
      { url: '/contact', changefreq: 'monthly', priority: '0.7', lastmod: currentDate, keywords: 'contact bakery coimbatore, cake orders' },
      { url: '/our-services', changefreq: 'monthly', priority: '0.7', lastmod: currentDate, keywords: 'bakery services, custom cakes, catering' },
      { url: '/faq', changefreq: 'monthly', priority: '0.6', lastmod: currentDate, keywords: 'cake delivery faq, bakery questions' },
      { url: '/cart', changefreq: 'weekly', priority: '0.5', lastmod: currentDate },
      { url: '/favorites', changefreq: 'weekly', priority: '0.5', lastmod: currentDate },
      { url: '/privacy-policy', changefreq: 'yearly', priority: '0.3', lastmod: currentDate },
      { url: '/terms', changefreq: 'yearly', priority: '0.3', lastmod: currentDate },
      { url: '/refund-policy', changefreq: 'yearly', priority: '0.3', lastmod: currentDate },
      { url: '/shipping-policy', changefreq: 'yearly', priority: '0.3', lastmod: currentDate },
    ];

    // Fetch categories
    const categories = await Category.find({ isActive: true }).select('_id name updatedAt');

    // Fetch products
    const products = await Product.find({ 
      isActive: true,
      stockQuantity: { $gt: 0 } 
    }).select('_id name updatedAt');

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Add static pages
    staticPages.forEach(page => {
      xml += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    // Add categories
    categories.forEach(category => {
      const lastmod = category.updatedAt ? category.updatedAt.toISOString().split('T')[0] : currentDate;
      xml += `
  <url>
    <loc>${baseUrl}/category/${category._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add products
    products.forEach(product => {
      const lastmod = product.updatedAt ? product.updatedAt.toISOString().split('T')[0] : currentDate;
      xml += `
  <url>
    <loc>${baseUrl}/product/${product._id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * Robots.txt handler (backup if static file doesn't work)
 */
router.get('/robots.txt', (req, res) => {
  const robotsTxt = `# robots.txt for La Patisserie
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/payment/
Disallow: /profile/
Disallow: /orders/

Sitemap: https://lapatisserie.shop/sitemap.xml
`;
  
  res.type('text/plain');
  res.send(robotsTxt);
});

export default router;
