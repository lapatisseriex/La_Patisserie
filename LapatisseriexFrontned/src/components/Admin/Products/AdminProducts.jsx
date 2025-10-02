import React, { useState, useEffect } from 'react';
import { useProduct } from '../../../context/ProductContext/ProductContext';
import { useCategory } from '../../../context/CategoryContext/CategoryContext';
import { useSidebar } from '../AdminDashboardLayout';
import ProductForm from './ProductForm';
import { Link } from 'react-router-dom';
import { FaPlus, FaFilter, FaEgg, FaLeaf } from 'react-icons/fa';

/**
 * AdminProducts component for managing products in admin dashboard
 */
const AdminProducts = () => {
  const { products, loading, error, fetchProducts, deleteProduct, getProduct } = useProduct();
  const { categories, fetchCategories } = useCategory();
  const { closeSidebarIfOpen, closeSidebarForModal, isSidebarOpen, isMobile } = useSidebar();
  
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // '' | 'active' | 'inactive'
  const [productList, setProductList] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [localLoading, setLocalLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Responsive hook
  const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(() => {
      if (typeof window === 'undefined') return false;
      return window.matchMedia(query).matches;
    });
    useEffect(() => {
      if (typeof window === 'undefined') return;
      const media = window.matchMedia(query);
      const listener = () => setMatches(media.matches);
      if (media.addEventListener) media.addEventListener('change', listener);
      else media.addListener(listener);
      return () => {
        if (media.removeEventListener) media.removeEventListener('change', listener);
        else media.removeListener(listener);
      };
    }, [query]);
    return matches;
  };
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // Highlight helpers (same as AdminUsers)
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highlightMatch = (text, query) => {
    const base = (text || '').toString();
    const q = (query || '').toString();
    if (!q) return base;
    try {
      const parts = base.split(new RegExp(`(${escapeRegExp(q)})`, 'ig'));
      return (
        <>
          {parts.map((part, idx) =>
            part.toLowerCase() === q.toLowerCase() ? (
              <mark key={idx} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
            ) : (
              <span key={idx}>{part}</span>
            )
          )}
        </>
      );
    } catch {
      return base;
    }
  };

  // Client-side search by name and ID
  const filteredProducts = React.useMemo(() => {
    const q = (searchQuery || '').toString().trim().toLowerCase();
    if (!q) return productList;
    return productList.filter((p) => {
      const name = (p.name || '').toString().toLowerCase();
      const idStr = (p.id || p._id || '').toString().toLowerCase();
      return name.includes(q) || idStr.includes(q);
    });
  }, [productList, searchQuery]);

  // Load categories and products on component mount
  useEffect(() => {
    fetchCategories();
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load products based on selected category
  const loadProducts = async (
    categoryId = selectedCategory,
    status = selectedStatus,
    min = priceMin,
    max = priceMax,
    search = searchQuery,
    pageNum = page
  ) => {
    try {
      // Don't set loading state again if already loading
      if (!localLoading) {
        setLocalLoading(true);
      }
      
      const filters = {};
      if (categoryId) {
        filters.category = categoryId;
      }
      // Map status to backend isActive parameter
      if (!status || status === 'all') {
        filters.isActive = 'all';
      } else if (status === 'active') {
        filters.isActive = 'true';
      } else if (status === 'inactive') {
        filters.isActive = 'false';
      }
      // Price range with validation and swap if needed
      const minNum = min !== '' && !isNaN(Number(min)) ? Number(min) : null;
      const maxNum = max !== '' && !isNaN(Number(max)) ? Number(max) : null;
      if (minNum !== null && maxNum !== null) {
        const [lo, hi] = minNum <= maxNum ? [minNum, maxNum] : [maxNum, minNum];
        filters.minPrice = String(lo);
        filters.maxPrice = String(hi);
      } else {
        if (minNum !== null) filters.minPrice = String(minNum);
        if (maxNum !== null) filters.maxPrice = String(maxNum);
      }
      // Search (backend supports name/description)
      // Keep backend search optional; client-side search will also filter IDs
      if (search && search.trim()) {
        filters.search = search.trim();
      }
      
  // Pagination: limit per page and current page
  filters.limit = 10;
  filters.page = pageNum || 1;
      
      console.log('Loading products with filters:', filters);
      
      // Always fetch fresh data to avoid cache issues
      const result = await fetchProducts(filters);
      console.log('Fetched products - raw result:', result);
      
      if (!result) {
        console.error('No result returned from fetchProducts');
        setProductList([]);
        setProductCount(0);
        setPages(1);
      } else if (!result.products) {
        console.error('Invalid response format - no products array:', result);
        
        // If result is an array, it might be the products directly
        if (Array.isArray(result)) {
          console.log('Result is an array, using it directly as products list');
          setProductList(result);
          setProductCount(result.length);
          setPages(1);
        } else {
          setProductList([]);
          setProductCount(0);
          setPages(1);
        }
      } else {
        console.log(`Loaded ${result.products.length} products successfully`);
        setProductList(result.products || []);
        setProductCount(result.totalProducts || 0);
        setPages(result.pages || 1);
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
    setPage(1);
    // useEffect will trigger load
  };

  const handleStatusChange = async (e) => {
    const statusVal = e.target.value;
    setSelectedStatus(statusVal);
    setPage(1);
    // useEffect will trigger load
  };

  const toggleStatusChip = async (value) => {
    // Toggle behavior: clicking active again clears selection (interpreted as All)
    const newVal = selectedStatus === value ? '' : value;
    setSelectedStatus(newVal);
    setPage(1);
    await loadProducts(selectedCategory, newVal, priceMin, priceMax, searchQuery, 1);
  };

  // Open form for creating a new product
  const handleAddNew = () => {
    closeSidebarForModal(); // Force-close sidebar to avoid modal collision
    setEditingProduct(null);
    setShowForm(true);
  };

  // Open form for editing an existing product
  const handleEdit = async (product) => {
    closeSidebarForModal(); // Force-close sidebar to avoid modal collision
    try {
      // Fetch full product details to ensure fields like description are present
      const full = await getProduct(product._id, { forceRefresh: true });
      setEditingProduct(full || product);
    } catch (e) {
      console.warn('Falling back to list product for editing due to fetch error:', e);
      setEditingProduct(product);
    } finally {
      setShowForm(true);
    }
  };

  // Search handlers
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setSearchQuery((searchInput || '').trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  // Handle product deletion
  const handleDelete = async (id) => {
    try {
      setIsDeleting(true);
      setDeleteId(id);
      setDeleteError(null);
      
  await deleteProduct(id);
      
  // Reload products after deletion
  await loadProducts();
      
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
    await loadProducts(selectedCategory, selectedStatus, priceMin, priceMax, searchQuery, page);
  };

  // Clear all filters and close panel
  const clearAllFilters = async () => {
    setSelectedCategory('');
    setSelectedStatus('');
    setPriceMin('');
    setPriceMax('');
    setSearchInput('');
    setSearchQuery('');
    setShowFilters(false);
    setPage(1);
    // useEffect will trigger load
  };

  // Auto load when filters/search change
  useEffect(() => {
    loadProducts(selectedCategory, selectedStatus, priceMin, priceMax, searchQuery, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedStatus, priceMin, priceMax, searchQuery, page]);

  // Debounce local search input to query (like AdminUsers)
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearchQuery((searchInput || '').trim());
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Format price with currency symbol
  const formatPrice = (price) => {
    // Check if price is null, undefined, or not a valid number
    if (price === null || price === undefined || isNaN(parseFloat(price))) {
      return '₹0.00';
    }
    return `₹${parseFloat(price).toLocaleString('en-IN')}`;
  };

  return (
    <div className="admin-products overflow-x-hidden min-w-0">
  <div className="mb-0 md:mb-6 pl-8">
        {/* Tweak left padding: change pl-8 to desired value (e.g., pl-6 for less, pl-10 for more) */}
        {/* Tweak header margin: change mb-0 md:mb-6 to desired values (e.g., mb-2 md:mb-4 for less spacing) */}
        <div className="flex justify-between items-start md:items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">Products</h1>
            <div className="mt-4 flex flex-col space-y-4">
              {/* Links row */}
              <div className="flex space-x-4">
                <Link to="/admin/products" className="text-black font-medium border-b-2 border-white">
                  Products
                </Link>
                <Link to="/admin/categories" className="text-black hover:text-black">
                  Categories
                </Link>
              </div>

              {/* Search and Filter Section - Right below links */}
              <div className="flex flex-col space-y-3">
                {/* Desktop: wide search bar with filter button */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search by name or ID"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                  </div>
                  <button
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 text-sm whitespace-nowrap"
                    onClick={() => setShowFilters((v) => !v)}
                  >
                    <FaFilter className="text-gray-700" />
                    <span>Filters</span>
                  </button>
                </div>

                {/* Mobile: compact search + filter */}
                <div className="sm:hidden flex items-center gap-2">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by name or ID"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                  <button
                    className="inline-flex items-center justify-center px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
                    onClick={() => setShowFilters((v) => !v)}
                    aria-label="Toggle filters"
                  >
                    <FaFilter className="text-gray-700" />
                  </button>
                </div>
              </div>

              {/* Right aligned add button */}
              <div className="flex items-center justify-end w-full">
                <button
                  onClick={handleAddNew}
                  className="hidden md:inline-flex px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 font-medium"
                >
                  Add New Product
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Removed mobile search and filter controls */}

      {/* Desktop search bar removed (moved to header right) */}

      {/* Filters panel */}
      {showFilters && (
        <div id="filters-panel" className="mx-8 mb-4 bg-white border border-gray-100 rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                <button
                  type="button"
                  className={`px-3 py-2 text-sm ${selectedStatus === 'active' ? 'bg-pink-500 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
                  onClick={() => toggleStatusChip('active')}
                >
                  Active
                </button>
                <button
                  type="button"
                  className={`px-3 py-2 text-sm border-l border-gray-300 ${selectedStatus === 'inactive' ? 'bg-pink-500 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
                  onClick={() => toggleStatusChip('inactive')}
                >
                  Inactive
                </button>
              </div>
              <div className="mt-1 text-[11px] text-gray-500">Tap again to clear (All)</div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Price range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-28 border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-28 border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                />
                <button
                  type="button"
                  className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  onClick={() => loadProducts()}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      

      {/* Product Form Modal - Positioned within admin layout boundaries */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[999] pt-24 md:pt-28"
          style={{ paddingLeft: isMobile ? 0 : (isSidebarOpen ? 256 : 80) }}
        >
          <div
            className="bg-white rounded-lg w-full max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] shadow-2xl flex flex-col mx-4 sm:mx-6 md:mx-8 lg:mx-10"
            style={{ maxWidth: `calc(100vw - ${(isMobile ? 0 : (isSidebarOpen ? 256 : 80)) + (isMobile ? 16 : 32) * 2}px)` }}
          >

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

      {/* Products List - Desktop table (md+) remains the same */}
      {localLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-2">Loading products...</p>
        </div>
      ) : (
        <>
        <div className="hidden md:block overflow-x-auto table-scroll px-8">
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
              {(productList || []).length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-4 px-4 text-center text-black">
                    {selectedCategory 
                      ? "No products found in this category. Add your first product." 
                      : "No products found. Add your first product."}
                  </td>
                </tr>
              ) : (
                productList.map((product) => {
                  const rawSrc = product?.featuredImage || (Array.isArray(product?.images) && product.images[0]) || '/placeholder-image.jpg';
                  const imgSrc = typeof rawSrc === 'string' && rawSrc.trim() ? rawSrc : '/placeholder-image.jpg';
                  return (
                  <tr key={product._id} className="border-b border-white">
                    <td className="py-3 px-4">
                      <img
                        src={imgSrc}
                        alt={product.name}
                        className="h-12 w-12 object-cover rounded-md"
                        onError={(e) => { e.currentTarget.src = '/placeholder-image.jpg'; }}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{searchQuery ? highlightMatch(product.name, searchQuery) : product.name}</div>
                      <div className="text-xs text-black">ID: {searchQuery ? highlightMatch(product.id || product._id, searchQuery) : (product.id || product._id.substring(0, 8))}</div>
                      {product.badge && (
                        <div className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          {product.badge}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {product.category?.name || '—'}
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
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                          product.hasEgg
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {product.hasEgg ? (
                          <>
                            <FaEgg className="inline-block" />
                            <span>With Egg</span>
                          </>
                        ) : (
                          <>
                            <FaLeaf className="inline-block" />
                            <span>No Egg</span>
                          </>
                        )}
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
                )})
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards (<md) */}
        <div className="md:hidden space-y-3 px-4">
          {(productList || []).length === 0 ? (
            <div className="text-center text-black py-6">No products found</div>
          ) : (
            productList.map((product) => {
              const rawSrc = product?.featuredImage || (Array.isArray(product?.images) && product.images[0]) || '/placeholder-image.jpg';
              const imgSrc = typeof rawSrc === 'string' && rawSrc.trim() ? rawSrc : '/placeholder-image.jpg';
              return (
              <div key={product._id} className="bg-white rounded-lg shadow-md border border-gray-100 p-3">
                {/* Title: rounded image + name and id */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                    <img src={imgSrc} alt={product.name} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = '/placeholder-image.jpg'; }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-black truncate">{searchQuery ? highlightMatch(product.name, searchQuery) : product.name}</div>
                    <div className="text-xs text-gray-500 truncate">ID: {searchQuery ? highlightMatch(product.id || product._id, searchQuery) : (product.id || product._id.substring(0, 8))}</div>
                  </div>
                </div>

                {/* Body: two columns similar to users */}
                <div className="grid grid-cols-[1.7fr_1fr] gap-1 text-xs">
                  {/* Left: Category, Price */}
                  <div className="space-y-3 text-left pr-5 min-w-0">
                    <div>
                      <div className="text-gray-500">Category</div>
                      <div className="text-black truncate">{product.category?.name || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Price</div>
                      <div className="text-black truncate">
                        {Array.isArray(product.variants) && product.variants.length > 0
                          ? `${product.variants[0].name ? product.variants[0].name + ' - ' : ''}${formatPrice(product.variants[0].price)}`
                          : formatPrice(product.price)}
                      </div>
                    </div>
                  </div>
                  {/* Right: Status, Actions */}
                  <div className="space-y-3 text-right min-w-0">
                    <div>
                      <div className="text-gray-500">Status</div>
                      <div className={`inline-flex items-center gap-1 ${product.isActive ? 'text-green-700' : 'text-gray-800'}`}>
                        <span>{product.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="px-2 py-1 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      {deleteId === product._id ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-red-500">Confirm?</span>
                          <button
                            onClick={() => handleDelete(product._id)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            {isDeleting ? '...' : 'Yes'}
                          </button>
                          <button
                            onClick={handleCancelDelete}
                            className="text-black hover:text-black text-xs"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteId(product._id)}
                          className="px-2 py-1 rounded hover:bg-gray-100 text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
        </>
      )}
      {/* Pagination controls */}
      <div className="px-8 mt-4 mb-8 flex items-center justify-between">
        <div className="text-sm text-gray-600">Total: {productCount}</div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || localLoading}
          >
            Prev
          </button>
          <span className="text-sm">Page {page} of {pages}</span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages || localLoading}
          >
            Next
          </button>
        </div>
      </div>
      {/* Floating Add (+) for mobile */}
      <button
        onClick={handleAddNew}
        className="md:hidden fixed bottom-6 right-6 z-40 bg-pink-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
        aria-label="Add product"
      >
        <FaPlus className="text-xl" />
      </button>
    </div>
  );
};

export default AdminProducts;
