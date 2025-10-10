import React, { useState, useEffect } from 'react';
import { 
  FaBox, 
  FaExclamationTriangle, 
  FaBan, 
  FaCheck, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaDownload,
  FaSync,
  FaFilter,
  FaSearch,
  FaChartBar,
  FaCog
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSidebar } from '../AdminDashboardLayout';
import apiService from '../../../services/apiService';

/**
 * Admin Inventory Management Component
 */
const AdminInventory = () => {
  const { closeSidebarIfOpen, isSidebarOpen, isMobile } = useSidebar();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingItems, setEditingItems] = useState(new Set());
  const [stockUpdates, setStockUpdates] = useState({});
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  // Load inventory data
  const loadInventoryData = async () => {
    try {
      setLoading(true);
      
      // Use apiService for consistent API calls like other admin components
      const [inventoryResponse, lowStockResponse] = await Promise.all([
        apiService.get('/stock-validation/inventory/overview'),
        apiService.get('/stock-validation/inventory/low-stock', { params: { threshold: lowStockThreshold } })
      ]);

      // Handle inventory response
      if (inventoryResponse.data) {
        setInventoryData(inventoryResponse.data);
      }

      // Handle low stock response  
      if (lowStockResponse.data && lowStockResponse.data.items) {
        setLowStockItems(lowStockResponse.data.items);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when threshold changes
  useEffect(() => {
    loadInventoryData();
  }, [lowStockThreshold]);

  // Handle individual stock update
  const handleStockUpdate = async (productId, variantIndex, newStock, isStockActive) => {
    try {
      await apiService.put(`/stock/${productId}/variant/${variantIndex}`, { 
        stock: parseInt(newStock), 
        isStockActive: isStockActive 
      });

      toast.success('Stock updated successfully');
      loadInventoryData(); // Refresh data
      setEditingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${productId}-${variantIndex}`);
        return newSet;
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  // Handle bulk stock update
  const handleBulkUpdate = async () => {
    const updates = Object.entries(stockUpdates).map(([key, value]) => {
      const [productId, variantIndex] = key.split('-');
      return {
        productId,
        variantIndex: parseInt(variantIndex),
        stock: parseInt(value.stock),
        isStockActive: value.isStockActive
      };
    });

    if (updates.length === 0) {
      toast.warning('No updates to apply');
      return;
    }

    try {
      const response = await apiService.put('/stock-validation/inventory/bulk-update', { updates });
      
      toast.success(`Updated ${response.data.results.length} items successfully`);
      if (response.data.errors && response.data.errors.length > 0) {
        toast.warning(`${response.data.errors.length} items failed to update`);
      }
      loadInventoryData();
      setStockUpdates({});
      setEditingItems(new Set());
      setShowBulkUpdate(false);
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast.error('Failed to bulk update stock');
    }
  };

  // Filter products based on search and filters
  const filteredProducts = inventoryData?.products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product._id.includes(searchTerm);
    const matchesCategory = !selectedCategory || product.category?._id === selectedCategory;
    
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = product.variants.some(variant => {
        if (statusFilter === 'low_stock') return variant.isStockActive && variant.stock <= lowStockThreshold && variant.stock > 0;
        if (statusFilter === 'out_of_stock') return variant.isStockActive && variant.stock === 0;
        if (statusFilter === 'in_stock') return variant.isStockActive && variant.stock > lowStockThreshold;
        if (statusFilter === 'disabled') return !variant.isStockActive;
        return true;
      });
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  // Get unique categories by _id to avoid duplicate keys in <option>
  const categories = (
    inventoryData?.products?.
      map(p => p.category).
      filter(Boolean).
      reduce((acc, cat) => {
        if (!acc.some(c => (c?._id || c?.id) === (cat?._id || cat?.id))) {
          acc.push(cat);
        }
        return acc;
      }, [])
  ) || [];

  // Handle click outside to close sidebar
  const handleContentClick = () => {
    if (isMobile && isSidebarOpen) {
      closeSidebarIfOpen();
    }
  };

  // Generate and download inventory report
  const downloadReport = async () => {
    try {
      const response = await apiService.get('/stock-validation/inventory/report');
      
      const blob = new Blob([JSON.stringify(response.data.report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen bg-gray-50 transition-all duration-300 ${
        isSidebarOpen && !isMobile ? 'ml-64' : ''
      }`}
      onClick={handleContentClick}
    >
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="mt-2 text-gray-600">Monitor and manage product stock levels</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
              <button
                onClick={loadInventoryData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaSync /> Refresh
              </button>
              <button
                onClick={downloadReport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FaDownload /> Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Overview Cards */}
        {inventoryData?.overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <FaBox className="text-blue-500 text-2xl mr-3" />
                <div>
                  <p className="text-gray-600 text-sm">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{inventoryData.overview.totalProducts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <FaCheck className="text-green-500 text-2xl mr-3" />
                <div>
                  <p className="text-gray-600 text-sm">In Stock</p>
                  <p className="text-2xl font-bold text-green-600">{inventoryData.overview.inStockProducts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-yellow-500 text-2xl mr-3" />
                <div>
                  <p className="text-gray-600 text-sm">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">{inventoryData.overview.lowStockProducts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <FaBan className="text-red-500 text-2xl mr-3" />
                <div>
                  <p className="text-gray-600 text-sm">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{inventoryData.overview.outOfStockProducts}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products..."
                  className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Low Stock Threshold</label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 5)}
                min="0"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Bulk Update Panel */}
        {showBulkUpdate && Object.keys(stockUpdates).length > 0 && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-orange-800">Bulk Update Mode</h3>
                <p className="text-sm text-orange-600">{Object.keys(stockUpdates).length} items ready for update</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkUpdate}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  <FaSave /> Apply All Updates
                </button>
                <button
                  onClick={() => {
                    setShowBulkUpdate(false);
                    setStockUpdates({});
                    setEditingItems(new Set());
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Products Inventory</h2>
            <button
              onClick={() => setShowBulkUpdate(!showBulkUpdate)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <FaCog /> Bulk Edit
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">ID: {product._id.slice(-6)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {product.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {product.variants.map((variant, index) => {
                          const itemKey = `${product._id}-${index}`;
                          const isEditing = editingItems.has(itemKey);
                          const stockUpdate = stockUpdates[itemKey];
                          
                          return (
                            <div key={index} className="flex items-center gap-2 p-2 border rounded">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium">{variant.name}</div>
                                <div className="text-xs text-gray-500">
                                  {variant.quantity} {variant.measuringUnit} • ₹{variant.price}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <input
                                      type="number"
                                      value={stockUpdate?.stock ?? variant.stock}
                                      onChange={(e) => {
                                        const newStock = e.target.value;
                                        setStockUpdates(prev => ({
                                          ...prev,
                                          [itemKey]: {
                                            ...prev[itemKey],
                                            stock: newStock,
                                            isStockActive: stockUpdate?.isStockActive ?? variant.isStockActive
                                          }
                                        }));
                                      }}
                                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                                      min="0"
                                    />
                                    <label className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={stockUpdate?.isStockActive ?? variant.isStockActive}
                                        onChange={(e) => {
                                          const isActive = e.target.checked;
                                          setStockUpdates(prev => ({
                                            ...prev,
                                            [itemKey]: {
                                              ...prev[itemKey],
                                              stock: stockUpdate?.stock ?? variant.stock,
                                              isStockActive: isActive
                                            }
                                          }));
                                        }}
                                        className="mr-1"
                                      />
                                      <span className="text-xs">Active</span>
                                    </label>
                                  </>
                                ) : (
                                  <>
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                                      variant.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                                      variant.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                                      variant.status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {variant.stock} {variant.isStockActive ? 'units' : '(disabled)'}
                                    </span>
                                  </>
                                )}
                              </div>
                              
                              <div className="flex gap-1">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        if (showBulkUpdate) {
                                          // In bulk mode, just mark as ready
                                          setEditingItems(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(itemKey);
                                            return newSet;
                                          });
                                        } else {
                                          // Individual update
                                          const update = stockUpdates[itemKey];
                                          if (update) {
                                            handleStockUpdate(product._id, index, update.stock, update.isStockActive);
                                          }
                                        }
                                      }}
                                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                                    >
                                      <FaSave size={12} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingItems(prev => {
                                          const newSet = new Set(prev);
                                          newSet.delete(itemKey);
                                          return newSet;
                                        });
                                        setStockUpdates(prev => {
                                          const newUpdates = { ...prev };
                                          delete newUpdates[itemKey];
                                          return newUpdates;
                                        });
                                      }}
                                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                                    >
                                      <FaTimes size={12} />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingItems(prev => new Set([...prev, itemKey]));
                                      setStockUpdates(prev => ({
                                        ...prev,
                                        [itemKey]: {
                                          stock: variant.stock,
                                          isStockActive: variant.isStockActive
                                        }
                                      }));
                                    }}
                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                  >
                                    <FaEdit size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link
                        to={`/admin/products?edit=${product._id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <FaBox className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <FaExclamationTriangle className="text-yellow-500 text-xl mr-3" />
              <h3 className="text-lg font-medium text-yellow-800">Low Stock Alert</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.slice(0, 6).map((item, index) => (
                <div key={index} className="bg-white p-4 rounded border">
                  <h4 className="font-medium text-gray-900">{item.productName}</h4>
                  <p className="text-sm text-gray-600">{item.variantName}</p>
                  <p className="text-sm">
                    <span className={`font-medium ${item.status === 'out_of_stock' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {item.currentStock} units remaining
                    </span>
                  </p>
                </div>
              ))}
            </div>
            {lowStockItems.length > 6 && (
              <p className="mt-4 text-sm text-yellow-700">
                And {lowStockItems.length - 6} more items need attention...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInventory;