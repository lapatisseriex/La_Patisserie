import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { Mail, Phone, User, MapPin, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';

const Checkout = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  // email verification removed
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: User Info, 2: Payment, 3: Confirmation

  // Effect to check if email verification is needed
  useEffect(() => {
    // Email verification flow removed; no-op
  }, [user]);

  // Handle proceed to payment - require verified email
  const handleProceedToPayment = () => {
    // Proceed without email verification requirement
    if (!email) {
      setError('Please enter your email address before proceeding');
      return;
    }
    
    setStep(2);
  };

  // Handle email input change
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // No verification flow; hide component
  // email verification removed
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
            1
          </div>
          <span className="ml-2">User Info</span>
        </div>
        <div className={`w-12 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
            2
          </div>
          <span className="ml-2">Payment</span>
        </div>
        <div className={`w-12 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step >= 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
            3
          </div>
          <span className="ml-2">Confirmation</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* User Info Step */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={user?.name || ''}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={user?.phone || ''}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                />
                {/* email verification badge removed */}
              </div>
            </div>
            
            {/* Email verification removed */}
            
            {/* Location */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Delivery Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={user?.location?.name || 'Not set'}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                />
              </div>
            </div>
            
            {/* Proceed button */}
            <div className="pt-4">
              <button
                onClick={handleProceedToPayment}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-black hover:bg-gray-800 text-white font-medium`}
              >
                Proceed to Payment
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Step - Simplified for demonstration */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Payment</h2>
          <p className="text-gray-600 mb-4">
            Payment processing would be implemented here.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="py-2 px-4 bg-black text-white rounded-md hover:bg-gray-800"
            >
              Complete Payment
            </button>
          </div>
        </div>
      )}
      
      {/* Confirmation Step */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <CheckCircle className="text-green-600" size={48} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              A confirmation email has been sent to {email}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="py-2 px-6 bg-black text-white rounded-md hover:bg-gray-800"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;