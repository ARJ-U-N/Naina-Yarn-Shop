const Review = require('../models/Review');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Get all reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    console.log('🔍 GET REVIEWS - START');
    const { productId } = req.params;
    console.log('📦 Product ID:', productId);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log('❌ Invalid product ID format');
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || '-createdAt';

    // Check if product exists
    console.log('🔍 Checking if product exists...');
    const product = await Product.findById(productId);
    if (!product) {
      console.log('❌ Product not found:', productId);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    console.log('✅ Product found:', product.name);

    // Build query
    const query = {
      product: productId,
      isApproved: true
    };

    console.log('📝 Query:', query);

    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('📊 Found reviews:', reviews.length);

    const totalReviews = await Review.countDocuments(query);

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      {
        $match: { 
          product: new mongoose.Types.ObjectId(productId), 
          isApproved: true 
        }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    const distribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    ratingDistribution.forEach(item => {
      distribution[item._id] = item.count;
    });

    // Calculate average rating
    const avgRatingResult = await Review.aggregate([
      {
        $match: { 
          product: new mongoose.Types.ObjectId(productId), 
          isApproved: true 
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const averageRating = avgRatingResult.length > 0 ? avgRatingResult[0].averageRating : 0;
    const totalCount = avgRatingResult.length > 0 ? avgRatingResult[0].totalReviews : 0;

    console.log('✅ Sending response with', reviews.length, 'reviews');

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews: totalReviews,
        hasNextPage: page < Math.ceil(totalReviews / limit),
        hasPrevPage: page > 1
      },
      statistics: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: totalCount,
        ratingDistribution: distribution
      }
    });
  } catch (error) {
    console.error('❌ Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Create a review
// @route   POST /api/reviews/product/:productId
// @access  Public
exports.createReview = async (req, res) => {
  try {
    console.log('📝 CREATE REVIEW - START');
    const { productId } = req.params;
    const { reviewerName, reviewerEmail, rating, title, comment } = req.body;

    console.log('📦 Product ID:', productId);
    console.log('📝 Review data:', { reviewerName, rating, title });

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log('❌ Invalid product ID format');
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Validate required fields
    if (!reviewerName || !rating || !title || !comment) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: reviewerName, rating, title, comment'
      });
    }

    // Check if product exists
    console.log('🔍 Checking if product exists...');
    const product = await Product.findById(productId);
    if (!product) {
      console.log('❌ Product not found:', productId);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    console.log('✅ Product found:', product.name);

    const reviewData = {
      product: productId,
      reviewerName: reviewerName.trim(),
      reviewerEmail: reviewerEmail?.trim(),
      rating: parseInt(rating),
      title: title.trim(),
      comment: comment.trim()
    };

    console.log('📝 Creating review with data:', reviewData);

    const review = await Review.create(reviewData);
    console.log('✅ Review created with ID:', review._id);

    // Populate the review before sending response
    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name email');

    console.log('✅ Sending success response');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: populatedReview
    });
  } catch (error) {
    console.error('❌ Create review error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create review: ' + error.message
    });
  }
};


// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private/User (own review)
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;

    let review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns the review (uncomment when auth is implemented)
    // if (review.user && review.user.toString() !== req.user.id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update this review'
    //   });
    // }

    review = await Review.findByIdAndUpdate(
      reviewId,
      { rating, title, comment, isApproved: false }, // Reset approval after edit
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private/User (own review) or Admin
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check authorization (uncomment when auth is implemented)
    // if (review.user && review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to delete this review'
    //   });
    // }

    await Review.findByIdAndDelete(reviewId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews
// @access  Private/Admin
exports.getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const isApproved = req.query.approved !== undefined ? req.query.approved === 'true' : undefined;

    const query = {};
    if (isApproved !== undefined) {
      query.isApproved = isApproved;
    }

    const reviews = await Review.find(query)
      .populate('product', 'name images price')
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalReviews = await Review.countDocuments(query);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews: totalReviews
      }
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Approve/Disapprove review
// @route   PUT /api/reviews/:reviewId/approve
// @access  Private/Admin
exports.approveReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isApproved },
      { new: true }
    ).populate('product', 'name').populate('user', 'name email');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: `Review ${isApproved ? 'approved' : 'disapproved'} successfully`,
      data: review
    });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
