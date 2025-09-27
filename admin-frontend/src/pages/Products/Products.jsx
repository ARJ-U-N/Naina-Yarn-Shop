import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi, useApiMutation } from '../../hooks/useApi'
import api from '../../utils/api'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  AlertTriangle,
  Star,
  Filter,
  Grid,
  List
} from 'lucide-react'
import './Products.css'

const Products = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: '',
    category: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    featured: ''
  })
  const [viewMode, setViewMode] = useState('grid')

  const { data, loading, refetch } = useApi(() => api.products.getAll(filters), [filters])
  const { data: categories } = useApi(() => api.categories.getAll())
  const { mutate: deleteProduct, loading: deleting } = useApiMutation()

  // Fixed image URL helper for admin panel (port 3001)
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null
    
    // Skip placeholder and invalid URLs
    if (imageUrl.includes('via.placeholder.com') || 
        imageUrl.includes('placeholder') ||
        imageUrl.includes('picsum') ||
        imageUrl === '/placeholder-image.jpg') {
      console.log('⚠️ Skipping placeholder URL:', imageUrl)
      return null
    }
    
    // Handle absolute URLs from backend
    if (imageUrl.startsWith('http://localhost:5000')) {
      return imageUrl.replace('http://localhost:5000', 'http://localhost:3001')
    }
    
    if (imageUrl.startsWith('http')) {
      return imageUrl
    }
    
    // Handle relative URLs - use admin proxy (port 3001)
    if (imageUrl.startsWith('/uploads')) {
      return `http://localhost:3001${imageUrl}`
    }
    
    console.log('⚠️ Unknown image URL format:', imageUrl)
    return null
  }

  // Default placeholder image (base64 encoded)
  const defaultPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiNEMUQ1REIiLz4KPHRleHQgeD0iMTAwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzlDQTNBRiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg=='

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }))
  }

  const handleDelete = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      const result = await deleteProduct(
        () => api.products.delete(productId),
        'Product deleted successfully'
      )
      if (result.success) {
        refetch()
      }
    }
  }

  const getStatusBadge = (product) => {
    if (!product.isActive) return 'status-danger'
    if (product.stock === 0) return 'status-warning'
    if (product.stock < 10) return 'status-warning'
    return 'status-success'
  }

  const getStatusText = (product) => {
    if (!product.isActive) return 'Inactive'
    if (product.stock === 0) return 'Out of Stock'
    if (product.stock < 10) return 'Low Stock'
    return 'In Stock'
  }

  // Enhanced ProductCard with proper image handling
  const ProductCard = ({ product }) => {
    const validImages = product.images?.filter(img => img.url && !img.url.includes('placeholder')) || []
    const imageUrl = validImages.length > 0 ? getImageUrl(validImages[0].url) : null

    return (
      <div className="product-card">
        <div className="product-card-image">
          <img
            src={imageUrl || defaultPlaceholder}
            alt={product.name}
            className="product-image"
            onError={(e) => {
              console.log('❌ ProductCard image failed to load:', imageUrl)
              e.target.src = defaultPlaceholder
            }}
            onLoad={() => {
              if (imageUrl) {
                console.log('✅ ProductCard image loaded successfully:', imageUrl)
              }
            }}
          />
          {product.isFeatured && (
            <span className="featured-badge">
              <Star className="featured-icon" />
              Featured
            </span>
          )}
          <span className={`status-badge ${getStatusBadge(product)}`}>
            {getStatusText(product)}
          </span>
        </div>
        <div className="product-card-body">
          <h3 className="product-title">{product.name}</h3>
          <p className="product-description">{product.description}</p>
          
          <div className="product-info">
            <div className="price-info">
              <p className="product-price">₹{product.price.toLocaleString('en-IN')}</p>
              <p className="product-stock">Stock: {product.stock}</p>
            </div>
            <div className="rating-info">
              <div className="rating-display">
                <Star className="rating-star" />
                {product.averageRating || 0}
              </div>
              <p className="rating-count">{product.totalReviews || 0} reviews</p>
            </div>
          </div>

          <div className="product-actions">
            <Link
              to={`/products/edit/${product._id}`}
              className="action-btn edit-btn"
            >
              <Edit className="action-icon" />
              Edit
            </Link>
            <button
              onClick={() => handleDelete(product._id, product.name)}
              disabled={deleting}
              className="action-btn delete-btn"
            >
              <Trash2 className="action-icon" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Enhanced ProductRow with proper image handling
  const ProductRow = ({ product }) => {
    const validImages = product.images?.filter(img => img.url && !img.url.includes('placeholder')) || []
    const imageUrl = validImages.length > 0 ? getImageUrl(validImages[0].url) : null

    return (
      <tr className="product-row">
        <td className="product-cell">
          <div className="product-info-cell">
            <img
              src={imageUrl || defaultPlaceholder}
              alt={product.name}
              className="product-thumbnail"
              onError={(e) => {
                console.log('❌ ProductRow image failed to load:', imageUrl)
                e.target.src = defaultPlaceholder
              }}
              onLoad={() => {
                if (imageUrl) {
                  console.log('✅ ProductRow image loaded successfully:', imageUrl)
                }
              }}
            />
            <div className="product-details">
              <p className="product-name">{product.name}</p>
              <p className="product-sku">SKU: {product.sku}</p>
            </div>
          </div>
        </td>
        <td className="category-cell">
          <span className="category-text">
            {product.category?.name}
          </span>
        </td>
        <td className="price-cell">
          <span className="price-text">₹{product.price.toLocaleString('en-IN')}</span>
        </td>
        <td className="stock-cell">
          <span className={`stock-text ${product.stock < 10 ? 'stock-low' : ''}`}>
            {product.stock}
            {product.stock < 10 && product.stock > 0 && (
              <AlertTriangle className="stock-warning-icon" />
            )}
          </span>
        </td>
        <td className="status-cell">
          <span className={`status-badge ${getStatusBadge(product)}`}>
            {getStatusText(product)}
          </span>
        </td>
        <td className="rating-cell">
          <div className="rating-display">
            <Star className="rating-star" />
            {product.averageRating || 0} ({product.totalReviews || 0})
          </div>
        </td>
        <td className="actions-cell">
          <div className="table-actions">
            <Link
              to={`/products/edit/${product._id}`}
              className="action-btn edit-btn"
            >
              <Edit className="action-icon" />
            </Link>
            <button
              onClick={() => handleDelete(product._id, product.name)}
              disabled={deleting}
              className="action-btn delete-btn"
            >
              <Trash2 className="action-icon" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="products-container">
      {/* Header */}
      <div className="products-header">
        <div className="header-info">
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">
            Manage your product catalog
          </p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              onClick={() => setViewMode('grid')}
              className={`view-btn ${viewMode === 'grid' ? 'view-btn-active' : 'view-btn-inactive'}`}
            >
              <Grid className="view-icon" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`view-btn ${viewMode === 'list' ? 'view-btn-active' : 'view-btn-inactive'}`}
            >
              <List className="view-icon" />
            </button>
          </div>
          <Link to="/products/new" className="add-product-btn">
            <Plus className="add-icon" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">Search Products</label>
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                className="search-input"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Category</label>
            <select
              className="filter-select"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories?.data?.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              className="filter-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="sold-out">Out of Stock</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Featured</label>
            <select
              className="filter-select"
              value={filters.featured}
              onChange={(e) => handleFilterChange('featured', e.target.value)}
            >
              <option value="">All Products</option>
              <option value="true">Featured Only</option>
              <option value="false">Non-Featured</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="products-card">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
          </div>
        ) : data?.data?.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="products-grid">
                {data.data.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="products-table-container">
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((product) => (
                      <ProductRow key={product._id} product={product} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {data.pagination && data.pagination.pages > 1 && (
              <div className="pagination-container">
                <p className="pagination-info">
                  Showing {((filters.page - 1) * filters.limit) + 1} to{' '}
                  {Math.min(filters.page * filters.limit, data.pagination.total)} of{' '}
                  {data.pagination.total} results
                </p>
                <div className="pagination-controls">
                  <button
                    onClick={() => handleFilterChange('page', filters.page - 1)}
                    disabled={filters.page === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="page-info">
                    Page {filters.page} of {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                    disabled={filters.page >= data.pagination.pages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <Package className="empty-icon" />
            <p className="empty-title">No products found</p>
            <p className="empty-description">
              {filters.search || filters.category || filters.status 
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by adding your first product.'
              }
            </p>
            <Link to="/products/new" className="empty-action-btn">
              <Plus className="empty-action-icon" />
              Add Your First Product
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Products
