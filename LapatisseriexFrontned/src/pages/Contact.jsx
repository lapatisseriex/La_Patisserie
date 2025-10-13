import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiUser, FiMessageSquare, FiSend, FiCheck, FiPhone } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const Contact = () => {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Auto-fill user data when component mounts or user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        toast.success('Message sent successfully! We\'ll get back to you soon.');
      } else {
        toast.error(result.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to send message. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <FiCheck className="text-2xl text-green-400" />
          </div>
          <h2 className="text-2xl font-light text-white mb-2">Message Sent!</h2>
          <p className="text-gray-300 mb-6">
            Thank you for contacting us. We've received your message and will get back to you soon.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="bg-white text-black px-6 py-2 hover:bg-gray-100 transition-colors"
          >
            Send Another Message
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header Section */}
      <div className="relative py-20 px-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-light text-white mb-4">Contact Us</h1>
            <p className="text-gray-300">
              Get in touch with us. We'd love to hear from you.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Contact Form Section */}
      <div className="py-16">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border border-white/10 p-8"
          >
            <h2 className="text-2xl font-light text-white mb-6">Send us a message</h2>
            
            {/* User Status Message */}
            {isAuthenticated && user && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#A855F7]/10 border border-[#A855F7]/30 p-4 mb-6"
              >
                <div className="flex items-center">
                  <FiUser className="w-5 h-5 text-[#A855F7] mr-3" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Welcome back, {user.name || 'User'}!
                    </p>
                   
                  </div>
                </div>
              </motion.div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 bg-[#151515] border border-white/10 text-white focus:outline-none focus:border-[#A855F7] transition-colors"
                    placeholder="Enter your full name"
                    required
                  />
                  {isAuthenticated && user?.name && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <FiUser className="w-5 h-5 text-[#A855F7]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                 
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 bg-[#151515] border border-white/10 text-white focus:outline-none focus:border-[#A855F7] transition-colors"
                    placeholder="Enter your email address"
                    required
                    disabled={isAuthenticated && user?.email && user?.emailVerified}
                  />
               
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number (Optional)
                  
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 bg-[#151515] border border-white/10 text-white focus:outline-none focus:border-[#A855F7] transition-colors"
                    placeholder="Enter your phone number"
                    disabled={isAuthenticated && user?.phone && user?.phoneVerified}
                  />
                
                </div>
              </div>

              {/* Subject Field */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <div className="relative">
                  <FiMessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 bg-[#151515] border border-white/10 text-white focus:outline-none focus:border-[#A855F7] transition-colors"
                    placeholder="What is this about?"
                    required
                  />
                </div>
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-3 py-3 bg-[#151515] border border-white/10 text-white focus:outline-none focus:border-[#A855F7] transition-colors resize-none"
                  placeholder="Tell us more about your inquiry..."
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-black py-3 px-6 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FiSend className="mr-2" />
                    Send Message
                  </div>
                )}
              </button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="text-center border border-white/10 p-6">
              <div className="w-12 h-12 bg-white text-black flex items-center justify-center mx-auto mb-4">
                <FiMail />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Email Us</h3>
              <p className="text-gray-300">lapatisserielapatisserie@gmail.com</p>
            </div>

            <div className="text-center border border-white/10 p-6">
              <div className="w-12 h-12 bg-white text-black flex items-center justify-center mx-auto mb-4">
                <FiPhone />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Call Us</h3>
              <p className="text-gray-300">+91 7845712388</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="bg-[#0a0a0a] py-12 border-t border-[#733857]/30">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-2xl font-light bg-gradient-to-r from-[#A855F7] via-[#ec4899] to-[#A855F7] bg-clip-text text-transparent mb-4">La Pâtisserie</h3>
          <p className="text-gray-300 mb-6">The Authentic Tiramisu Experience</p>
          <div className="space-y-2 text-gray-400 mb-8">
            <p>LIG 208 Gandhi Nagar, Peelamedu, Coimbatore</p>
            <p>Phone: <a href="tel:+917845712388" className="text-[#A855F7] hover:text-white transition-colors">+91 7845712388</a></p>
            <p>Email: <a href="mailto:lapatisserielapatisserie@gmail.com" className="text-[#A855F7] hover:text-white transition-colors">lapatisserielapatisserie@gmail.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;