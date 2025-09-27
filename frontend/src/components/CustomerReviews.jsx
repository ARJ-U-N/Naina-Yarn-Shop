import React, { useState, useEffect } from 'react'
import './CustomerReviews.css'

const CustomerReviews = ({ productId }) => {
  const [reviewsData, setReviewsData] = useState([])
  const [statistics, setStatistics] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [showWriteReview, setShowWriteReview] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
    reviewerName: '',
    reviewerEmail: ''
  })
  const [sortBy, setSortBy] = useState('Most Recent')
  const [submitting, setSubmitting] = useState(false)

  // ✅ Fetch reviews from backend
  useEffect(() => {
    if (!productId) return
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching reviews for product:', productId)
      
      const response = await fetch(`http://localhost:5000/api/reviews/product/${productId}`)
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Reviews fetched:', data)
        setReviewsData(data.data)
        setStatistics(data.statistics)
      } else {
        console.error('❌ Failed to fetch reviews:', data.message)
        setReviewsData([])
      }
    } catch (error) {
      console.error('❌ Error fetching reviews:', error)
      setReviewsData([])
    } finally {
      setLoading(false)
    }
  }

  // ✅ Submit new review to backend
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    
    if (!newReview.reviewerName.trim() || !newReview.title.trim() || !newReview.comment.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      console.log('📝 Submitting review:', newReview)

      const response = await fetch(`http://localhost:5000/api/reviews/product/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReview)
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Review submitted successfully:', data.data)
        // Refresh reviews
        await fetchReviews()
        // Reset form
        setNewReview({
          rating: 5,
          title: '',
          comment: '',
          reviewerName: '',
          reviewerEmail: ''
        })
        setShowWriteReview(false)
        alert('Review submitted successfully!')
      } else {
        console.error('❌ Failed to submit review:', data.message)
        alert('Failed to submit review: ' + data.message)
      }
    } catch (error) {
      console.error('❌ Error submitting review:', error)
      alert('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Render star rating
  const renderStars = (rating, interactive = false, onStarClick = null) => {
    return (
      <div className={`star-rating ${interactive ? 'interactive' : ''}`}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={interactive ? () => onStarClick(star) : undefined}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  // Render rating bar
  const renderRatingBar = (starCount, count) => {
    const percentage = statistics.totalReviews > 0 ? (count / statistics.totalReviews) * 100 : 0
    return (
      <div className="rating-bar">
        <div className="rating-bar-stars">
          {renderStars(starCount)}
        </div>
        <div className="rating-bar-progress">
          <div 
            className="rating-bar-fill" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="rating-bar-count">{count}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <section className="customer-reviews">
        <div className="reviews-loading">
          <div className="loading-spinner"></div>
          <p>Loading reviews...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="customer-reviews">
      <h2 className="reviews-title">Customer Reviews</h2>

      <div className="reviews-header">
        <div className="reviews-summary">
          <div className="overall-rating">
            {renderStars(Math.round(statistics.averageRating))}
            <span className="rating-number">{statistics.averageRating} out of 5</span>
          </div>
          <p className="reviews-count">
            Based on {statistics.totalReviews} review{statistics.totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="rating-breakdown">
          {[5, 4, 3, 2, 1].map(stars => 
            renderRatingBar(stars, statistics.ratingDistribution[stars] || 0)
          )}
        </div>

        <button 
          className="write-review-btn"
          onClick={() => setShowWriteReview(!showWriteReview)}
        >
          Write a review
        </button>
      </div>

      {/* Write Review Form */}
      {showWriteReview && (
        <form className="write-review-form" onSubmit={handleSubmitReview}>
          <h3>Write a Review</h3>
          
          <div className="form-group">
            <label>Rating *</label>
            {renderStars(newReview.rating, true, (rating) => 
              setNewReview({...newReview, rating})
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reviewer-name">Your Name *</label>
            <input
              type="text"
              id="reviewer-name"
              value={newReview.reviewerName}
              onChange={(e) => setNewReview({...newReview, reviewerName: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reviewer-email">Your Email (Optional)</label>
            <input
              type="email"
              id="reviewer-email"
              value={newReview.reviewerEmail}
              onChange={(e) => setNewReview({...newReview, reviewerEmail: e.target.value})}
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="review-title">Review Title *</label>
            <input
              type="text"
              id="review-title"
              value={newReview.title}
              onChange={(e) => setNewReview({...newReview, title: e.target.value})}
              placeholder="Give your review a title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="review-comment">Your Review *</label>
            <textarea
              id="review-comment"
              value={newReview.comment}
              onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
              placeholder="Tell us about your experience with this product"
              rows="4"
              required
            />
          </div>

          <div className="form-buttons">
            <button 
              type="button" 
              onClick={() => setShowWriteReview(false)} 
              className="cancel-btn"
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-review-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Sort Options */}
      {reviewsData.length > 0 && (
        <div className="reviews-controls">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="Most Recent">Most Recent</option>
            <option value="Oldest">Oldest</option>
            <option value="Highest Rating">Highest Rating</option>
            <option value="Lowest Rating">Lowest Rating</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {reviewsData.map(review => (
          <div key={review._id} className="review-item">
            <div className="review-header">
              <div className="reviewer-info">
                <div className="reviewer-avatar">
                  {review.reviewerName.charAt(0).toUpperCase()}
                </div>
                <div className="reviewer-details">
                  <h4 className="reviewer-name">{review.reviewerName}</h4>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>
              {renderStars(review.rating)}
            </div>
            
            <h5 className="review-title">{review.title}</h5>
            <p className="review-comment">{review.comment}</p>
            
            {review.isVerifiedPurchase && (
              <span className="verified-badge">✓ Verified Purchase</span>
            )}
          </div>
        ))}
      </div>

      {reviewsData.length === 0 && !loading && (
        <div className="no-reviews">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      )}
    </section>
  )
}

export default CustomerReviews
