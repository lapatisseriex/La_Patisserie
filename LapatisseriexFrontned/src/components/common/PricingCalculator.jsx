import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, DollarSign, TrendingUp, Wallet, ShoppingCart } from 'lucide-react';

/**
 * PricingCalculator Component
 * 
 * Auto-calculator that determines MRP based on desired final price and discount
 * Formula: final_price = baseprice + profit + freecash
 *          mrp = ((discount_percentage + 100) / 100) * final_price
 */
const PricingCalculator = ({ 
  initialCostPrice = 0, 
  initialProfitWanted = 0, 
  initialFreeCashExpected = 0,
  initialDiscountPercentage = 50,
  initialDiscountType = null,
  initialDiscountValue = 0,
  onCalculationUpdate,
  isEditable = true,
  showTitle = true,
  compact = false
}) => {
  const [costPrice, setCostPrice] = useState(initialCostPrice || 0);
  const [profitWanted, setProfitWanted] = useState(initialProfitWanted || 0);
  const [freeCashExpected, setFreeCashExpected] = useState(initialFreeCashExpected || 0);
  const [discountPercentage, setDiscountPercentage] = useState(initialDiscountPercentage || 50);
  const [discountType, setDiscountType] = useState(initialDiscountType || null);
  const [discountValue, setDiscountValue] = useState(initialDiscountValue || 0);

  // Pricing calculations
  const calculations = useMemo(() => {
    // Step 1: Calculate base selling price (what seller gets)
    const baseSelling = costPrice + profitWanted;
    
    // Step 2: Calculate final price (what customer pays before discount)
    const finalPrice = baseSelling + freeCashExpected;
    
    // Step 3: Calculate MRP based on discount type
    let mrp = finalPrice;
    let effectiveDiscountPercentage = discountPercentage;
    
    if (discountType === 'flat') {
      // For flat discount: MRP = final_price + flat_discount_amount
      mrp = finalPrice + discountValue;
      // Calculate effective discount percentage for display
      effectiveDiscountPercentage = mrp > 0 ? Math.round((discountValue / mrp) * 100) : 0;
    } else if (discountType === 'percentage') {
      // For percentage discount: MRP = final_price / (1 - discount_percentage/100)
      const safeDiscountPercentage = Math.min(Math.max(0, discountPercentage), 99);
      if (safeDiscountPercentage > 0) {
        mrp = finalPrice / (1 - safeDiscountPercentage / 100);
      }
      effectiveDiscountPercentage = safeDiscountPercentage;
    }
    
    // Step 4: Customer pays the final price (already includes free cash benefit)
    const finalCustomerPrice = finalPrice;
    
    // Step 5: Seller return (what admin actually gets)
    const sellerReturn = baseSelling; // What seller gets (cost + profit)

    return {
      baseSelling,
      finalPrice,
      mrp,
      discountPercentage: effectiveDiscountPercentage,
      finalCustomerPrice,
      sellerReturn,
      costPrice,
      profitWanted,
      freeCashExpected,
      discountType,
      discountValue,
      // Legacy field for backward compatibility
      safeSellingPrice: mrp,
      defaultDiscount: effectiveDiscountPercentage
    };
  }, [costPrice, profitWanted, freeCashExpected, discountPercentage, discountType, discountValue]);

  // Notify parent component of calculation updates
  useEffect(() => {
    if (onCalculationUpdate) {
      onCalculationUpdate(calculations);
    }
  }, [calculations, onCalculationUpdate]);

  // Remove the problematic useEffect that interferes with user input

  const InputField = ({ label, value, onChange, icon: Icon, disabled = false }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? 0 : Number(val));
          }}
          disabled={disabled || !isEditable}
          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          placeholder="0"
          min="0"
          step="0.01"
        />
      </div>
    </div>
  );

  const ResultDisplay = ({ label, value, isHighlight = false, isCustomer = false, isSeller = false }) => (
    <div className={`p-3 rounded-lg border ${
      isHighlight 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
        : isCustomer
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
        : isSeller
        ? 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200'
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex justify-between items-center">
        <span className={`text-sm font-medium ${
          isHighlight ? 'text-green-700' : isCustomer ? 'text-blue-700' : isSeller ? 'text-purple-700' : 'text-gray-700'
        }`}>
          {label}
        </span>
        <span className={`text-lg font-bold ${
          isHighlight ? 'text-green-800' : isCustomer ? 'text-blue-800' : isSeller ? 'text-purple-800' : 'text-gray-800'
        }`}>
          ₹{value.toFixed(2)}
        </span>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Cost Price"
            value={costPrice}
            onChange={setCostPrice}
            icon={DollarSign}
          />
          <InputField
            label="Profit Wanted"
            value={profitWanted}
            onChange={setProfitWanted}
            icon={TrendingUp}
          />
          <InputField
            label="Free Cash Expected"
            value={freeCashExpected}
            onChange={setFreeCashExpected}
            icon={Wallet}
          />
        </div>

        {/* Compact Discount Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Discount Type</label>
            <select
              value={discountType || ''}
              onChange={(e) => setDiscountType(e.target.value || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              disabled={!isEditable}
            >
              <option value="">No Discount</option>
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
          </div>

          {discountType && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Discount Value
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">
                    {discountType === 'percentage' ? '%' : '₹'}
                  </span>
                </div>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    if (discountType === 'percentage') {
                      setDiscountValue(Math.max(0, Math.min(100, value)));
                    } else {
                      setDiscountValue(Math.max(0, value));
                    }
                  }}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder={discountType === 'percentage' ? '50' : '100'}
                  min="0"
                  max={discountType === 'percentage' ? '100' : undefined}
                  step={discountType === 'percentage' ? '1' : '0.01'}
                  disabled={!isEditable}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ResultDisplay
            label="MRP (Original Price)"
            value={calculations.mrp}
            isCustomer={false}
          />
          <ResultDisplay
            label="Your Total Return"
            value={calculations.sellerReturn}
            isSeller={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {showTitle && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-white" />
            <h3 className="text-xl font-bold text-white">Pricing & Stock Calculator</h3>
          </div>
          <p className="text-blue-100 mt-1 text-sm">
            Auto-calculate safe selling price with detailed breakdown
          </p>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <InputField
            label="Cost Price"
            value={costPrice}
            onChange={setCostPrice}
            icon={DollarSign}
          />
          <InputField
            label="Profit Wanted"
            value={profitWanted}
            onChange={setProfitWanted}
            icon={TrendingUp}
          />
          <InputField
            label="Free Cash Expected"
            value={freeCashExpected}
            onChange={setFreeCashExpected}
            icon={Wallet}
          />
        </div>

        {/* Discount Configuration */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mb-6">
          <h4 className="font-semibold text-yellow-800 mb-4">Discount Configuration</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Discount Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Discount Type
              </label>
              <select
                value={discountType || ''}
                onChange={(e) => setDiscountType(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                disabled={!isEditable}
              >
                <option value="">No Discount</option>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>

            {/* Discount Value */}
            {discountType && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Discount Value
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">
                      {discountType === 'percentage' ? '%' : '₹'}
                    </span>
                  </div>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => {
                      const value = Number(e.target.value) || 0;
                      if (discountType === 'percentage') {
                        setDiscountValue(Math.max(0, Math.min(100, value)));
                      } else {
                        setDiscountValue(Math.max(0, value));
                      }
                    }}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder={discountType === 'percentage' ? '50' : '100'}
                    min="0"
                    max={discountType === 'percentage' ? '100' : undefined}
                    step={discountType === 'percentage' ? '1' : '0.01'}
                    disabled={!isEditable}
                  />
                </div>
              </div>
            )}

            {/* Discount Percentage (only for percentage type) */}
            {discountType === 'percentage' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Applied Discount %
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">%</span>
                  </div>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="50"
                    min="0"
                    max="100"
                    step="1"
                    disabled={!isEditable}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Calculation Formula Display */}
        <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
          <h4 className="font-semibold text-gray-800 mb-2">Calculation Formula:</h4>
          <div className="font-mono text-sm text-gray-700 space-y-1">
            <div>Base Selling = {costPrice} + {profitWanted} = ₹{calculations.baseSelling.toFixed(2)}</div>
            <div>Final Price = Base Selling + Free Cash = {calculations.baseSelling.toFixed(2)} + {freeCashExpected} = ₹{calculations.finalPrice.toFixed(2)}</div>
            {discountType === 'flat' ? (
              <div>MRP = Final Price + Flat Discount = {calculations.finalPrice.toFixed(2)} + {discountValue} = ₹{calculations.mrp.toFixed(2)}</div>
            ) : discountType === 'percentage' ? (
              <div>MRP = Final Price ÷ (1 - Discount%/100) = {calculations.finalPrice.toFixed(2)} ÷ (1 - {discountValue}/100) = ₹{calculations.mrp.toFixed(2)}</div>
            ) : (
              <div>MRP = Final Price (No discount) = ₹{calculations.mrp.toFixed(2)}</div>
            )}
            <div>Customer Pays = Final Price = ₹{calculations.finalCustomerPrice.toFixed(2)}</div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Pricing Breakdown
          </h4>
          
          <div className="grid grid-cols-1 gap-3">
            <ResultDisplay
              label="MRP (Original Price)"
              value={calculations.mrp}
            />
            <ResultDisplay
              label="Final Customer Price"
              value={calculations.finalCustomerPrice}
              isCustomer={true}
            />
            <ResultDisplay
              label="Your Total Return (Cost + Profit)"
              value={calculations.sellerReturn}
              isSeller={true}
            />
          </div>
        </div>

        {/* Example Section */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-800 mb-2">How it works:</h4>
          <div className="text-sm text-amber-700 space-y-1">
            <p>• MRP = What customers see as original price</p>
            <p>• Final Customer Price = What customer actually pays after all discounts</p>
            <p>• You still get your cost price + desired profit</p>
            {discountType && <p>• {discountType === 'flat' ? 'Flat discount amount is added to your desired final price to create MRP' : 'Percentage discount is calculated to determine MRP from your desired final price'}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCalculator;