const Category = require('../models/Category');
const Product = require('../models/Product');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// ===================================
// CLOUDINARY CONFIGURATION FOR IMAGE UPLOAD
// ===================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 File upload attempt:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Please upload only images (JPG, PNG, GIF)'), false);
    }
  }
});

// ===================================
// IMAGE UPLOAD MIDDLEWARE & HANDLER
// ===================================

// @desc    Upload category image middleware
// @route   POST /api/categories/upload-image
// @access  Private/Admin
exports.uploadCategoryImage = upload.single('image');

// @desc    Handle image upload response
// @route   POST /api/categories/upload-image
// @access  Private/Admin
exports.handleImageUpload = async (req, res) => {
  try {
    console.log('🚀 Image upload handler called');
    console.log('📄 File info:', req.file);

    if (!req.file) {
      console.log('❌ No file provided in request');
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Upload directly to Cloudinary using buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'nayher-categories',
          public_id: `category-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
          transformation: [
            { width: 800, height: 800, crop: 'limit', quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Cloudinary upload success:', result.secure_url);
            resolve(result);
          }
        }
      );

      // Send the buffer to Cloudinary
      uploadStream.end(req.file.buffer);
    });

    const imageUrl = result.secure_url;
    
    console.log('✅ Image uploaded successfully to Cloudinary:', {
      originalName: req.file.originalname,
      url: imageUrl,
      cloudinaryId: result.public_id
    });
    
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        imageUrl,
        originalName: req.file.originalname,
        cloudinaryId: result.public_id,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

// ===================================
// CATEGORY CRUD OPERATIONS
// ===================================

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
    console.log('📋 Fetching all categories...');
    
    const categories = await Category.find({ isActive: true })
      .sort('name');

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({
          category: category._id,
          isActive: true
        });
        return {
          ...category.toObject(),
          productCount
        };
      })
    );

    console.log(`✅ Found ${categoriesWithCount.length} categories`);

    res.json({
      success: true,
      data: categoriesWithCount
    });
  } catch (error) {
    console.error('❌ Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single category by ID or slug
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    console.log('🔍 Fetching category:', req.params.id);
    
    // Handle both ID and slug
    const isObjectId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId 
      ? { _id: req.params.id, isActive: true }
      : { slug: req.params.id, isActive: true };
      
    const category = await Category.findOne(query);

    if (!category) {
      console.log('❌ Category not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const productCount = await Product.countDocuments({
      category: category._id,
      isActive: true
    });

    console.log('✅ Category found:', category.name);

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        productCount
      }
    });
  } catch (error) {
    console.error('❌ Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    console.log('🆕 Creating category:', req.body);
    
    const category = await Category.create(req.body);

    console.log('✅ Category created successfully:', category.name);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('❌ Create category error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    console.log('✏️ Updating category:', req.params.id, req.body);
    
    let category = await Category.findById(req.params.id);

    if (!category) {
      console.log('❌ Category not found for update:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // If manually setting image, update imageSource
    if (req.body.image && req.body.image !== category.image) {
      req.body.imageSource = 'manual';
      req.body.imageFromProduct = null;
      console.log('🖼️ Manual image update detected');
    }

    category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    console.log('✅ Category updated successfully:', category.name);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('❌ Update category error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    console.log('🗑️ Deleting category:', req.params.id);
    
    const category = await Category.findById(req.params.id);

    if (!category) {
      console.log('❌ Category not found for deletion:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({
      category: category._id,
      isActive: true
    });

    if (productCount > 0) {
      console.log('❌ Cannot delete category with products:', productCount);
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${productCount} active products.`
      });
    }

    // Delete from Cloudinary if image exists
    if (category.image && category.imageSource === 'manual') {
      try {
        // Extract public_id from Cloudinary URL
        if (category.image.includes('cloudinary.com')) {
          const urlParts = category.image.split('/');
          const fileNameWithExt = urlParts[urlParts.length - 1];
          const publicId = `nayher-categories/${fileNameWithExt.split('.')[0]}`;
          
          await cloudinary.uploader.destroy(publicId);
          console.log('🗑️ Deleted image from Cloudinary:', publicId);
        }
      } catch (cloudinaryError) {
        console.log('⚠️ Could not delete image from Cloudinary:', cloudinaryError.message);
        // Continue with category deletion even if image deletion fails
      }
    }

    await Category.findByIdAndDelete(req.params.id);

    console.log('✅ Category deleted successfully:', category.name);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ===================================
// CATEGORY IMAGE AUTO-UPDATE HELPERS
// ===================================

// Helper function to update category image from product (for future use)
exports.updateCategoryImageFromProduct = async (productId, categoryId, imageUrl) => {
  try {
    const category = await Category.findById(categoryId);
    if (category && (!category.image || category.imageSource === 'auto-from-product')) {
      category.image = imageUrl;
      category.imageSource = 'auto-from-product';
      category.imageFromProduct = productId;
      await category.save();
      console.log('✅ Updated category image from product:', category.name);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error updating category image from product:', error);
    return false;
  }
};

// Helper function to handle product deletion (for future use)
exports.handleProductDeletionForCategory = async (productId, categoryId) => {
  try {
    const category = await Category.findById(categoryId);
    if (category && category.imageFromProduct && 
        category.imageFromProduct.toString() === productId.toString()) {
      
      // Find next product in this category
      const nextProduct = await Product.findOne({
        category: categoryId,
        isActive: true,
        _id: { $ne: productId }
      }).sort({ createdAt: 1 });

      if (nextProduct && nextProduct.images && nextProduct.images.length > 0) {
        category.image = nextProduct.images[0].url;
        category.imageFromProduct = nextProduct._id;
        await category.save();
        console.log('✅ Updated category image to next product');
      } else if (category.imageSource === 'auto-from-product') {
        category.image = null;
        category.imageSource = 'manual';
        category.imageFromProduct = null;
        await category.save();
        console.log('✅ Removed auto category image (no more products)');
      }
    }
  } catch (error) {
    console.error('❌ Error handling product deletion for category:', error);
  }
};
