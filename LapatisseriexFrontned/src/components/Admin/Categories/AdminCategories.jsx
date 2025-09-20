import React, { useState, useEffect } from 'react';
import { useCategory } from '../../../context/CategoryContext/CategoryContext';
import { useSidebar } from '../AdminDashboardLayout';
import CategoryForm from './CategoryForm';
import SpecialCategoryImages from './SpecialCategoryImages';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { normalizeImageUrl } from '../../../utils/imageUtils';

/**
 * AdminCategories component for managing categories in admin dashboard
 */
const AdminCategories = () => {
  const { categories, loading, error, fetchCategories, deleteCategory, reprocessCategoryImages } = useCategory();
  const { closeSidebarIfOpen } = useSidebar();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [processingCategoryId, setProcessingCategoryId] = useState(null);
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' or 'special-images'

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
    closeSidebarIfOpen(); // Close sidebar only if it's open
    setEditingCategory(null);
    setShowForm(true);
  };

  // Open form for editing an existing category
  const handleEdit = (category) => {
    closeSidebarIfOpen(); // Close sidebar only if it's open
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

  return (
    <div className="admin-categories" style={{ fontFamily: 'sans-serif' }}>
      <div className="mb-0 md:mb-6 pl-8">
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

              {/* Button row - right aligned */}
              {activeTab === 'categories' && (
                <div className="flex justify-end">
                  <button
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 font-medium"
                  >
                    Add New Category
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[999] pt-24 md:pt-28">
              <div className="bg-white rounded-lg w-full max-w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] shadow-2xl flex flex-col mx-4 sm:mx-6 md:mx-8 lg:mx-10">

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
            <div className="overflow-x-auto">
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
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-4 px-4 text-center text-black font-light">
                        No categories found. Create your first category.
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
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
          )}
        </>
      ) : (
        <SpecialCategoryImages />
      )}
    </div>
  );
};

export default AdminCategories;
