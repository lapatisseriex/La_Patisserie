import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

const Newsletter = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Prefill email with logged-in user's email, if available
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user?.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic email validation (same as footer)
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post(`${import.meta.env.VITE_VERCEL_API_URL}/newsletter/subscribe`, {
        email,
        source: 'homepage'});
      setMessage({ type: 'success', text: response.data.message || 'Subscribed successfully!' });
      setEmail('');
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to subscribe. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="newsletter" className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-6 md:p-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-light tracking-wide text-[#733857] mb-3" style={{ letterSpacing: '0.02em' }}>
              Subscribe for Sweet Updates
            </h2>
            <p className="text-gray-600 text-base md:text-lg" style={{  }}>
              Be the first to know about new flavors, seasonal specials, and exclusive offers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              aria-label="Email address"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-black placeholder-gray-500 shadow-sm focus:border-[#733857] focus:ring-2 focus:ring-[#733857]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{  }}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-white border-2 border-[#733857] text-black rounded-lg font-medium shadow-sm transition-all duration-300 hover:bg-gradient-to-r hover:from-[#733857] hover:via-[#8d4466] hover:to-[#412434] hover:text-white transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{  }}
            >
              {loading ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>

          {message.text && (
            <div
              className={`mt-4 rounded-md border p-3 text-sm ${
                message.type === 'success'
                  ? '  text-[#733857]'
                  : '  text-[#733857]'
              }`}
              role="status"
              style={{  }}
            >
              {message.text}
            </div>
          )}

          <p className="mt-4 text-center text-xs text-gray-500" style={{  }}>
            We respect your privacy and will never share your information
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;





