import React, { useState, useEffect } from 'react';
import { useCategory } from '../../../context/CategoryContext/CategoryContext';
import { useSidebar } from '../AdminDashboardLayout';
import CategoryForm from './CategoryForm';
import SpecialCategoryImages from './SpecialCategoryImages';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { normalizeImageUrl } from '../../../utils/imageUtils';
import { FaPlus, FaFilter } from 'react-icons/fa';

/**
 * AdminCategories component for managing categories in admin dashboard
 */
const AdminCategories = () => {
  const { categories, loading, error, fetchCategories, deleteCategory, reprocessCategoryImages } = useCategory();
  const { closeSidebarIfOpen, closeSidebarForModal, isSidebarOpen, isMobile } = useSidebar();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [processingCategoryId, setProcessingCategoryId] = useState(null);
  const [activeTab, setActiveTab] = useState('categories'); 
  // Search/filters (parity with AdminUsers)
  const [showFilters, setShowFilters] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  // Track expanded descriptions for mobile cards
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const toggleDescription = (id) => {
    setExpandedDescriptions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Load categories including inactive ones
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLocalLoading(true);
        console.log('Admin: Loading all categories including inactive ones');
        const categoriesData = await fetchCategories(true);
        console.log(`Admin: Loaded ${categoriesData.length} categories`);
      } catch (err) {
        console.error("Error loading categories:", err);
        setDeleteError("Failed to load categories. Please try again.");
      } finally {
        setLocalLoading(false);
      }
    };
    
    loadCategories();
    
    // Set up an interval to refresh categories data every minute
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing categories data');
      loadCategories();
    }, 60000); // Refresh every minute
    
    return () => {
      clearInterval(refreshInterval); // Clean up on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open form for creating a new category
  const handleAddNew = () => {
    closeSidebarForModal(); // Force-close sidebar to avoid modal collision
    setEditingCategory(null);
    setShowForm(true);
  };

  // Open form for editing an existing category
  const handleEdit = (category) => {
    closeSidebarForModal(); // Force-close sidebar to avoid modal collision
    setEditingCategory(category);
    setShowForm(true);
  };

  // Handle category deletion
  const handleDelete = async (id) => {
    try {
      setIsDeleting(true);
      setDeleteId(id);
      setDeleteError(null);
      
      await deleteCategory(id);
      // We don't need to call fetchCategories here as the deleteCategory method already refreshes the list
      
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete category');
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

  // Handle form close
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCategory(null);
  };
  
  // Handle reprocessing of category images (background removal)
  const handleReprocessImages = async (categoryId, categoryName) => {
    if (!categoryId) return;
    
    try {
      setProcessingCategoryId(categoryId);
      toast.info(`Reprocessing images for ${categoryName}...`);
      
      const result = await reprocessCategoryImages(categoryId);
      
      if (result && result.category) {
        toast.success(`Successfully reprocessed ${result.category.images?.length || 0} images for ${categoryName}`);
      } else {
        toast.warning(`No images found for ${categoryName} or no changes needed`);
      }
    } catch (err) {
      console.error('Error reprocessing images:', err);
      toast.error(`Failed to reprocess images: ${err.message || 'Unknown error'}`);
    } finally {
      setProcessingCategoryId(null);
    }
  };

  // Derived filtered categories by name/description (client-side)
  const filteredCategories = React.useMemo(() => {
    const q = (globalSearch || '').toLowerCase().trim();
    if (!q) return categories;
    return categories.filter((c) =>
      (c?.name || '').toLowerCase().includes(q) || (c?.description || '').toLowerCase().includes(q)
    );
  }, [categories, globalSearch]);

  return (
  <div className="admin-categories overflow-x-hidden min-w-0" style={{ fontFamily: 'sans-serif' }}>
      <div className="mb-0 md:mb-6 px-4 md:px-8">
        {/* Tweak left padding: change pl-8 to desired value (e.g., pl-6 for less, pl-10 for more) */}
        {/* Tweak header margin: change mb-0 md:mb-6 to desired values (e.g., mb-2 md:mb-4 for less spacing) */}
        <div className="flex justify-between items-start md:items-center">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Categories</h1>
            <div className="mt-4 flex flex-col space-y-4">
              {/* Links row */}
              <div className="flex space-x-4">
                <Link to="/admin/products" className="text-black hover:text-black font-light">
                  Products
                </Link>
                <Link to="/admin/categories" className="text-black font-bold border-b-2 border-black">
                  Categories
                </Link>
              </div>

              {/* Search and Controls row */}
              <div className="flex flex-col space-y-3">
                {/* Desktop search + filter */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      placeholder="Search by name or description"
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
                  {activeTab === 'categories' && (
                    <button
                      onClick={handleAddNew}
                      className="hidden md:inline-flex px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 font-medium"
                    >
                      Add New Category
                    </button>
                  )}
                </div>
                {/* Mobile search + small filter icon */}
                <div className="sm:hidden flex items-center gap-2">
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Search categories"
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  />
                  <button
                    className="inline-flex sm:hidden items-center justify-center px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
                    onClick={() => setShowFilters((v) => !v)}
                    aria-label="Toggle filters"
                  >
                    <FaFilter className="text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 px-4 md:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap gap-3 sm:gap-8">
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Regular Categories
            </button>
            <button
              onClick={() => setActiveTab('special-images')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'special-images'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Special Category Images
            </button>
          </nav>
        </div>
      </div>

      {error && activeTab === 'categories' && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md font-medium">
          {error}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'categories' ? (
        <>
          {/* Category Form Modal - Positioned within admin layout boundaries */}
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
                    <CategoryForm
                      category={editingCategory}
                      onClose={handleCloseForm}
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Categories List */}
          {localLoading ? (
            <div className="text-center py-10" style={{ fontFamily: 'sans-serif' }}>
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
              <p className="mt-2 font-light">Loading categories...</p>
            </div>
          ) : (
            <>
              {/* Desktop table view (unchanged, visible on md+) */}
              <div className="hidden md:block overflow-x-auto table-scroll px-8">
                <table className="min-w-full bg-white border border-white" style={{ fontFamily: 'sans-serif' }}>
                  <thead className="bg-white">
                    <tr>
                      <th className="py-3 px-4 text-left font-semibold">Image</th>
                      <th className="py-3 px-4 text-left font-semibold">Name</th>
                      <th className="py-3 px-4 text-left font-semibold">Description</th>
                      <th className="py-3 px-4 text-left font-semibold">Status</th>
                      <th className="py-3 px-4 text-left font-semibold">Media</th>
                      <th className="py-3 px-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-4 px-4 text-center text-black font-light">
                          No categories found. Create your first category.
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((category) => (
                        <tr key={category._id} className="border-b border-white">
                          <td className="py-3 px-4">
                            {category.featuredImage ? (
                              <img
                                src={normalizeImageUrl(category.featuredImage)}
                                alt={category.name}
                                className="h-12 w-12 object-contain rounded-md bg-gray-50"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-white rounded-md flex items-center justify-center text-white">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">{category.name}</td>
                          <td className="py-3 px-4 max-w-xs truncate font-light">
                            {category.description || "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                                category.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-white text-black"
                              }`}
                            >
                              {category.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-light">
                            <div className="flex space-x-2">
                              <span className="text-sm">
                                {category.images?.length || 0} images
                              </span>
                              {category.videos?.length > 0 && (
                                <span className="text-sm">
                                  {category.videos.length} videos
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(category)}
                                className="text-blue-500 hover:text-blue-700 font-medium"
                              >
                                Edit
                              </button>
                              <Link
                                to={`/admin/categories/${category._id}/products`}
                                className="text-green-500 hover:text-green-700 font-medium"
                              >
                                Products
                              </Link>
                              {category.images?.length > 0 && (
                                <button
                                  onClick={() => handleReprocessImages(category._id, category.name)}
                                  disabled={processingCategoryId === category._id}
                                  className={`text-purple-500 hover:text-purple-700 font-medium ${
                                    processingCategoryId === category._id ? 'opacity-50 cursor-wait' : ''
                                  }`}
                                  title="Remove backgrounds from all images in this category"
                                >
                                  {processingCategoryId === category._id ? "Processing..." : "Remove BG"}
                                </button>
                              )}
                              {deleteId === category._id ? (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-red-500 font-light">Confirm?</span>
                                  <button
                                    onClick={() => handleDelete(category._id)}
                                    disabled={isDeleting}
                                    className="text-red-600 hover:text-red-800 font-medium"
                                  >
                                    {isDeleting ? "..." : "Yes"}
                                  </button>
                                  <button
                                    onClick={handleCancelDelete}
                                    className="text-black hover:text-black font-medium"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteId(category._id)}
                                  className="text-red-500 hover:text-red-700 font-medium"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                            {deleteError && deleteId === category._id && (
                              <p className="text-red-500 text-xs mt-1 font-light">{deleteError}</p>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view (visible < md) */}
              <div className="md:hidden space-y-3 px-4 overflow-x-hidden">
                {filteredCategories.length === 0 ? (
                  <div className="text-center text-black py-6">No categories found. Create your first category.</div>
                ) : (
                  filteredCategories.map((category) => (
                    <div key={category._id} className="bg-white rounded-lg shadow-md border border-gray-100 p-3 w-full overflow-hidden">
                      {/* Header: avatar + name and status */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                          {category.featuredImage ? (
                            <img src={normalizeImageUrl(category.featuredImage)} alt={category.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="text-gray-400 text-xs">No Image</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-base font-semibold text-black truncate">{category.name}</div>
                          <div className={`inline-flex items-center text-xs mt-0.5 ${category.isActive ? 'text-green-700' : 'text-gray-800'}`}>{category.isActive ? 'Active' : 'Inactive'}</div>
                        </div>
                      </div>

                      {/* Body: description + media */}
                      <div className="text-xs">
                        <div className="space-y-3 text-left min-w-0">
                          <div>
                            <div className="text-gray-500">Description</div>
                            {(() => {
                              const desc = category.description || '—';
                              const limit = 60;
                              const expanded = !!expandedDescriptions[category._id];
                              const needsSlice = (desc || '').length > limit;
                              return (
                                <div className={`text-black ${expanded ? 'whitespace-normal break-words [overflow-wrap:anywhere]' : 'truncate'}`}>
                                  {expanded || !needsSlice ? (
                                    desc
                                  ) : (
                                    <>
                                      {desc.slice(0, limit)}
                                      <button
                                        type="button"
                                        onClick={() => toggleDescription(category._id)}
                                        className="ml-1 text-pink-600 hover:underline align-baseline"
                                        aria-label="Show full description"
                                      >
                                        ...
                                      </button>
                                    </>
                                  )}
                                  {expanded && needsSlice && (
                                    <button
                                      type="button"
                                      onClick={() => toggleDescription(category._id)}
                                      className="ml-2 text-pink-600 hover:underline align-baseline text-xs"
                                      aria-label="Show less"
                                    >
                                      Show less
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                          <div>
                            <div className="text-gray-500">Media</div>
                            <div className="text-black truncate flex items-center gap-2">
                              <span>{category.images?.length || 0} images</span>
                              {category.videos?.length > 0 && <span>{category.videos.length} videos</span>}
                            </div>
                          </div>
                        </div>
                        {/* Actions row on the left in single line */}
                        <div className="mt-2 flex flex-wrap items-center justify-start gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="px-2 py-1 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-900 text-xs"
                          >
                            Edit
                          </button>
                          <Link
                            to={`/admin/categories/${category._id}/products`}
                            className="px-2 py-1 rounded hover:bg-gray-100 text-green-600 hover:text-green-900 text-xs"
                          >
                            Products
                          </Link>
                          {category.images?.length > 0 && (
                            <button
                              onClick={() => handleReprocessImages(category._id, category.name)}
                              disabled={processingCategoryId === category._id}
                              className={`px-2 py-1 rounded hover:bg-gray-100 text-purple-600 hover:text-purple-900 text-xs ${processingCategoryId === category._id ? 'opacity-50 cursor-wait' : ''}`}
                              title="Remove backgrounds from all images in this category"
                            >
                              {processingCategoryId === category._id ? 'Processing…' : 'Remove BG'}
                            </button>
                          )}
                          {deleteId === category._id ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-red-500">Confirm?</span>
                              <button
                                onClick={() => handleDelete(category._id)}
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
                              onClick={() => setDeleteId(category._id)}
                              className="px-2 py-1 rounded hover:bg-gray-100 text-red-600 hover:text-red-800 text-xs"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="px-4 md:px-8">
          <SpecialCategoryImages />
        </div>
      )}
      {/* Floating Add (+) for mobile, like AdminProducts */}
      {activeTab === 'categories' && (
        <button
          onClick={handleAddNew}
          className="md:hidden fixed bottom-6 right-6 z-40 bg-pink-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
          aria-label="Add category"
        >
          <FaPlus className="text-xl" />
        </button>
      )}
    </div>
  );
};

export default AdminCategories;
