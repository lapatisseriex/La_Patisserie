import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HoverButton from '../components/common/HoverButton';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: "Orders & Payment",
      questions: [
        {
          q: "How do I place an order?",
          a: "Browse our products, add items to your cart, and proceed to checkout. Fill in your delivery details and make payment through our secure payment gateway."
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit/debit cards, UPI, net banking, and digital wallets through our secure Razorpay payment gateway."
        },
        {
          q: "Is online payment safe?",
          a: "Yes! We use Razorpay's secure payment gateway with SSL encryption. Your payment information is completely safe and secure."
        },
        {
          q: "Can I modify my order after placing it?",
          a: "Orders can be modified only before preparation begins. Please contact us immediately at +91 7845712388 if you need to make changes."
        }
      ]
    },
    {
      category: "Delivery",
      questions: [
        {
          q: "Do you deliver to my area?",
          a: "We currently deliver within Coimbatore city limits. Enter your pincode at checkout to check if delivery is available in your area."
        },
        {
          q: "How long does delivery take?",
          a: "Standard delivery takes 2-4 hours depending on your location. You can also choose a preferred delivery time slot at checkout."
        },
        {
          q: "Is there a minimum order value for delivery?",
          a: "Yes, the minimum order value varies by location. This information is displayed at checkout before you place your order."
        },
        {
          q: "How much are delivery charges?",
          a: "Delivery charges depend on your location and order value. Exact charges will be shown at checkout before payment."
        }
      ]
    },
    {
      category: "Products",
      questions: [
        {
          q: "What is your specialty?",
          a: "We specialize in authentic Italian Tiramisu made with premium ingredients. We offer multiple flavors including Classic, Lotus Biscoff, Oreo, Chocolate, Strawberry, and Mango."
        },
        {
          q: "Do you use fresh ingredients?",
          a: "Yes! We use only the finest and freshest ingredients. All our desserts are handcrafted daily to ensure maximum freshness and quality."
        },
        {
          q: "How long do your products stay fresh?",
          a: "Our Tiramisu should be refrigerated immediately and consumed within 2-3 days for the best taste and quality."
        },
        {
          q: "Do you have vegetarian options?",
          a: "Yes! Most of our products are vegetarian. We clearly mark vegetarian and egg-containing items on each product page."
        },
        {
          q: "Can I customize my order?",
          a: "Yes! We accept custom orders for special occasions. Please contact us at +91 7845712388 to discuss your requirements."
        }
      ]
    },
    {
      category: "Returns & Refunds",
      questions: [
        {
          q: "What is your return policy?",
          a: "Due to food safety regulations, we maintain a NO RETURN and NO REFUND policy for all food items. Exceptions apply only for damaged, wrong, or missing items."
        },
        {
          q: "What if my order arrives damaged?",
          a: "If your order arrives damaged or spoiled, please contact us immediately with photos within 2 hours of delivery. We will provide a replacement or refund."
        },
        {
          q: "Can I cancel my order?",
          a: "Orders can be cancelled only before preparation begins. Once your order is being prepared or out for delivery, it cannot be cancelled."
        },
        {
          q: "How do I get a refund?",
          a: "Refunds are processed only for valid claims (damaged/wrong product). Approved refunds take 5-7 business days to reflect in your account."
        }
      ]
    },
    {
      category: "Account & Newsletter",
      questions: [
        {
          q: "Do I need an account to order?",
          a: "You can browse without an account, but creating one makes checkout faster and helps you track orders and access special offers."
        },
        {
          q: "How do I subscribe to your newsletter?",
          a: "Scroll down to the footer and enter your email in the 'Sign up for updates' section. You'll receive updates about new products and special offers."
        },
        {
          q: "How do I unsubscribe from emails?",
          a: "Click the 'Unsubscribe' link at the bottom of any newsletter email, or contact us to remove you from our mailing list."
        },
        {
          q: "Is my personal information safe?",
          a: "Yes! We take data security seriously. Please read our Privacy Policy for details on how we protect and use your information."
        }
      ]
    },
    {
      category: "Storage & Handling",
      questions: [
        {
          q: "How should I store Tiramisu?",
          a: "Store in refrigerator immediately at 2-4°C. Keep covered to prevent drying. Do not freeze as it affects texture and taste."
        },
        {
          q: "Can I freeze Tiramisu?",
          a: "We do not recommend freezing as it affects the texture, flavor, and quality of the dessert."
        },
        {
          q: "How do I know if the product has gone bad?",
          a: "Check for unusual odor, discoloration, or mold. Always consume within the recommended period and before the expiry date."
        }
      ]
    },
    {
      category: "Contact & Support",
      questions: [
        {
          q: "How can I contact customer support?",
          a: "Call us at +91 7845712388 or email lapatisserielapatisserie@gmail.com. We're available Monday-Sunday, 9 AM - 9 PM."
        },
        {
          q: "Where is your store located?",
          a: "We're located at LIG 208 Gandhi Nagar, Peelamedu, Coimbatore, Tamil Nadu."
        },
        {
          q: "Do you cater for events?",
          a: "Yes! We accept bulk orders for parties, events, and corporate functions. Contact us at +91 7845712388 to discuss your requirements."
        }
      ]
    }
  ];

  const toggleFAQ = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gray-200">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-wide mb-4" style={{ color: '#281c20' }}>
            Frequently Asked Questions
          </h1>
          <p className="text-base text-gray-600 tracking-wide">
            Find answers to common questions about our products and services
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-10">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="border-b border-gray-200 pb-10 last:border-0">
              <h2 className="text-2xl font-light mb-6" style={{ color: '#281c20' }}>
                {category.category}
              </h2>
              
              <div className="space-y-4">
                {category.questions.map((faq, questionIndex) => {
                  const index = `${categoryIndex}-${questionIndex}`;
                  const isOpen = openIndex === index;
                  
                  return (
                    <div key={questionIndex} className="border border-gray-200">
                      <button
                        onClick={() => toggleFAQ(categoryIndex, questionIndex)}
                        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium pr-8" style={{ color: '#281c20' }}>
                          {faq.q}
                        </span>
                        <span 
                          className="text-2xl font-light transition-transform flex-shrink-0"
                          style={{ 
                            color: '#733857',
                            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
                          }}
                        >
                          +
                        </span>
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-4 pt-2 bg-gray-50">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-16 text-center bg-gray-50 p-10 border border-gray-200">
          <h2 className="text-2xl font-light mb-4" style={{ color: '#281c20' }}>
            Still Have Questions?
          </h2>
          <p className="text-gray-700 mb-8 leading-relaxed max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our customer support team is here to help.
          </p>
          <div className="space-y-4 mb-8">
            <p className="text-gray-700">
              <span className="font-medium" style={{ color: '#733857' }}>Phone:</span>{' '}
              <a href="tel:+917845712388" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>
                +91 7845712388
              </a>
              {' / '}
              <a href="tel:+919362166816" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>
                +91 9362166816
              </a>
            </p>
            <p className="text-gray-700">
              <span className="font-medium" style={{ color: '#733857' }}>Email:</span>{' '}
              <a href="mailto:lapatisserielapatisserie@gmail.com" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>
                lapatisserielapatisserie@gmail.com
              </a>
            </p>
          </div>
          <HoverButton
            onClick={() => navigate('/contact')}
            text="CONTACT US"
            hoverText="GET IN TOUCH"
            variant="primary"
            size="large"
            className="px-10 py-4 text-sm tracking-wider"
          />
        </div>
      </div>
    </div>
  );
};

export default FAQ;
