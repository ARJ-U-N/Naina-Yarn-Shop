const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      search,
      minPrice,
      maxPrice,
      status,
      sort = '-createdAt',
      featured
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Category filter
    if (category) {
      query.category = category;
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Price filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Featured filter
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Execute query with pagination
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug description');

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ✅ UPDATED: Create product with category image logic
// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    await product.populate('category', 'name slug');

    // ✅ NEW: Update category image if this is the first product
    await updateCategoryImageFromProduct(product);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ UPDATED: Update product with category image logic
// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Store old data for comparison
    const oldCategoryId = product.category.toString();
    const oldImages = product.images;

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    // ✅ NEW: Handle category image updates
    await handleProductUpdate(product, oldCategoryId, oldImages);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ UPDATED: Delete product with category image cleanup
// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // ✅ NEW: Handle category image cleanup before deletion
    const category = await Category.findById(product.category);
    if (category) {
      await category.handleProductDeletion(product._id);
    }

    // Soft delete - just mark as inactive
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:slug
// @access  Public
exports.getProductsByCategory = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const {
      page = 1,
      limit = 12,
      sort = '-createdAt'
    } = req.query;

    const products = await Product.find({
      category: category._id,
      isActive: true
    })
      .populate('category', 'name slug')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({
      category: category._id,
      isActive: true
    });

    res.json({
      success: true,
      category: {
        name: category.name,
        slug: category.slug,
        description: category.description
      },
      data: products,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ✅ NEW: Helper function to update category image from new product
async function updateCategoryImageFromProduct(product) {
  try {
    if (product.images && product.images.length > 0) {
      const category = await Category.findById(product.category);
      if (category) {
        await category.updateImageFromProduct(product._id, product.images[0].url);
        console.log(`✅ Updated category "${category.name}" image from product "${product.name}"`);
      }
    }
  } catch (error) {
    console.error('Error updating category image:', error);
  }
}

// ✅ NEW: Helper function to handle product updates
async function handleProductUpdate(updatedProduct, oldCategoryId, oldImages) {
  try {
    const newCategoryId = updatedProduct.category._id.toString();
    const newImages = updatedProduct.images;

    // Check if category changed
    if (oldCategoryId !== newCategoryId) {
      // Handle old category - might need new image
      const oldCategory = await Category.findById(oldCategoryId);
      if (oldCategory && oldCategory.imageFromProduct && 
          oldCategory.imageFromProduct.toString() === updatedProduct._id.toString()) {
        await oldCategory.handleProductDeletion(updatedProduct._id);
      }

      // Handle new category - update with this product's image
      if (newImages && newImages.length > 0) {
        await updateCategoryImageFromProduct(updatedProduct);
      }
    } else {
      // Same category, check if image changed
      const imageChanged = !oldImages || oldImages.length === 0 || 
                          !newImages || newImages.length === 0 || 
                          oldImages[0]?.url !== newImages[0]?.url;

      if (imageChanged && newImages && newImages.length > 0) {
        const category = await Category.findById(newCategoryId);
        if (category && category.imageFromProduct && 
            category.imageFromProduct.toString() === updatedProduct._id.toString()) {
          // This product's image is used for category, update it
          category.image = newImages[0].url;
          await category.save();
          console.log(`✅ Updated category "${category.name}" image from updated product`);
        }
      }
    }
  } catch (error) {
    console.error('Error handling product update:', error);
  }
}
