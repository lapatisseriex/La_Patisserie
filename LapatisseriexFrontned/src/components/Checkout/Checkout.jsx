import React, { useState, useEffect } from 'react';

import { useCart } from '../../hooks/useCart';
import { calculatePricing, calculateCartTotals, formatCurrency } from '../../utils/pricingUtils';
import {
  Mail,
  Phone,
  User,
  MapPin,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Package,
} from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';


const Checkout = () => {
  const { user } = useAuth();
  const { cartItems, cartTotal, cartCount, isEmpty } = useCart();

  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: User Info, 2: Payment, 3: Confirmation

  // Redirect if cart is empty
  useEffect(() => {
    if (isEmpty) {
      setError('Your cart is empty. Add some items before proceeding to checkout.');
    }
  }, [isEmpty]);

  const handleProceedToPayment = () => {
    if (!email) {
      setError('Please enter your email address before proceeding');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };
  console.log(user);
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Checkout</h1>

      {/* Cart summary */}
      {!isEmpty && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <ShoppingBag className="text-blue-500 mr-2" size={20} />
            <p className="text-blue-800">
              <strong>{cartCount}</strong> items in your cart - Total:{' '}
              <strong>₹{isNaN(cartTotal) ? '0.00' : cartTotal.toFixed(2)}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* If cart is empty */}
      {isEmpty ? (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-4">
            Add some delicious items to your cart before proceeding to checkout.
          </p>
          <button
            onClick={() => (window.location.href = '/products')}
            className="py-2 px-6 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout form */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div
                className={`flex items-center ${
                  step >= 1 ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                    step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  1
                </div>
                <span className="ml-2">User Info</span>
              </div>
              <div
                className={`w-12 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}
              ></div>
              <div
                className={`flex items-center ${
                  step >= 2 ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                    step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  2
                </div>
                <span className="ml-2">Payment</span>
              </div>
              <div
                className={`w-12 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}
              ></div>
              <div
                className={`flex items-center ${
                  step >= 3 ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                    step >= 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  3
                </div>
                <span className="ml-2">Confirmation</span>
              </div>
            </div>

            {/* User Info Step */}
            {step === 1 && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">User Information</h2>
                <div className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
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
                    <label className="block text-sm font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
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
                    <label className="block text-sm font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
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
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
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
                </div>

                {/* Proceed Button */}
                <div className="pt-4">
                  <button
                    onClick={handleProceedToPayment}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-black hover:bg-gray-800 text-white font-medium"
                  >
                    Proceed to Payment <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Payment Step */}
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
                    onClick={() => (window.location.href = '/')}
                    className="py-2 px-6 bg-black text-white rounded-md hover:bg-gray-800"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm sticky top-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
                <Package className="mr-2 text-[#733857]" size={20} /> Order Summary
              </h3>

              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent truncate">
                        {item.name}
                      </p>
                      <p className="text-sm bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">
                      {(() => {
                        // Use centralized pricing calculation for consistency
                        const prod = item.productDetails || item.product || item;
                        const vi = Number.isInteger(item?.variantIndex) ? item.variantIndex : 0;
                        const variant = prod?.variants?.[vi];
                        
                        if (variant) {
                          const pricing = calculatePricing(variant);
                          const itemTotal = pricing.finalPrice * item.quantity;
                          return `₹${itemTotal.toFixed(2)}`;
                        } else {
                          // Fallback to simple multiplication if variant not found
                          const itemTotal = item.price * item.quantity;
                          return isNaN(itemTotal) ? '₹0.00' : `₹${itemTotal.toFixed(2)}`;
                        }
                      })()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              <div className="border-t pt-4">
                {(() => {
                  // Calculate cart totals for discount information
                  const totals = calculateCartTotals(cartItems);
                  
                  return (
                    <>
                      {/* Show discount savings if any */}
                      {totals.totalSavings > 0 && (
                        <>
                          <div className="flex justify-between items-center text-sm bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mb-1">
                            <span>Original Price:</span>
                            <span className="line-through">{formatCurrency(totals.originalTotal)}</span>
                          </div>
                          <div className="flex justify-between items-center text-green-600 text-sm mb-2">
                            <span>Discount Savings {totals.averageDiscountPercentage > 0 && `(${totals.averageDiscountPercentage}% OFF)`}:</span>
                            <span className="font-medium">-{formatCurrency(totals.totalSavings)}</span>
                          </div>
                          {/* Show average discount percentage prominently for multiple products */}
                          {cartItems.length > 1 && totals.averageDiscountPercentage > 0 && (
                            <div className="flex justify-between bg-green-50 p-2 rounded-md border border-green-100 mb-2">
                              <span className="text-green-700 font-medium text-sm">Average Discount:</span>
                              <span className="text-green-700 font-bold text-sm">{totals.averageDiscountPercentage}% OFF</span>
                            </div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">Total:</span>
                        <span className="text-lg font-bold bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent">{formatCurrency(totals.finalTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm bg-gradient-to-r from-[#733857] via-[#8d4466] to-[#412434] bg-clip-text text-transparent mt-1">
                        <span>{cartItems.length} items</span>
                        <span>Delivery charges may apply</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
