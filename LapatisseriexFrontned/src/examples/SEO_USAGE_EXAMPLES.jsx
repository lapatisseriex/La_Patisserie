// 📄 EXAMPLE IMPLEMENTATIONS FOR LA PATISSERIE SEO

// ============================================
// 1. HOME PAGE (Home.jsx)
// ============================================
import { SEO } from '../components/SEO/SEO';

function Home() {
  return (
    <>
      <SEO 
        title="La Patisserie - Order Premium Cakes & Desserts Online 🍰 | Fresh Bakery"
        description="India's favorite online bakery! Order custom birthday cakes, wedding cakes, pastries & desserts. Fresh, handcrafted with love. Same-day delivery available! 🎂✨"
        keywords="cakes online, birthday cake delivery, wedding cakes, custom cakes, online bakery, desserts online, fresh pastries, bakery near me"
      />
      
      {/* Your existing home content */}
    </>
  );
}

// ============================================
// 2. PRODUCT DISPLAY PAGE (ProductDisplayPage.jsx)
// ============================================
import { SEO, SchemaMarkup, generateProductSchema } from '../components/SEO/SEO';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

function ProductDisplayPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    // Fetch your product data
    fetchProduct(id).then(setProduct);
  }, [id]);

  if (!product) return <div>Loading...</div>;

  return (
    <>
      <SEO 
        title={`${product.name} - Order Online | La Patisserie`}
        description={`${product.description.slice(0, 150)}... Order fresh ${product.name} online. Available for delivery. ₹${product.price}`}
        keywords={`${product.name}, ${product.category}, cakes online, buy ${product.name}`}
        image={product.image || product.images?.[0]}
        type="product"
      />
      <SchemaMarkup schema={generateProductSchema(product)} />
      
      {/* Your product display code */}
      <div className="product-container">
        <h1>{product.name}</h1>
        <img src={product.image} alt={product.name} />
        <p>{product.description}</p>
        <p>Price: ₹{product.price}</p>
      </div>
    </>
  );
}

// ============================================
// 3. PRODUCTS PAGE (Products.jsx)
// ============================================
import { SEO } from '../components/SEO/SEO';

function Products() {
  return (
    <>
      <SEO 
        title="Premium Cakes & Desserts | Browse All Products - La Patisserie"
        description="Explore our delicious range of birthday cakes, wedding cakes, cupcakes, pastries & desserts. Order online for same-day delivery. Fresh daily! 🍰🧁"
        keywords="buy cakes online, desserts menu, pastry shop, cake varieties, online cake catalog"
      />
      
      {/* Your products grid */}
    </>
  );
}

// ============================================
// 4. ABOUT PAGE (About.jsx)
// ============================================
import { SEO } from '../components/SEO/SEO';

function About() {
  return (
    <>
      <SEO 
        title="About La Patisserie - Best Online Bakery in India | Our Story"
        description="Learn about La Patisserie - your trusted online bakery for premium handcrafted cakes and desserts. Quality ingredients, expert bakers, happiness delivered! 🎂"
        keywords="about la patisserie, best bakery, cake shop story, premium bakery india"
      />
      
      {/* Your about content */}
    </>
  );
}

// ============================================
// 5. CONTACT PAGE (Contact.jsx)
// ============================================
import { SEO } from '../components/SEO/SEO';

function Contact() {
  return (
    <>
      <SEO 
        title="Contact La Patisserie - Order Cakes Online | Customer Support"
        description="Get in touch with La Patisserie for custom cake orders, bulk orders, or any questions. Call us or fill out our contact form. We're here to help! 📞"
        keywords="contact la patisserie, cake order contact, bakery customer service, custom cake inquiry"
      />
      
      {/* Your contact form */}
    </>
  );
}

// ============================================
// 6. CART PAGE (Cart.jsx)
// ============================================
import { SEO } from '../components/SEO/SEO';

function Cart() {
  return (
    <>
      <SEO 
        title="Shopping Cart - La Patisserie | Review Your Order"
        description="Review your cake and dessert order. Proceed to checkout for fast delivery."
        keywords="shopping cart, cake order, checkout"
      />
      
      {/* Your cart content */}
    </>
  );
}

// ============================================
// 7. FAQ PAGE (FAQ.jsx)
// ============================================
import { SEO, SchemaMarkup, generateFAQSchema } from '../components/SEO/SEO';

function FAQ() {
  const faqs = [
    {
      question: "Do you offer same-day delivery?",
      answer: "Yes! We offer same-day delivery for orders placed before 2 PM in selected areas."
    },
    {
      question: "Can I customize my cake?",
      answer: "Absolutely! We offer full customization including flavor, design, message, and size."
    },
    {
      question: "What are your delivery charges?",
      answer: "Delivery charges vary based on location. Free delivery on orders above ₹1000."
    },
    // Add more FAQs
  ];

  return (
    <>
      <SEO 
        title="Frequently Asked Questions - La Patisserie | Cake Delivery FAQ"
        description="Find answers to common questions about cake delivery, customization, payment, and more at La Patisserie."
        keywords="cake delivery faq, custom cake questions, bakery help"
      />
      <SchemaMarkup schema={generateFAQSchema(faqs)} />
      
      {/* Your FAQ content */}
    </>
  );
}

// ============================================
// 8. CATEGORY PAGE (Example for Birthday Cakes)
// ============================================
import { SEO, SchemaMarkup, generateBreadcrumbSchema } from '../components/SEO/SEO';

function CategoryPage({ categoryName, categorySlug }) {
  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
    { name: categoryName, url: `/category/${categorySlug}` }
  ];

  return (
    <>
      <SEO 
        title={`${categoryName} - Order Online | La Patisserie`}
        description={`Browse our collection of ${categoryName.toLowerCase()}. Fresh, handcrafted, delivered to your door. Order now!`}
        keywords={`${categoryName}, buy ${categoryName} online, ${categoryName} delivery`}
      />
      <SchemaMarkup schema={generateBreadcrumbSchema(breadcrumbs)} />
      
      {/* Your category products */}
    </>
  );
}

// ============================================
// 9. SERVICES PAGE (OurServices.jsx)
// ============================================
import { SEO } from '../components/SEO/SEO';

function OurServices() {
  return (
    <>
      <SEO 
        title="Our Services - Custom Cakes, Catering & More | La Patisserie"
        description="Discover our bakery services: custom cakes for all occasions, bulk orders, catering, wedding cakes, and more. Perfect for events!"
        keywords="bakery services, custom cakes, cake catering, wedding cake service, bulk cake orders"
      />
      
      {/* Your services content */}
    </>
  );
}

// ============================================
// 10. ORDERS PAGE (Orders.jsx) - No Index
// ============================================
import { useEffect } from 'react';

function Orders() {
  useEffect(() => {
    // Tell search engines not to index this page
    const metaRobots = document.querySelector('meta[name="robots"]');
    if (metaRobots) {
      metaRobots.setAttribute('content', 'noindex, nofollow');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex, nofollow';
      document.head.appendChild(meta);
    }

    return () => {
      // Reset on unmount
      if (metaRobots) {
        metaRobots.setAttribute('content', 'index, follow');
      }
    };
  }, []);

  return (
    <div>
      {/* Your orders content */}
    </div>
  );
}

// ============================================
// BONUS: Product Card with Image Optimization
// ============================================
function ProductCard({ product }) {
  return (
    <div className="product-card">
      <img 
        src={product.image} 
        alt={`${product.name} - Premium ${product.category} available at La Patisserie`}
        loading="lazy"
        width="300"
        height="300"
      />
      <h3>{product.name}</h3>
      <p>{product.description.slice(0, 100)}...</p>
      <span>₹{product.price}</span>
    </div>
  );
}

// ============================================
// BONUS: Blog Post Example (Create blog folder)
// ============================================
import { SEO } from '../components/SEO/SEO';

function BlogPost({ title, content, author, date, image }) {
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "image": image,
    "author": {
      "@type": "Person",
      "name": author
    },
    "publisher": {
      "@type": "Organization",
      "name": "La Patisserie",
      "logo": {
        "@type": "ImageObject",
        "url": "https://lapatisserie.shop/images/logo.png"
      }
    },
    "datePublished": date,
    "description": content.slice(0, 150)
  };

  return (
    <>
      <SEO 
        title={`${title} - La Patisserie Blog`}
        description={content.slice(0, 160)}
        keywords="cake recipes, baking tips, dessert ideas"
        image={image}
        type="article"
      />
      <SchemaMarkup schema={blogSchema} />
      
      <article>
        <h1>{title}</h1>
        <p>By {author} | {date}</p>
        <img src={image} alt={title} />
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </article>
    </>
  );
}

export {
  Home,
  ProductDisplayPage,
  Products,
  About,
  Contact,
  Cart,
  FAQ,
  CategoryPage,
  OurServices,
  Orders,
  ProductCard,
  BlogPost
};
