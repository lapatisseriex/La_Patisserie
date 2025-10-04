import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, DollarSign, TrendingUp, Wallet, ShoppingCart } from 'lucide-react';

/**
 * PricingCalculator Component
 * 
 * Auto-calculator that determines Safe Selling Price and shows detailed pricing logic
 * Formula: Safe Selling Price = (Cost Price + Profit Wanted + Free Cash Expected) × 2
 */
const PricingCalculator = ({ 
  initialCostPrice = 0, 
  initialProfitWanted = 0, 
  initialFreeCashExpected = 0,
  onCalculationUpdate,
  isEditable = true,
  showTitle = true,
  compact = false
}) => {
  const [costPrice, setCostPrice] = useState(initialCostPrice || 0);
  const [profitWanted, setProfitWanted] = useState(initialProfitWanted || 0);
  const [freeCashExpected, setFreeCashExpected] = useState(initialFreeCashExpected || 0);

  // Pricing calculations
  const calculations = useMemo(() => {
    const safeSellingPrice = (costPrice + profitWanted + freeCashExpected) * 2;
    const mrp = safeSellingPrice;
    const defaultDiscount = 50; // 50% default discount
    const afterDiscount = mrp * (1 - defaultDiscount / 100);
    const afterFreeCash = afterDiscount - freeCashExpected;
    const finalCustomerPrice = Math.max(0, afterFreeCash);
    const sellerReturn = costPrice + profitWanted;

    return {
      safeSellingPrice,
      mrp,
      defaultDiscount,
      afterDiscount,
      afterFreeCash,
      finalCustomerPrice,
      sellerReturn,
      costPrice,
      profitWanted,
      freeCashExpected
    };
  }, [costPrice, profitWanted, freeCashExpected]);

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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ResultDisplay
            label="Final Customer Price"
            value={calculations.finalCustomerPrice}
            isCustomer={true}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Calculation Formula Display */}
        <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
          <h4 className="font-semibold text-gray-800 mb-2">Calculation Formula:</h4>
          <div className="font-mono text-sm text-gray-700">
            Safe Selling Price = ({costPrice} + {profitWanted} + {freeCashExpected}) × 2 = ₹{calculations.safeSellingPrice.toFixed(2)}
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
              label="MRP (Customer sees)"
              value={calculations.mrp}
            />
            <ResultDisplay
              label={`After Discount (${calculations.defaultDiscount}%)`}
              value={calculations.afterDiscount}
            />
            <ResultDisplay
              label="After Applying Free Cash"
              value={calculations.afterFreeCash}
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
            <p>• MRP = Safe Selling Price (what customers see initially)</p>
            <p>• After 50% Discount = Customer pays half of MRP</p>
            <p>• After Free Cash = Subtract the free cash amount</p>
            <p>• You still get your cost price + desired profit</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCalculator;