const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide product description'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price cannot be negative']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please provide product category']
  },
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  sku: {
    type: String,
    unique: true
  },
  tags: [String],
  colors: [String],
  sizes: [String],
  materials: [String],
  status: {
    type: String,
    enum: ['available', 'sold-out', 'discontinued'],
    default: 'available'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative']
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  // ✅ UPDATED: Replace your existing rating field with these
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  // ✅ KEEP: Your existing rating field for backward compatibility (if needed)
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },                                                                             
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// ✅ ADD: Virtual field to get reviews for this product
productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false,
  match: { isApproved: true }
});

// ✅ ADD: Sync rating fields (keep both in sync for backward compatibility)
productSchema.pre('save', function(next) {
  // Sync the new fields with old rating structure
  this.rating.average = this.averageRating;
  this.rating.count = this.totalReviews;
  next();
});

// Keep all your existing middleware
productSchema.pre('save', function(next) {
  if (this.stock === 0) {
    this.status = 'sold-out';
  } else if (this.status === 'sold-out' && this.stock > 0) {
    this.status = 'available';
  }
  next();
});

productSchema.pre('save', function(next) {
  if (!this.sku) {
    this.sku = `NYH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

// ✅ ADD: Method to get product with reviews
productSchema.methods.getWithReviews = function() {
  return this.populate({
    path: 'reviews',
    select: 'rating title comment reviewerName createdAt isVerifiedPurchase',
    options: { sort: { createdAt: -1 }, limit: 10 }
  });
};

// Make sure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
