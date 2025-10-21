import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEO Component for Dynamic Meta Tags
 * Usage: <SEO title="Page Title" description="Page description" keywords="keyword1, keyword2" />
 */
export const SEO = ({ 
  title = 'La Patisserie - Premium Cakes & Desserts Online',
  description = 'Order premium handcrafted cakes, pastries and desserts online. Fresh bakery items for all your special occasions.',
  keywords = 'cakes online, birthday cake, wedding cake, desserts, pastries, bakery',
  image = 'https://lapatisserie.shop/images/logo.png',
  type = 'website',
  canonical = null
}) => {
  const location = useLocation();
  const url = `https://lapatisserie.shop${location.pathname}`;
  const canonicalUrl = canonical || url;

  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name, content, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (element) {
        element.setAttribute('content', content);
      } else {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        element.setAttribute('content', content);
        document.head.appendChild(element);
      }
    };

    // Update standard meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Update Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:type', type, true);

    // Update Twitter Card tags
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:url', url);

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', canonicalUrl);
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', canonicalUrl);
      document.head.appendChild(canonicalLink);
    }
  }, [title, description, keywords, image, type, url, canonicalUrl]);

  return null;
};

/**
 * Product Schema Generator
 */
export const generateProductSchema = (product) => {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.image || product.images?.[0],
    "brand": {
      "@type": "Brand",
      "name": "La Patisserie"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://lapatisserie.shop/product/${product._id}`,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": product.stockQuantity > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    "aggregateRating": product.rating ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount || 1
    } : undefined
  };
};

/**
 * Breadcrumb Schema Generator
 */
export const generateBreadcrumbSchema = (items) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://lapatisserie.shop${item.url}`
    }))
  };
};

/**
 * FAQ Schema Generator
 */
export const generateFAQSchema = (faqs) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

/**
 * Schema Injector Component
 */
export const SchemaMarkup = ({ schema }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    script.id = 'dynamic-schema';
    
    // Remove existing dynamic schema
    const existing = document.getElementById('dynamic-schema');
    if (existing) {
      existing.remove();
    }
    
    document.head.appendChild(script);
    
    return () => {
      const scriptToRemove = document.getElementById('dynamic-schema');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [schema]);

  return null;
};

export default SEO;
