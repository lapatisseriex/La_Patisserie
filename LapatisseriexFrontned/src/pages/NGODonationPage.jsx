import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Sparkles } from 'lucide-react';
import NGODonation from '../components/Payment/NGODonation';

const NGODonationPage = () => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Smooth scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Hero Section */}
      <div className="bg-[#733857] text-white py-12 px-4 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">BACK TO HOME</span>
          </Link>

          {/* Tamil motto at top */}
          <div className="bg-white/10 border border-white/20 px-4 py-3 mb-6">
            <p className="text-sm sm:text-base font-semibold tracking-wide text-center">
              "கற்போம், கற்பிப்போம், அதிகாரம் வெல்வோம், அறம் செய்வோம்!"
            </p>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-light tracking-wide">
                கற்பிப்போம் (Karpippom)
              </h1>
              <p className="text-white/90 text-sm mt-1 tracking-wide">
                To Teach. To Empower. To Transform Lives.
              </p>
            </div>
          </div>
          
          <div className="space-y-3 text-white/90 max-w-2xl leading-relaxed tracking-wide">
            <p className="text-base">
              Through <span className="font-semibold text-white">Karpippom</span>, we aim to reach the unreached, teach the untaught, and build a brighter tomorrow — one student at a time.
            </p>
            <p className="text-base">
              Education is not just a right — it's the foundation for change.
            </p>
            <p className="text-base font-medium text-white">
              Let's build that foundation together.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold tracking-wide">100% Free</p>
                <p className="text-white/80 text-xs tracking-wide">For All Students</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <p className="font-semibold tracking-wide">Direct Impact</p>
                <p className="text-white/80 text-xs tracking-wide">Your Donation Helps</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Impact Stats Banner */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-white border border-gray-100 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-light tracking-wide mb-2" style={{ color: '#733857' }}>1000+</div>
            <div className="text-sm tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>Students Enrolled</div>
          </div>
          <div className="bg-white border border-gray-100 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-light tracking-wide mb-2" style={{ color: '#733857' }}>50+</div>
            <div className="text-sm tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>Expert Trainers</div>
          </div>
          <div className="bg-white border border-gray-100 p-6 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="text-3xl font-light tracking-wide mb-2" style={{ color: '#733857' }}>100%</div>
            <div className="text-sm tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>Free Classes</div>
          </div>
        </div>

        {/* Donation Component */}
        <NGODonation />

        {/* Testimonials Section */}
        <div className="mt-12 bg-white border border-gray-100 p-8 shadow-sm">
          <h3 className="text-2xl font-light tracking-wide mb-6 text-center" style={{ color: '#281c20' }}>
            Why Your Support Matters
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 border border-gray-100 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#733857] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-semibold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold tracking-wide mb-2" style={{ color: '#281c20' }}>Quality Education Access</h4>
                  <p className="text-sm tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>
                    Your donation provides students with access to expert trainers and quality study materials they couldn't afford otherwise.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#733857] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-semibold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold tracking-wide mb-2" style={{ color: '#281c20' }}>Breaking Barriers</h4>
                  <p className="text-sm tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>
                    Help students from underprivileged backgrounds compete equally in their board exams and future opportunities.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#733857] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-semibold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold tracking-wide mb-2" style={{ color: '#281c20' }}>Building Confidence</h4>
                  <p className="text-sm tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>
                    Live interactive sessions and doubt clearing help students build confidence and excel in their studies.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#733857] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl font-semibold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold tracking-wide mb-2" style={{ color: '#281c20' }}>Long-term Impact</h4>
                  <p className="text-sm tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>
                    Education is the foundation for breaking the cycle of poverty and creating opportunities for generations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Section */}
        <div className="mt-12 bg-[#733857] p-8 text-white text-center border border-gray-100 shadow-sm">
          <blockquote className="text-xl md:text-2xl font-light italic mb-4 tracking-wide">
            "கற்போம் கற்பிப்போம் அதிகாரம் வெல்வோம் அறம் செய்வோம்"
          </blockquote>
          <p className="text-white/90 text-sm tracking-wide">
            Let's learn together, teach together, and make education accessible to all
          </p>
        </div>

        {/* Closing Message */}
        <div className="mt-12 bg-gray-50 border border-gray-100 p-8 text-center">
          <p className="text-base mb-4 tracking-wide" style={{ color: '#281c20' }}>
            With Warm Regards,
          </p>
          <p className="text-lg font-semibold mb-2 tracking-wide" style={{ color: '#733857' }}>
            Aramsei Payilagam Team
          </p>
          <p className="text-sm italic tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>
            "கற்போம், கற்பிப்போம், அதிகாரம் வெல்வோம், அறம் செய்வோம்!"
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-white border-t border-gray-100 py-8 px-4 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="mb-4 tracking-wide" style={{ color: 'rgba(40, 28, 32, 0.7)' }}>
            Have questions about our initiative?
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a
              href="tel:+917338882473"
              className="font-semibold hover:underline tracking-wide"
              style={{ color: '#733857' }}
            >
              Call Sanjay: +91 7338882473
            </a>
            <span style={{ color: 'rgba(40, 28, 32, 0.3)' }}>•</span>
            <a
              href="tel:+919789492146"
              className="font-semibold hover:underline tracking-wide"
              style={{ color: '#733857' }}
            >
              Call Aparna: +91 97894 92146
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGODonationPage;
