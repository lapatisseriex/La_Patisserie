import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
    <div className="min-h-screen bg-[#0a0a0a] py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-300 text-lg">
            Find answers to common questions about our products and services
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category, catIndex) => (
            <div key={catIndex} className="border border-white/10 p-6 md:p-8">
              <h2 className="text-xl font-medium text-white mb-6 border-b border-white/10 pb-2">
                {category.category}
              </h2>
              
              <div className="space-y-3">
                {category.questions.map((faq, qIndex) => {
                  const index = `${catIndex}-${qIndex}`;
                  const isOpen = openIndex === index;
                  
                  return (
                    <div 
                      key={qIndex}
                      className="border border-white/10"
                    >
                      <button
                        onClick={() => toggleFAQ(catIndex, qIndex)}
                        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-white/5 transition-colors"
                      >
                        <span className="text-white font-medium pr-4">{faq.q}</span>
                        <span className="text-white text-2xl flex-shrink-0">
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-4 pt-2">
                          <p className="text-gray-300 leading-relaxed">
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
        <div className="mt-12 border border-white/10 p-8 text-center">
          <h3 className="text-xl font-medium text-white mb-3">
            Still have questions?
          </h3>
          <p className="text-gray-300 mb-6">
            Can't find the answer you're looking for? Get in touch with our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+917845712388"
              className="inline-block bg-white text-black px-8 py-3 hover:bg-gray-100 transition-colors"
            >
              CALL US
            </a>
            <a 
              href="mailto:lapatisserielapatisserie@gmail.com"
              className="inline-block bg-white text-black px-8 py-3 hover:bg-gray-100 transition-colors"
            >
              EMAIL US
            </a>
          </div>
        </div>

        {/* Footer Section */}
        <div className="mt-16 bg-[#0a0a0a] py-12 border-t border-[#733857]/30">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h3 className="text-2xl font-light bg-gradient-to-r from-[#A855F7] via-[#ec4899] to-[#A855F7] bg-clip-text text-transparent mb-4">La Pâtisserie</h3>
            <p className="text-gray-300 mb-6">The Authentic Tiramisu Experience</p>
            <div className="space-y-2 text-gray-400 mb-8">
              <p>LIG 208 Gandhi Nagar, Peelamedu, Coimbatore</p>
              <p>Phone: <a href="tel:+917845712388" className="text-[#A855F7] hover:text-white transition-colors">+91 7845712388</a></p>
              <p>Email: <a href="mailto:lapatisserielapatisserie@gmail.com" className="text-[#A855F7] hover:text-white transition-colors">lapatisserielapatisserie@gmail.com</a></p>
            </div>
            <Link 
              to="/contact" 
              className="inline-block bg-white text-black px-8 py-3 hover:bg-gray-100 transition-colors"
            >
              CONTACT US
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
