import React, { useState, useEffect } from 'react';
import { FaBox, FaEdit, FaSave, FaTimes, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiService from '../../../services/apiService';

/**
 * Quick Stock Update Component for Product Forms
 */
const QuickStockUpdate = ({ productId, variants, onStockUpdate }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [stockValues, setStockValues] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize stock values when variants change
  useEffect(() => {
    if (variants && variants.length > 0) {
      const initialValues = {};
      variants.forEach((variant, index) => {
        initialValues[index] = {
          stock: variant.stock || 0,
          isStockActive: variant.isStockActive || false
        };
      });
      setStockValues(initialValues);
    }
  }, [variants]);

  // Handle individual stock update
  const handleStockUpdate = async (variantIndex) => {
    if (!productId) {
      toast.error('Product ID is required for stock update');
      return;
    }

    const stockData = stockValues[variantIndex];
    if (!stockData) return;

    try {
      setLoading(true);
      const { data } = await apiService.put(`/stock/${productId}/variant/${variantIndex}`, {
        stock: parseInt(stockData.stock),
        isStockActive: Boolean(stockData.isStockActive)
      });
      toast.success('Stock updated successfully');
      // Call parent callback if provided
      if (onStockUpdate) {
        onStockUpdate(variantIndex, data);
      }
      setEditingIndex(null);
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  // Handle stock value change
  const handleStockChange = (variantIndex, field, value) => {
    setStockValues(prev => ({
      ...prev,
      [variantIndex]: {
        ...prev[variantIndex],
        [field]: value
      }
    }));
  };

  // Cancel editing
  const handleCancelEdit = (variantIndex) => {
    if (variants && variants[variantIndex]) {
      setStockValues(prev => ({
        ...prev,
        [variantIndex]: {
          stock: variants[variantIndex].stock || 0,
          isStockActive: variants[variantIndex].isStockActive || false
        }
      }));
    }
    setEditingIndex(null);
  };

  if (!variants || variants.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center text-gray-500">
          <FaBox className="mr-2" />
          <span>No variants available for stock management</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center">
          <FaBox className="text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Stock Management</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Quick update stock levels for product variants
        </p>
      </div>
      
      <div className="p-4">
        <div className="space-y-3">
          {variants.map((variant, index) => {
            const isEditing = editingIndex === index;
            const stockData = stockValues[index] || { stock: 0, isStockActive: false };
            
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {variant.name || `Variant ${index + 1}`}
                    </h4>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {variant.quantity} {variant.measuringUnit || 'unit'} • ₹{variant.price}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {isEditing ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <label className="text-xs text-gray-600">Stock:</label>
                        <input
                          type="number"
                          value={stockData.stock}
                          onChange={(e) => handleStockChange(index, 'stock', parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          disabled={loading}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleStockChange(index, 'isStockActive', !stockData.isStockActive)}
                          className={`flex items-center text-sm ${
                            stockData.isStockActive 
                              ? 'text-green-600 hover:text-green-700' 
                              : 'text-gray-400 hover:text-gray-500'
                          }`}
                          disabled={loading}
                        >
                          {stockData.isStockActive ? (
                            <FaToggleOn size={16} />
                          ) : (
                            <FaToggleOff size={16} />
                          )}
                        </button>
                        <span className="text-xs text-gray-600">
                          {stockData.isStockActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleStockUpdate(index)}
                          disabled={loading}
                          className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
                        >
                          <FaSave size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelEdit(index)}
                          disabled={loading}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          variant.isStockActive 
                            ? (variant.stock > 5 ? 'text-green-600' : variant.stock > 0 ? 'text-yellow-600' : 'text-red-600')
                            : 'text-gray-400'
                        }`}>
                          {variant.isStockActive ? `${variant.stock} units` : 'Disabled'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {variant.isStockActive && (
                            variant.stock === 0 ? 'Out of stock' :
                            variant.stock <= 5 ? 'Low stock' : 'In stock'
                          )}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setEditingIndex(index)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      >
                        <FaEdit size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-700">
            <strong>Stock Tracking:</strong> Stock is only decremented when orders are confirmed/paid. 
            Cart additions do not affect stock levels.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickStockUpdate;