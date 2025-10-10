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
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="text-2xl text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for contacting us. We've received your message and will get back to you soon.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="bg-black text-white px-6 py-2 hover:bg-gray-800 transition-colors"
          >
            Send Another Message
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-black text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-gray-300">
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
            className="bg-white border border-gray-200 p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
            
            {/* User Status Message */}
            {isAuthenticated && user && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6"
              >
                <div className="flex items-center">
                  <FiUser className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Welcome back, {user.name || 'User'}!
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Your contact information has been automatically filled from your profile.
                      {user?.emailVerified || user?.phoneVerified ? ' Verified fields are protected.' : ''}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                  {isAuthenticated && user?.name && (
                    <span className="ml-2 inline-flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      <FiUser className="w-3 h-3 mr-1" />
                      Auto-filled
                    </span>
                  )}
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 focus:outline-none focus:border-black transition-colors"
                    placeholder="Enter your full name"
                    required
                  />
                  {isAuthenticated && user?.name && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <FiUser className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                  {isAuthenticated && user?.emailVerified && (
                    <span className="ml-2 inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      <FiCheck className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  )}
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 focus:outline-none focus:border-black transition-colors"
                    placeholder="Enter your email address"
                    required
                    disabled={isAuthenticated && user?.email && user?.emailVerified}
                  />
                  {isAuthenticated && user?.email && user?.emailVerified && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <FiCheck className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                  {isAuthenticated && user?.phoneVerified && (
                    <span className="ml-2 inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      <FiCheck className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  )}
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 focus:outline-none focus:border-black transition-colors"
                    placeholder="Enter your phone number"
                    disabled={isAuthenticated && user?.phone && user?.phoneVerified}
                  />
                  {isAuthenticated && user?.phone && user?.phoneVerified && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <FiCheck className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Field */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <div className="relative">
                  <FiMessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 focus:outline-none focus:border-black transition-colors"
                    placeholder="What is this about?"
                    required
                  />
                </div>
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-3 py-3 border border-gray-300 focus:outline-none focus:border-black transition-colors resize-none"
                  placeholder="Tell us more about your inquiry..."
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-3 px-6 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto mb-4">
                <FiMail />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600">support@lapatisserie.com</p>
              <p className="text-gray-600">info@lapatisserie.com</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto mb-4">
                <FiMessageSquare />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Response Time</h3>
              <p className="text-gray-600">We typically respond</p>
              <p className="text-gray-600">within 24 hours</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;