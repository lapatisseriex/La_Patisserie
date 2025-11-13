import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { useCart } from '../../hooks/useCart';
import { useLocation } from '../../context/LocationContext/LocationContext';
import { useHostel } from '../../context/HostelContext/HostelContext';
import { calculatePricing, calculateCartTotals, formatCurrency } from '../../utils/pricingUtils';
import { resolveOrderItemVariantLabel } from '../../utils/variantUtils';
import OfferBadge from '../common/OfferBadge';
import AnimatedButton from '../common/AnimatedButton';
import MaskButton from '../common/MaskButton';
import CubeButton from '../common/CubeButton';
import { getOrderExperienceInfo } from '../../utils/orderExperience';
import {
  Mail,
  Phone,
  User,
  MapPin,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  Package,
  Building,
  Edit2,
  Save,
  X} from 'lucide-react';

import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import { toast } from 'react-toastify';


const Checkout = () => {
  const { user, getCurrentUser, updateUser } = useAuth();
  const { cartItems, cartTotal, cartCount, isEmpty } = useCart();
  const { locations, loading: locationsLoading, updateUserLocation, getCurrentLocationName } = useLocation();
  const { hostels, loading: hostelsLoading, fetchHostelsByLocation, clearHostels } = useHostel();
  const navigate = useNavigate();

  const orderExperience = useMemo(() => getOrderExperienceInfo(user), [user]);

  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: User Info, 2: Ready for Payment
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editLocationId, setEditLocationId] = useState(user?.location?._id || '');
  const [editHostelId, setEditHostelId] = useState(user?.hostel?._id || '');
  const [saving, setSaving] = useState(false);

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditLocationId(user.location?._id || '');
      setEditHostelId(user.hostel?._id || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Fetch hostels when location changes in edit mode
  useEffect(() => {
    if (isEditMode && editLocationId) {
      fetchHostelsByLocation(editLocationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editLocationId, isEditMode]);

  const getVariantDetails = (item) => {
    const prod = item?.productDetails || item?.product || item || {};
    const variants = Array.isArray(prod?.variants)
      ? prod.variants
      : Array.isArray(item?.variants)
        ? item.variants
        : [];

    const variantIndex = Number.isInteger(item?.productDetails?.variantIndex)
      ? item.productDetails.variantIndex
      : Number.isInteger(item?.variantIndex)
        ? item.variantIndex
        : 0;

    const variantFromArray = variants?.[variantIndex];
    const selectedVariant = item?.productDetails?.selectedVariant || item?.selectedVariant || variantFromArray || item?.variant;

    const variantLabel = resolveOrderItemVariantLabel({
      ...item,
      variants,
      variantIndex,
      variant: item?.variant || selectedVariant,
      selectedVariant,
      variantLabel: item?.variantLabel || prod?.variantLabel
    });

    return {
      variantIndex,
      variant: item?.variant || selectedVariant || variantFromArray || null,
      variantLabel
    };
  };

  // Fetch hostels for current user location on mount (only once)
  useEffect(() => {
    if (user?.location?._id) {
      fetchHostelsByLocation(user.location._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.location?._id]);

  // Redirect if cart is empty
  useEffect(() => {
    if (isEmpty) {
      setError('Your cart is empty. Add some items before proceeding to checkout.');
    }
  }, [isEmpty]);

  // Handle save changes
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      setError('');

      if (!editName.trim()) {
        setError('Name cannot be empty');
        setSaving(false);
        return;
      }

      if (!editLocationId) {
        setError('Please select a delivery location');
        setSaving(false);
        return;
      }

      if (!editHostelId) {
        setError('Please select a hostel');
        setSaving(false);
        return;
      }

      // Update user name, location, and hostel in one API call
      const authToken = localStorage.getItem('authToken');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/users/${user.uid}`,
        { 
          name: editName.trim(),
          location: editLocationId,
          hostel: editHostelId 
        },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`}}
      );

      // Get the full location and hostel objects
      const selectedLocation = locations.find(loc => loc._id === editLocationId);
      const selectedHostel = hostels.find(h => h._id === editHostelId);

      // Immediately update Redux store for instant UI update across all components
      if (updateUser) {
        updateUser({
          ...user,
          name: editName.trim(),
          location: selectedLocation || editLocationId,
          hostel: selectedHostel || editHostelId
        });
      }

      // Also update location in LocationContext for immediate UI update
      await updateUserLocation(editLocationId);

      // Refresh user data from server to ensure everything is in sync
      // This will update Redux store with the server response
      await getCurrentUser();

      toast.success('Information updated successfully!');
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating user information:', error);
      setError(error.response?.data?.message || 'Failed to update information. Please try again.');
      toast.error('Failed to update information');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditName(user?.name || '');
    setEditLocationId(user?.location?._id || '');
    setEditHostelId(user?.hostel?._id || '');
    setIsEditMode(false);
    setError('');
  };

  const handleProceedToPayment = () => {
    if (!email) {
      setError('Please enter your email address before proceeding');
      return;
    }
    
    // Debug logging
    console.log('Validation check - User object:', user);
    console.log('User location:', user?.location);
    console.log('User hostel:', user?.hostel);
    
    // Validate location selection
    if (!user?.location || !user.location._id) {
      setError('Please select your delivery location from your profile before proceeding');
      return;
    }
    
    // Validate hostel selection - check for both existence and valid data
    if (!user?.hostel || !user.hostel._id || !user.hostel.name) {
      setError('Please select your hostel from your profile before proceeding to payment');
      return;
    }
    
    setError('');
    // Navigate to payment page
    navigate('/payment');
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };
  console.log(user);
  return (
    <div className="min-h-screen bg-gray-25" style={{ backgroundColor: '#fafafa' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back to Cart */}
        <div className="mb-6">
          <Link 
            to="/cart" 
            className="inline-flex items-center gap-2 text-[#733857] hover:text-[#8d4466] transition-colors duration-200"
          >
            <ChevronLeft size={20} />
            <span className="font-medium">Back to Cart</span>
          </Link>
        </div>


        {/* If cart is empty */}
        {isEmpty ? (
          <div className="max-w-xl mx-auto text-center space-y-6">
            <div className="mx-auto flex h-24 w-24 items-center justify-center border border-[#733857]/20">
              <Package className="w-10 h-10 text-[#733857]" />
            </div>
            <h2 className="text-3xl font-light tracking-wide text-[#733857]">
              Your cart is empty
            </h2>
            <p className="text-sm text-[#733857]/70 max-w-md mx-auto">
              Add some delicious items before heading to checkout.
            </p>
            <button
              onClick={() => (window.location.href = '/products')}
              className="inline-flex items-center justify-center gap-2 border border-[#733857] px-6 py-3 text-sm font-medium tracking-wide text-[#733857] transition-colors duration-300 hover:bg-[#733857] hover:text-white"
            >
              Browse Products
            </button>
          </div>
        ) : (
          /* Two-column layout - Mobile: Products above, Desktop: Side by side */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Order Summary - Shows FIRST on mobile, SECOND on desktop */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-4 h-fit border-none shadow-none">
              <div className="p-8 border-none shadow-none">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-semibold text-[#733857]">Order Summary</h2>
                  <span
                    className="text-sm font-semibold tracking-wide"
                    style={{ color: orderExperience.color}}
                  >
                    {orderExperience.label}
                  </span>
                </div>

                {/* Cart Items */}
                <div className="space-y-6 mb-8 max-h-96 overflow-y-auto pt-2 pr-2">
                  {cartItems.map((item) => {
                    const { variant, variantLabel } = getVariantDetails(item);
                    const fallbackLabel = (() => {
                      const opts = item.options || item.productDetails?.options || {};
                      const weight = opts.weight || item.productDetails?.weight || item.productDetails?.variant?.weight || '';
                      const flavor = opts.flavor || item.productDetails?.flavor || '';
                      const parts = [];
                      if (weight) parts.push(weight);
                      if (flavor) parts.push(flavor);
                      return parts.length ? parts.join(' • ') : '';
                    })();

                    const displayLabel = variantLabel || fallbackLabel || 'Standard';
                    const pricing = variant ? calculatePricing(variant) : null;
                    const itemQuantity = Number(item.quantity || 0);
                    
                    // Free products should have 0 price
                    const rawUnitPrice = item.isFreeProduct ? 0 : (pricing ? pricing.finalPrice : Number(item?.price) || 0);
                    const safeUnitPrice = Number.isFinite(rawUnitPrice) ? rawUnitPrice : 0;
                    const mrpValue = item.isFreeProduct ? 0 : (pricing ? pricing.mrp : rawUnitPrice);
                    const safeMrp = Number.isFinite(mrpValue) ? mrpValue : safeUnitPrice;
                    const discountPercentage = Number.isFinite(pricing?.discountPercentage) ? pricing.discountPercentage : 0;
                    const hasDiscount = discountPercentage > 0;
                    const itemTotal = safeUnitPrice * itemQuantity;
                    const originalTotal = hasDiscount ? safeMrp * itemQuantity : itemTotal;

                    return (
                      <div key={item.id} className="flex items-start gap-4">
                        <div className="relative flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-xl"
                          />
                          <span className="absolute -top-2 -right-2 bg-[#733857] text-white text-xs font-medium min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-normal text-gray-900">
                              {item.name}
                            </p>
                            {item.isFreeProduct && (
                              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                FREE
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {displayLabel}
                          </p>
                          {hasDiscount && !item.isFreeProduct && (
                            <div className="mt-1">
                              <OfferBadge label={`${discountPercentage}% OFF`} className="text-[10px]" />
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-normal text-gray-900 whitespace-nowrap text-right">
                          {hasDiscount && (
                            <div className="text-xs text-gray-500 line-through">
                              ₹{originalTotal.toFixed(2)}
                            </div>
                          )}
                          <div>
                            {Number.isFinite(itemTotal) ? `₹${itemTotal.toFixed(2)}` : '₹0.00'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  {(() => {
                    const totals = calculateCartTotals(cartItems);
                    
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Subtotal · {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span>
                          <span className="text-gray-900">{formatCurrency(totals.originalTotal > 0 ? totals.originalTotal : totals.finalTotal)}</span>
                        </div>
                        {totals.totalSavings > 0 && (
                          <div className="flex justify-between text-sm items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700">Discount</span>
                              {totals.averageDiscountPercentage > 0 && (
                                <OfferBadge label={`${totals.averageDiscountPercentage}% OFF`} className="text-[10px]" />
                              )}
                            </div>
                            <span className="text-green-600 font-normal">-{formatCurrency(totals.totalSavings)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Delivery</span>
                          <span className="text-gray-600">Calculated at next step</span>
                        </div>
                        <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                          <span className="font-semibold text-gray-900">Total</span>
                          <div className="text-right">
                            <div className="text-xs text-gray-500 mb-0.5">INR</div>
                            <div className="text-xl font-semibold text-gray-900">{formatCurrency(totals.finalTotal)}</div>
                          </div>
                        </div>
                      
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Contact & Delivery Information - Shows SECOND on mobile, FIRST on desktop */}
            <div className="order-2 lg:order-1 bg-white p-5 sm:p-8 space-y-6 sm:space-y-8 rounded-xl shadow-sm border border-gray-100">
              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <AlertCircle className="text-red-500 mr-2" size={20} />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="bg-transparent p-0 shadow-none border-b border-gray-100 pb-5 sm:pb-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-[#733857]">Contact Information</h2>
                  {!isEditMode && (
                    <CubeButton
                      onClick={() => setIsEditMode(true)}
                    >
                      Edit
                    </CubeButton>
                  )}
                </div>
                {/* Phone + Email compact grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {/* Phone */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[#733857] mb-1.5 sm:mb-2">
                      Phone number
                    </label>
                    <input
                      type="text"
                      value={user?.phone || ''}
                      readOnly
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[#733857] mb-1.5 sm:mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={user?.email || email}
                      readOnly
                      className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="bg-transparent p-0 shadow-none">
                <h2 className="text-lg font-semibold text-[#733857] mb-4">Delivery</h2>
                
                {/* Name */}
                <div className="mb-3 sm:mb-4">
                  <label className="block text-xs sm:text-sm font-medium text-[#733857] mb-1.5 sm:mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={isEditMode ? editName : user?.name || ''}
                    onChange={(e) => setEditName(e.target.value)}
                    readOnly={!isEditMode}
                    className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg ${
                      isEditMode 
                        ? 'bg-white text-gray-900 focus:ring-2 focus:ring-[#733857] focus:border-transparent' 
                        : 'bg-white text-gray-900'
                    }`}
                  />
                </div>
                {/* Location + Hostel compact grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {/* Location */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[#733857] mb-1.5 sm:mb-2">
                      Delivery Location
                    </label>
                    {isEditMode ? (
                      <select
                        value={editLocationId}
                        onChange={(e) => setEditLocationId(e.target.value)}
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#733857] focus:border-transparent"
                      >
                        <option value="">Select a location</option>
                        {locationsLoading ? (
                          <option disabled>Loading locations...</option>
                        ) : (
                          locations.map((location) => (
                            <option key={location._id} value={location._id}>
                              {location.area}, {location.city} - {location.pincode}
                            </option>
                          ))
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={(() => {
                          const locationName = getCurrentLocationName();
                          if (locationName === "Select Location" || locationName === "Location Loading...") {
                            if (user?.location) {
                              if (typeof user.location === 'object' && user.location.area) {
                                return `${user.location.area}, ${user.location.city}`;
                              } else if (typeof user.location === 'string' && locations.length > 0) {
                                const loc = locations.find(l => l._id === user.location);
                                return loc ? `${loc.area}, ${loc.city}` : 'Not set';
                              }
                            }
                            return 'Not set';
                          }
                          return locationName;
                        })()}
                        readOnly
                        className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 ${!user?.location ? 'border-red-300' : ''}`}
                      />
                    )}
                    {!user?.location && !isEditMode && (
                      <p className="text-xs sm:text-sm text-red-600 mt-1">
                        Please set your delivery location before proceeding
                      </p>
                    )}
                  </div>

                  {/* Hostel */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[#733857] mb-1.5 sm:mb-2">
                      Hostel/Residence
                    </label>
                    {isEditMode ? (
                      <select
                        value={editHostelId}
                        onChange={(e) => setEditHostelId(e.target.value)}
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-[#733857] focus:border-transparent"
                      >
                        <option value="">Select a hostel</option>
                        {hostelsLoading ? (
                          <option disabled>Loading hostels...</option>
                        ) : hostels.length === 0 ? (
                          <option disabled>No hostels available for this location</option>
                        ) : (
                          hostels.map((hostel) => (
                            <option key={hostel._id} value={hostel._id}>
                              {hostel.name}
                            </option>
                          ))
                        )}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={user?.hostel?.name || 'Not set'}
                        readOnly
                        className={`w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 ${!user?.hostel ? 'border-red-300' : ''}`}
                      />
                    )}
                    {!user?.hostel && !isEditMode && (
                      <p className="text-xs sm:text-sm text-red-600 mt-1">
                        Please set your hostel before proceeding
                      </p>
                    )}
                  </div>
                </div>

                {/* Common service coverage note */}
                <div className="mt-3 sm:mt-4 rounded-md bg-[#f9f4f6] border border-[#733857]/20 px-3 py-2 flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 text-[#733857] flex-shrink-0" />
                  <p className="text-[11px] sm:text-xs leading-snug text-[#412434]">
                    We currently serve only selected delivery areas and partner hostel students.
                  </p>
                </div>

                {/* Small helper: how to change location/hostel */}
                {!isEditMode && (
                  <div className="mt-2 flex items-start text-[12px] sm:text-xs text-[#5a2943]">
                    <Edit2 size={14} className="mt-0.5 text-[#733857] flex-shrink-0" />
                    <p className="ml-2 leading-snug">
                      To change your delivery location or hostel, click the <span className="font-semibold">Edit</span> button above.
                    </p>
                  </div>
                )}

                {/* Edit Mode Buttons */}
                {isEditMode && (
                  <div className="flex gap-3 sm:gap-4 pt-3 sm:pt-4 items-center justify-center">
                    <CubeButton
                      onClick={handleCancelEdit}
                      disabled={saving}
                      variant="cancel-variant"
                      style={{ 
                        width: '108px',
                        height: '38px'
                      }}
                    >
                      Cancel
                    </CubeButton>
                    <CubeButton
                      onClick={handleSaveChanges}
                      disabled={saving}
                      variant="save-variant"
                      style={{ 
                        width: '128px',
                        height: '38px'
                      }}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </CubeButton>
                  </div>
                )}
              </div>

              {/* Proceed Button (only when NOT editing) */}
              {!isEditMode && (
                <MaskButton
                  onClick={handleProceedToPayment}
                  disabled={saving}
                  maskType="nature"
                  className="mask-button--compact"
                  style={{
                    width: '100%'}}
                >
                  Continue to Payment
                </MaskButton>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
