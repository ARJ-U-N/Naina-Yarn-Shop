const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide category name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    default: null
  },
  // ✅ NEW: Track if image was set automatically
  imageSource: {
    type: String,
    enum: ['manual', 'auto-from-product'],
    default: 'manual'
  },
  // ✅ NEW: Track which product provided the image
  imageFromProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate slug from name before saving
categorySchema.pre('save', function(next) {
  if (this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// ✅ NEW: Method to update category image from product
categorySchema.methods.updateImageFromProduct = async function(productId, imageUrl) {
  // Only update if no manual image is set
  if (!this.image || this.imageSource === 'auto-from-product') {
    this.image = imageUrl;
    this.imageSource = 'auto-from-product';
    this.imageFromProduct = productId;
    await this.save();
    return true;
  }
  return false;
};

// ✅ NEW: Method to remove auto image if product is deleted
categorySchema.methods.handleProductDeletion = async function(productId) {
  if (this.imageFromProduct && this.imageFromProduct.toString() === productId.toString()) {
    // Find next product in this category to get image from
    const Product = mongoose.model('Product');
    const nextProduct = await Product.findOne({
      category: this._id,
      isActive: true,
      _id: { $ne: productId }
    }).sort({ createdAt: 1 });

    if (nextProduct && nextProduct.images && nextProduct.images.length > 0) {
      this.image = nextProduct.images[0].url;
      this.imageFromProduct = nextProduct._id;
      await this.save();
    } else {
      // No more products, remove auto image
      if (this.imageSource === 'auto-from-product') {
        this.image = null;
        this.imageSource = 'manual';
        this.imageFromProduct = null;
        await this.save();
      }
    }
  }
};

module.exports = mongoose.model('Category', categorySchema);
