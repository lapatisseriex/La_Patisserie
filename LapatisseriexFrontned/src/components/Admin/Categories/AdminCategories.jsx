import React, { useState, useEffect } from 'react';
import { useCategory } from '../../../context/CategoryContext/CategoryContext';
import CategoryForm from './CategoryForm';
import { Link } from 'react-router-dom';

/**
 * AdminCategories component for managing categories in admin dashboard
 */
const AdminCategories = () => {
  const { categories, loading, error, fetchCategories, deleteCategory } = useCategory();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

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
    setEditingCategory(null);
    setShowForm(true);
  };

  // Open form for editing an existing category
  const handleEdit = (category) => {
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

  return (
    <div className="admin-categories" style={{ fontFamily: 'sans-serif' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <div className="mt-2 flex space-x-4">
            <Link to="/admin/products" className="text-black hover:text-black font-light">
              Products
            </Link>
            <Link to="/admin/categories" className="text-black font-bold border-b-2 border-black">
              Categories
            </Link>
          </div>
        </div>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 font-medium"
        >
          Add New Category
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md font-medium">
          {error}
        </div>
      )}

      {/* Category Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: 'sans-serif' }}>
            <CategoryForm 
              category={editingCategory} 
              onClose={handleCloseForm} 
            />
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
                          src={category.featuredImage}
                          alt={category.name}
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
    </div>
  );
};

export default AdminCategories;