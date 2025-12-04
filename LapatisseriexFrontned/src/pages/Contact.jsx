import { useState, useEffect } from 'react';
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
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

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
          'Content-Type': 'application/json'},
        body: JSON.stringify(formData)});

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
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
      <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2" style={{ borderColor: '#733857' }}>
            <FiCheck className="text-3xl" style={{ color: '#733857' }} />
          </div>
          <h2 className="text-3xl font-light mb-4" style={{ color: '#281c20' }}>Message Sent!</h2>
          <p className="text-gray-700 mb-8 leading-relaxed">
            Thank you for contacting us. We've received your message and will get back to you soon.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="px-10 py-4 text-sm tracking-wider transition-all hover:opacity-80"
            style={{ 
              backgroundColor: '#281c20',
              color: 'white'
            }}
          >
            SEND ANOTHER MESSAGE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gray-200">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-wide mb-4" style={{ color: '#281c20' }}>
            Contact Us
          </h1>
          <p className="text-base text-gray-600 tracking-wide">
            We'd love to hear from you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 mb-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-light mb-6" style={{ color: '#281c20' }}>Get In Touch</h2>
              <p className="text-base text-gray-700 leading-relaxed mb-6">
                Have questions about our products or services? Want to place a custom order? We're here to help!
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-12 h-12 flex items-center justify-center border border-gray-200 mr-4">
                  <FiPhone className="text-xl" style={{ color: '#733857' }} />
                </div>
                <div>
                  <h3 className="font-medium mb-2" style={{ color: '#281c20' }}>Phone</h3>
                  <p className="text-gray-700">
                    <a href="tel:+917845712388" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>+91 7845712388</a>
                  </p>
                  <p className="text-gray-700">
                    <a href="tel:+919362166816" className="hover:opacity-70 transition-opacity" style={{ color: '#733857' }}>+91 9362166816</a>
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 flex items-center justify-center border border-gray-200 mr-4">
                  <FiMail className="text-xl" style={{ color: '#733857' }} />
                </div>
                <div>
                  <h3 className="font-medium mb-2" style={{ color: '#281c20' }}>Email</h3>
                  <p className="text-gray-700">
                    <a href="mailto:lapatisserielapatisserie@gmail.com" className="hover:opacity-70 transition-opacity break-all" style={{ color: '#733857' }}>
                      lapatisserielapatisserie@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 flex items-center justify-center border border-gray-200 mr-4">
                  <FiMessageSquare className="text-xl" style={{ color: '#733857' }} />
                </div>
                <div>
                  <h3 className="font-medium mb-2" style={{ color: '#281c20' }}>Address</h3>
                  <p className="text-gray-700">
                    LIG 208 Gandhi Maannagar<br />
                    Peelamedu, Coimbatore
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 p-8 border border-gray-200">
            <h2 className="text-2xl font-light mb-6" style={{ color: '#281c20' }}>Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-400 transition-colors text-gray-700"
                    placeholder="Your name"
                    disabled={isSubmitting}
                  />
                  <FiUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-400 transition-colors text-gray-700"
                    placeholder="your.email@example.com"
                    disabled={isSubmitting}
                  />
                  <FiMail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Phone
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-400 transition-colors text-gray-700"
                    placeholder="Your phone number"
                    disabled={isSubmitting}
                  />
                  <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-400 transition-colors text-gray-700"
                  placeholder="What is this about?"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-400 transition-colors resize-none text-gray-700"
                  placeholder="Your message..."
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-8 py-4 text-sm tracking-wider transition-all hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ 
                  backgroundColor: '#281c20',
                  color: 'white'
                }}
              >
                {isSubmitting ? 'SENDING...' : (
                  <>
                    <FiSend className="mr-2" />
                    SEND MESSAGE
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
