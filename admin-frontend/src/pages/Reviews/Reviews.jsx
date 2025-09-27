import React, { useState } from 'react'
import { useApi, useApiMutation } from '../../hooks/useApi'
import api from '../../utils/api'
import { 
  Star, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Trash2,
  MessageSquare,
  User,
  Calendar,
  Package
} from 'lucide-react'

const Reviews = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    approved: undefined // undefined = all, true = approved, false = pending
  })

  const { data, loading, refetch } = useApi(() => api.reviews.getAll(filters), [filters])
  const { mutate: updateReview, loading: updating } = useApiMutation()
  const { mutate: deleteReview, loading: deleting } = useApiMutation()

  const handleApprove = async (reviewId, isApproved) => {
    const result = await updateReview(
      () => api.reviews.approve(reviewId, isApproved),
      `Review ${isApproved ? 'approved' : 'rejected'} successfully`
    )
    if (result.success) {
      refetch()
    }
  }

  const handleDelete = async (reviewId, reviewTitle) => {
    if (window.confirm(`Are you sure you want to delete the review "${reviewTitle}"?`)) {
      const result = await deleteReview(
        () => api.reviews.delete(reviewId),
        'Review deleted successfully'
      )
      if (result.success) {
        refetch()
      }
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }))
  }

  const getStarRating = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const getStatusBadge = (isApproved) => {
    return isApproved 
      ? <span className="badge badge-success">Approved</span>
      : <span className="badge badge-warning">Pending</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer reviews and feedback
          </p>
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Total Reviews</p>
                <p className="text-xl font-bold">{data.pagination?.totalReviews || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-xl font-bold">
                  {data.data?.filter(review => review.isApproved).length || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-xl font-bold">
                  {data.data?.filter(review => !review.isApproved).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group mb-0">
              <label>Filter by Status</label>
              <select
                className="form-control"
                value={filters.approved === undefined ? 'all' : filters.approved.toString()}
                onChange={(e) => handleFilterChange('approved', 
                  e.target.value === 'all' ? undefined : e.target.value === 'true'
                )}
              >
                <option value="all">All Reviews</option>
                <option value="true">Approved Only</option>
                <option value="false">Pending Only</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label>Items per page</label>
              <select
                className="form-control"
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : data?.data?.length > 0 ? (
            <div className="space-y-6">
              {data.data.map((review) => (
                <div key={review._id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className="flex">{getStarRating(review.rating)}</div>
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {review.rating}/5
                        </span>
                        {getStatusBadge(review.isApproved)}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {review.title}
                      </h3>
                      <p className="text-gray-700 mb-4">{review.comment}</p>
                    </div>
                  </div>

                  {/* Review Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      <div>
                        <p className="font-medium text-gray-900">{review.reviewerName}</p>
                        {review.reviewerEmail && (
                          <p className="text-xs">{review.reviewerEmail}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.product?.name || 'Product'}
                        </p>
                        <p className="text-xs">₹{review.product?.price?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(review.createdAt).toLocaleDateString('en-IN')}
                        </p>
                        <p className="text-xs">
                          {new Date(review.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex gap-2">
                      {!review.isApproved ? (
                        <button
                          onClick={() => handleApprove(review._id, true)}
                          disabled={updating}
                          className="btn btn-success btn-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApprove(review._id, false)}
                          disabled={updating}
                          className="btn btn-warning btn-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Unapprove
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(review._id, review.title)}
                        disabled={deleting}
                        className="btn btn-danger btn-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>

                    {review.helpfulVotes > 0 && (
                      <div className="text-sm text-gray-500">
                        {review.helpfulVotes} people found this helpful
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <MessageSquare className="empty-state-icon" />
              <p className="text-lg font-medium text-gray-900 mb-2">No reviews found</p>
              <p className="text-gray-500">
                {filters.approved !== undefined 
                  ? 'No reviews match your current filter.'
                  : 'Customer reviews will appear here once they start reviewing products.'
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-gray-700">
                Showing {((filters.page - 1) * filters.limit) + 1} to{' '}
                {Math.min(filters.page * filters.limit, data.pagination.totalReviews)} of{' '}
                {data.pagination.totalReviews} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  disabled={filters.page === 1}
                  className="btn btn-sm btn-secondary"
                >
                  Previous
                </button>
                <span className="flex items-center px-3 text-sm text-gray-500">
                  Page {filters.page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  disabled={filters.page >= data.pagination.totalPages}
                  className="btn btn-sm btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reviews
