import Category from '../models/categoryModel.js';
import Product from '../models/productModel.js';

// Get all categories with product images for public display
export const getCategories = async (req, res) => {
  try {
    // Get categories and populate with a sample product image
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    
    // For each category, get the first product's image
    const categoriesWithImages = await Promise.all(
      categories.map(async (category) => {
        const firstProduct = await Product.findOne({ 
          category: category._id, 
          isActive: true 
        }).select('imageUrl');
        
        return {
          _id: category._id,
          name: category.name,
          description: category.description,
          image: firstProduct?.imageUrl || '/images/cake-logo.png', // fallback image
          isActive: category.isActive,
          createdAt: category.createdAt
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: categoriesWithImages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = new Category({
      name,
      description,
      imageUrl
    });

    await category.save();
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    
    // Check if another category with the same name exists
    if (name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, imageUrl },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    // Check if category has products
    const productsCount = await Product.countDocuments({ category: req.params.id, isActive: true });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${productsCount} active product(s). Please move or delete the products first.`
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ 
      category: req.params.id, 
      isActive: true 
    }).populate('category', 'name').sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products by category',
      error: error.message
    });
  }
};

// Get public categories for header display (optimized)
export const getPublicCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    
    console.log('Raw categories from DB:', categories.map(cat => ({ 
      _id: cat._id, 
      name: cat.name,
      hasId: !!cat._id 
    })));
    
    const formattedCategories = categories.map(category => ({
      _id: category._id,
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl || '/images/default-category.jpg' // Use category's own imageUrl field
    }));

    console.log('Formatted categories:', formattedCategories.map(cat => ({ 
      _id: cat._id, 
      name: cat.name,
      hasId: !!cat._id 
    })));

    res.json({
      success: true,
      data: formattedCategories
    });
  } catch (error) {
    console.error('Error fetching public categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};
