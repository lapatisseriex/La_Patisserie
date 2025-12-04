/**
 * Centralized pricing calculation utility
 * Ensures consistent pricing logic across all components
 * 
 * Admin Pricing Logic:
 * - baseSelling = costPrice + profitWanted (what seller gets)
 * - finalPrice = baseSelling + freeCashExpected (what customer pays before discount)
 * - MRP = finalPrice + discount_amount (for flat) OR finalPrice / (1 - discount%/100) (for percentage)
 * - customerActualPrice = finalPrice (after all calculations)
 */

/**
 * Calculate pricing for a product variant using correct admin logic
 * @param {Object} variant - Product variant object
 * @returns {Object} Pricing details { finalPrice, mrp, discountPercentage, discountAmount }
 */
export const calculatePricing = (variant) => {
  if (!variant) {
    return { finalPrice: 0, mrp: 0, discountPercentage: 0, discountAmount: 0 };
  }
  
  const basePrice = parseFloat(variant.costPrice) || 0;
  const profitNeeded = parseFloat(variant.profitWanted) || 0;
  const freeCash = parseFloat(variant.freeCashExpected) || 0;
  const manualPrice = parseFloat(variant.price) || 0;
  
  // Validate input parameters to prevent calculation errors
  if (basePrice < 0 || profitNeeded < 0 || freeCash < 0) {
    console.warn('Negative pricing parameters detected:', { basePrice, profitNeeded, freeCash });
    return { finalPrice: 0, mrp: 0, discountPercentage: 0, discountAmount: 0 };
  }
  
  let finalPrice;
  let baseSelling;
  
  // If all pricing calculator fields are 0, use manual price
  if (basePrice === 0 && profitNeeded === 0 && freeCash === 0 && manualPrice > 0) {
    // Manual pricing mode - use the price field directly as final price
    finalPrice = manualPrice;
    baseSelling = manualPrice; // In manual mode, no separate calculation for seller return
  } else {
    // Calculate base selling price (cost + profit) - this is what seller gets
    baseSelling = basePrice + profitNeeded;
    
    // Calculate final price (base selling + free cash) - this is what customer pays without discount
    finalPrice = baseSelling + freeCash;
  }
  
  // Debug logging removed (was noisy in console)
  
  // Ensure finalPrice is valid - this is the customer's base price before any discounts
  if (isNaN(finalPrice) || finalPrice < 0) {
    console.warn('Invalid final price calculated for variant:', variant);
    return { finalPrice: 0, mrp: 0, discountPercentage: 0, discountAmount: 0 };
  }
  
  // Handle discount calculation to determine MRP
  let finalDiscountPercentage = 0;
  let mrp = finalPrice; // Start with final price as base MRP
  
  if (variant.discount) {
    if (variant.discount.type === 'percentage') {
      finalDiscountPercentage = parseFloat(variant.discount.value) || 0;
      
      // Validate percentage discount bounds
      if (finalDiscountPercentage < 0) {
        console.warn('Negative discount percentage, setting to 0:', finalDiscountPercentage);
        finalDiscountPercentage = 0;
      } else if (finalDiscountPercentage >= 100) {
        console.warn('Discount percentage >= 100%, capping at 99.99%:', finalDiscountPercentage);
        finalDiscountPercentage = 99.99; // Cap at 99.99% to prevent division by zero
      }
      
      // MRP calculation: MRP = finalPrice / (1 - discount_percent/100)
      // This ensures: finalPrice = MRP * (1 - discount_percent/100)
      if (finalDiscountPercentage > 0) {
        const divisor = 1 - finalDiscountPercentage / 100;
        // Additional safety check to prevent division by zero or very small numbers
        if (divisor <= 0.0001) {
          console.warn('Division by zero/very small number prevented for discount:', finalDiscountPercentage);
          finalDiscountPercentage = 99.99;
          mrp = finalPrice / (1 - 99.99 / 100);
        } else {
          mrp = finalPrice / divisor;
        }
      }
    } else if (variant.discount.type === 'flat') {
      const discountFlat = parseFloat(variant.discount.value) || 0;
      
      // Validate flat discount
      if (discountFlat < 0) {
        console.warn('Negative flat discount, setting to 0:', discountFlat);
      } else {
        // MRP = finalPrice + flat_discount
        mrp = finalPrice + Math.max(0, discountFlat);
        finalDiscountPercentage = mrp > 0 ? Math.round((discountFlat / mrp) * 100) : 0;
      }
    }
  }
  
  // Calculate the actual customer price after discount
  const customerPrice = finalPrice; // Customer pays the final price (what they actually pay after applying discount calculation to MRP)
  const discountAmount = mrp - finalPrice;
  
  // Comprehensive validation: Ensure all values are valid numbers
  if (isNaN(mrp) || isNaN(finalDiscountPercentage) || isNaN(discountAmount) || isNaN(customerPrice)) {
    console.warn('NaN detected in pricing calculation for variant:', variant, {
      mrp, finalDiscountPercentage, discountAmount, customerPrice, finalPrice, baseSelling, freeCash
    });
    return { 
      finalPrice: Math.round(finalPrice), 
      mrp: Math.round(finalPrice), 
      discountPercentage: 0, 
      discountAmount: 0 
    };
  }
  
  // Validation: MRP should not be less than final price
  if (mrp < finalPrice) {
    console.warn('Pricing calculation error: MRP cannot be less than final price', {
      variant: variant.id || 'unknown',
      mrp,
      finalPrice,
      discountAmount
    });
    // Reset to no discount scenario
    mrp = finalPrice;
    finalDiscountPercentage = 0;
  }
  
  const result = {
    finalPrice: Math.round(Math.max(0, customerPrice)),
    mrp: Math.round(Math.max(0, mrp)),
    discountPercentage: Math.round(Math.max(0, finalDiscountPercentage)),
    discountAmount: Math.round(Math.max(0, discountAmount))
  };
  
  // Debug logging removed (was noisy in console)
  
  return result;
};

/**
 * Calculate cart totals using consistent pricing logic
 * @param {Array} cartItems - Array of cart items
 * @returns {Object} Cart totals { finalTotal, originalTotal, totalSavings, averageDiscountPercentage }
 * 
 * Note: averageDiscountPercentage is calculated as the arithmetic mean of individual item discount percentages
 */
export const calculateCartTotals = (cartItems) => {
  try {
    if (!Array.isArray(cartItems)) {
      console.warn('Cart - cartItems is not an array:', cartItems);
      return { finalTotal: 0, originalTotal: 0, totalSavings: 0, averageDiscountPercentage: 0 };
    }
    
    let finalTotal = 0;
    let originalTotal = 0;
    let totalDiscountAmount = 0;
    let validItemsCount = 0; // Count items with valid pricing data
    let totalDiscountPercentage = 0; // Sum of individual discount percentages
    
    cartItems.forEach(item => {
      // Normalize the cart item structure first
      const normalizedItem = normalizeCartItem(item);
      if (!normalizedItem || typeof normalizedItem.quantity !== 'number') {
        console.warn('Cart - Invalid item after normalization:', item);
        return;
      }
      
      // Skip free products from total calculation
      if (normalizedItem.isFreeProduct === true) {
        console.log('Cart - Skipping free product from total:', normalizedItem);
        return;
      }
      
      // Get variant data from normalized productDetails
      const prod = normalizedItem.productDetails;
      if (!prod) {
        console.warn('Cart - No product details for normalized item:', normalizedItem);
        return;
      }
      
      const variant = prod?.variants?.[normalizedItem.variantIndex];
      if (!variant) {
        console.warn('Cart - No variant found for normalized item:', normalizedItem);
        return;
      }
      
      // Use centralized pricing calculation
      const pricing = calculatePricing(variant);
      const itemFinalTotal = pricing.finalPrice * normalizedItem.quantity;
      const itemOriginalTotal = pricing.mrp * normalizedItem.quantity;
      const itemDiscountAmount = pricing.discountAmount * normalizedItem.quantity;
      
      // Ensure calculations are valid numbers
      if (isNaN(itemFinalTotal) || isNaN(itemOriginalTotal) || isNaN(itemDiscountAmount)) {
        console.warn('Cart - NaN detected in item calculations:', { item: normalizedItem, pricing, itemFinalTotal, itemOriginalTotal, itemDiscountAmount });
        return;
      }
      
      finalTotal += itemFinalTotal;
      originalTotal += itemOriginalTotal;
      totalDiscountAmount += itemDiscountAmount;
      
      // Add individual item discount percentage to the total for averaging
      totalDiscountPercentage += pricing.discountPercentage;
      validItemsCount++;
    });
    
    const totalSavings = originalTotal - finalTotal;
    
    // Calculate average discount percentage as the average of individual item discount percentages
    const averageDiscountPercentage = validItemsCount > 0 ? Math.round(totalDiscountPercentage / validItemsCount) : 0;
    
    // Ensure all values are valid numbers
    const safeFinalTotal = isNaN(finalTotal) ? 0 : finalTotal;
    const safeOriginalTotal = isNaN(originalTotal) ? 0 : originalTotal;
    const safeTotalSavings = isNaN(totalSavings) ? 0 : totalSavings;
    const safeAverageDiscountPercentage = isNaN(averageDiscountPercentage) ? 0 : averageDiscountPercentage;

    return { 
      finalTotal: safeFinalTotal, 
      originalTotal: safeOriginalTotal, 
      totalSavings: safeTotalSavings, 
      averageDiscountPercentage: safeAverageDiscountPercentage 
    };
  } catch (error) {
    console.error('Error calculating cart totals:', error);
    return { finalTotal: 0, originalTotal: 0, totalSavings: 0, averageDiscountPercentage: 0 };
  }
};

/**
 * Consistent currency formatting utility
 * @param {number} amount - Amount to format
 * @param {boolean} showDecimals - Whether to show decimal places (default: false)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showDecimals = false) => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return showDecimals ? '₹0.00' : '₹0';
  }
  
  const numAmount = parseFloat(amount);
  if (showDecimals) {
    return `₹${numAmount.toFixed(2)}`;
  } else {
    return `₹${Math.round(numAmount)}`;
  }
};

/**
 * Normalize cart item data structure to handle inconsistencies
 * @param {Object} item - Cart item with potentially inconsistent structure
 * @returns {Object} Normalized cart item
 */
export const normalizeCartItem = (item) => {
  if (!item) return null;
  
  // Handle different variant index locations
  let variantIndex = 0;
  if (Number.isInteger(item.variantIndex)) {
    variantIndex = item.variantIndex;
  } else if (Number.isInteger(item.productDetails?.variantIndex)) {
    variantIndex = item.productDetails.variantIndex;
  }
  
  // Handle different product details locations
  const productDetails = item.productDetails || item.product || item;
  
  return {
    ...item,
    variantIndex,
    productDetails,
    // Ensure quantity is a valid number
    quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity) || 1,
    // Standardize product ID
    productId: item.productId || item._id || productDetails._id
  };
};

/**
 * Check if a variant has admin pricing data (costPrice, profitWanted, freeCashExpected)
 * @param {Object} variant - Product variant object
 * @returns {boolean} True if variant has admin pricing data
 */
export const hasAdminPricing = (variant) => {
  return !!(variant?.costPrice || variant?.profitWanted || variant?.freeCashExpected);
};