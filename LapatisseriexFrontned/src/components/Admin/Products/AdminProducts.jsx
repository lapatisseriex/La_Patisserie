import React, { useState, useEffect } from 'react';
import { useProduct } from '../../../context/ProductContext/ProductContext';
import { useCategory } from '../../../context/CategoryContext/CategoryContext';
import ProductForm from './ProductForm';
import { Link } from 'react-router-dom';

/**
 * AdminProducts component for managing products in admin dashboard
 */
const AdminProducts = () => {
  const { products, loading, error, fetchProducts, deleteProduct } = useProduct();
  const { categories, fetchCategories } = useCategory();
  
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productList, setProductList] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [localLoading, setLocalLoading] = useState(false);

  // Load categories and products on component mount
  useEffect(() => {
    fetchCategories();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load products based on selected category
  const loadProducts = async (categoryId = '') => {
    try {
      // Don't set loading state again if already loading
      if (!localLoading) {
        setLocalLoading(true);
      }
      
      const filters = {};
      if (categoryId) {
        filters.category = categoryId;
      }
      
      // Include inactive products for admin view - use a string that backend can interpret
      filters.isActive = 'all';
      
      // Set limit higher for admin view
      filters.limit = 100;
      
      console.log('Loading products with filters:', filters);
      
      // Always fetch fresh data to avoid cache issues
      const result = await fetchProducts(filters);
      console.log('Fetched products - raw result:', result);
      
      if (!result) {
        console.error('No result returned from fetchProducts');
        setProductList([]);
        setProductCount(0);
      } else if (!result.products) {
        console.error('Invalid response format - no products array:', result);
        
        // If result is an array, it might be the products directly
        if (Array.isArray(result)) {
          console.log('Result is an array, using it directly as products list');
          setProductList(result);
          setProductCount(result.length);
        } else {
          setProductList([]);
          setProductCount(0);
        }
      } else {
        console.log(`Loaded ${result.products.length} products successfully`);
        setProductList(result.products || []);
        setProductCount(result.totalProducts || 0);
      }
    } catch (err) {
      console.error("Error loading products:", err);
      setDeleteError("Failed to load products. Please try again.");
      // Reset product list on error
      setProductList([]);
      setProductCount(0);
    } finally {
      setLocalLoading(false);
    }
  };

  // Handle category filter change
  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    await loadProducts(categoryId);
  };

  // Open form for creating a new product
  const handleAddNew = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  // Open form for editing an existing product
  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  // Handle product deletion
  const handleDelete = async (id) => {
    try {
      setIsDeleting(true);
      setDeleteId(id);
      setDeleteError(null);
      
      await deleteProduct(id);
      
      // Reload products after deletion
      await loadProducts(selectedCategory);
      
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // Cancel delete operation
  const handleCancelDelete = () => {
    setDeleteId(null);
    setDeleteError(null);
  };

  // Handle form close and refresh products
  const handleCloseForm = async () => {
    setShowForm(false);
    setEditingProduct(null);
    await loadProducts(selectedCategory);
  };

  // Format price with currency symbol
  const formatPrice = (price) => {
    // Check if price is null, undefined, or not a valid number
    if (price === null || price === undefined || isNaN(parseFloat(price))) {
      return '₹0.00';
    }
    return `₹${parseFloat(price).toLocaleString('en-IN')}`;
  };

  // Calculate discount percentage
  const calculateDiscountPercentage = (product) => {
    if (product.cancelOffer || !product.discount?.type) {
      return null;
    }
    
    if (product.discount.type === 'percentage') {
      return `${product.discount.value}% OFF`;
    }
    
    if (product.discount.type === 'flat' && typeof product.price === 'number' && product.price > 0) {
      const percentage = Math.round((product.discount.value / product.price) * 100);
      return `${percentage}% OFF`;
    }
    
    return null;
  };

  return (
    <div className="admin-products">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <div className="mt-2 flex space-x-4">
            <Link to="/admin/products" className="text-black font-medium border-b-2 border-white">
              Products
            </Link>
            <Link to="/admin/categories" className="text-black hover:text-black">
              Categories
            </Link>
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
        >
          Add New Product
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-2 md:mb-0 md:w-2/3">
            <label htmlFor="category-filter" className="block text-sm font-medium text-black mb-1">
              Filter by Category
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 border border-white rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 md:mt-0">
            <Link 
              to="/admin/categories"
              className="text-sm text-black hover:text-pink-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Manage Categories
            </Link>
          </div>
        </div>
      </div>

      {/* Product Form Modal - Fixed height with scrolling content */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[999] p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="bg-white rounded-lg w-full max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-[95vh] sm:h-[90vh] md:h-[85vh] shadow-2xl flex flex-col">

          {/* Header / padding wrapper */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 md:p-8 lg:p-10">
              <ProductForm
                product={editingProduct}
                onClose={handleCloseForm}
                preSelectedCategory={selectedCategory}
              />
            </div>
          </div>

        </div>
      </div>
      
      )}

      {/* Products Count */}
      <div className="mb-4 text-black">
        Showing {productList.length} of {productCount} products
      </div>

      {/* Products List */}
      {localLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-2">Loading products...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-white">
            <thead className="bg-white">
              <tr>
                <th className="py-3 px-4 text-left">Image</th>
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-left">Price</th>
                <th className="py-3 px-4 text-left">Egg/No Egg</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {productList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-4 px-4 text-center text-black">
                    {selectedCategory 
                      ? "No products found in this category. Add your first product." 
                      : "No products found. Add your first product."}
                  </td>
                </tr>
              ) : (
                productList.map((product) => (
                  <tr key={product._id} className="border-b border-white">
                    <td className="py-3 px-4">
                      {product.featuredImage ? (
                        <img
                          src={product.featuredImage}
                          alt={product.name}
                          className="h-12 w-12 object-cover rounded-md"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-white rounded-md flex items-center justify-center text-white">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-black">ID: {product.id || product._id.substring(0, 8)}</div>
                      {product.badge && (
                        <div className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          {product.badge}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {product.category?.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-left">
                      {Array.isArray(product.variants) && product.variants.length > 0 ? (
                        <select
                          className="border rounded px-2 py-1"
                          defaultValue={product.variants[0]._id} // default to first variant
                        >
                          {product.variants.map((variant) => (
                            <option key={variant._id} value={variant._id}>
                              {variant.name ? `${variant.name} - ` : ''}
                              {formatPrice(variant.price)}
                              {variant.quantity ? ` (${variant.quantity}${variant.measuringUnit || ''})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-medium">{formatPrice(product.price)}</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          product.hasEgg
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {product.hasEgg ? "🥚 With Egg" : "🌱 No Egg"}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          product.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-white text-black"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </button>
                        {deleteId === product._id ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-red-500">Confirm?</span>
                            <button
                              onClick={() => handleDelete(product._id)}
                              disabled={isDeleting}
                              className="text-red-600 hover:text-red-800"
                            >
                              {isDeleting ? "..." : "Yes"}
                            </button>
                            <button
                              onClick={handleCancelDelete}
                              className="text-black hover:text-black"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(product._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      {deleteError && deleteId === product._id && (
                        <p className="text-red-500 text-xs mt-1">{deleteError}</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
