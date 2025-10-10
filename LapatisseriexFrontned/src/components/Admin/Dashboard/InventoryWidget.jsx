import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBox, 
  FaExclamationTriangle, 
  FaBan, 
  FaCheck, 
  FaArrowRight,
  FaSync 
} from 'react-icons/fa';
import apiService from '../../../services/apiService';

/**
 * Inventory Dashboard Widget - Shows inventory overview for admin dashboard
 */
const InventoryWidget = () => {
  const [inventoryData, setInventoryData] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch inventory overview
  const fetchInventoryOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use apiService for consistent API calls like other admin components
      const [inventoryResponse, lowStockResponse] = await Promise.all([
        apiService.get('/stock-validation/inventory/overview'),
        apiService.get('/stock-validation/inventory/low-stock', { params: { threshold: 5 } })
      ]);

      // Set inventory data
      if (inventoryResponse.data) {
        setInventoryData(inventoryResponse.data);
      }

      // Set low stock data 
      if (lowStockResponse.data && lowStockResponse.data.items) {
        setLowStockItems(lowStockResponse.data.items);
      }
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add a small delay to ensure Firebase auth is ready
    const timer = setTimeout(() => {
      fetchInventoryOverview();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Inventory Overview</h3>
          <button
            onClick={fetchInventoryOverview}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <FaSync />
          </button>
        </div>
        <div className="text-center py-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchInventoryOverview}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const overview = inventoryData?.overview;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Inventory Overview</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchInventoryOverview}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaSync size={14} />
          </button>
          <Link
            to="/admin/inventory"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
          >
            View All <FaArrowRight className="ml-1" size={12} />
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2">
                <FaBox className="text-blue-600" size={14} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{overview.totalProducts}</div>
              <div className="text-xs text-gray-600">Total Products</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-2">
                <FaCheck className="text-green-600" size={14} />
              </div>
              <div className="text-2xl font-bold text-green-600">{overview.inStockProducts}</div>
              <div className="text-xs text-gray-600">In Stock</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full mx-auto mb-2">
                <FaExclamationTriangle className="text-yellow-600" size={14} />
              </div>
              <div className="text-2xl font-bold text-yellow-600">{overview.lowStockProducts}</div>
              <div className="text-xs text-gray-600">Low Stock</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full mx-auto mb-2">
                <FaBan className="text-red-600" size={14} />
              </div>
              <div className="text-2xl font-bold text-red-600">{overview.outOfStockProducts}</div>
              <div className="text-xs text-gray-600">Out of Stock</div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <FaExclamationTriangle className="text-yellow-500 mr-2" size={14} />
                Items Need Attention ({lowStockItems.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {lowStockItems.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">{item.productName}</div>
                      <div className="text-gray-600 text-xs">{item.variantName}</div>
                    </div>
                    <div className="text-right ml-2">
                      <span className={`font-medium ${
                        item.status === 'out_of_stock' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {item.currentStock} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {lowStockItems.length > 3 && (
                <div className="mt-2 text-center">
                  <Link
                    to="/admin/inventory?filter=low_stock"
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View all {lowStockItems.length} items
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* No alerts message */}
          {lowStockItems.length === 0 && overview.totalProducts > 0 && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                <FaCheck className="text-green-600" />
              </div>
              <p className="text-sm text-gray-600">All products are well stocked!</p>
            </div>
          )}

          {/* No products message */}
          {overview.totalProducts === 0 && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-2">
                <FaBox className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">No products found in inventory</p>
              <Link
                to="/admin/products"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Add your first product
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryWidget;