import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { productsAPI, categoriesAPI } from '../services/api'
import './CategoryPage.css'

const CategoryPage = () => {
  const { categoryId } = useParams()
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Filter and sort state
  const [sortBy, setSortBy] = useState('Best selling')
  const [filterOpen, setFilterOpen] = useState(false)
  const [availability, setAvailability] = useState('All')
  const [priceRange, setPriceRange] = useState('All')
  const [color, setColor] = useState('All')
  
  // Import cart functionality
  const { addToCart, loading: cartLoading } = useCart()

  // Fallback data for when API fails
  const fallbackCategoryData = {
    'baby-blanket': {
      title: 'Baby Blanket',
      products: [
        {
          id: 1,
          name: 'Blanket: Jungle Safari (New Born)',
          price: 7000,
          image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&h=400&fit=crop',
          status: 'available'
        },
        {
          id: 2,
          name: 'Blanket: Teddy (Made to Order)',
          price: 5000,
          image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop',
          status: 'available'
        },
        {
          id: 3,
          name: 'Blanket: Joy of Jungle (Toddler)',
          price: 9000,
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
          status: 'sold-out'
        },
        {
          id: 4,
          name: 'Blanket: Bunny (Made to Order)',
          price: 6000,
          image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&h=400&fit=crop',
          status: 'available'
        }
      ]
    },
    'baby-set': {
      title: 'Baby Set',
      products: [
        {
          id: 5,
          name: 'Baby Set: Pink Bunny Collection',
          price: 3500,
          image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop',
          status: 'available'
        },
        {
          id: 6,
          name: 'Baby Set: Blue Ocean Theme',
          price: 4000,
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
          status: 'available'
        }
      ]
    },
    'babywear': {
      title: 'Babywear',
      products: [
        {
          id: 7,
          name: 'Babywear: Knitted Cardigan',
          price: 2500,
          image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop',
          status: 'available'
        },
        {
          id: 8,
          name: 'Babywear: Cute Animal Sweater',
          price: 3000,
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
          status: 'available'
        }
      ]
    }
  }

  // Fetch products from backend
  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true)
      try {
        const params = { limit: 50 }

        if (sortBy === 'Price: Low to High') params.sort = 'price'
        if (sortBy === 'Price: High to Low') params.sort = '-price'
        if (sortBy === 'Newest') params.sort = '-createdAt'

        if (availability === 'Available') params.status = 'available'
        if (availability === 'Sold Out') params.status = 'sold-out'

        if (priceRange === 'Under 3000') params.maxPrice = 3000
        if (priceRange === '3000-6000') {
          params.minPrice = 3000
          params.maxPrice = 6000
        }
        if (priceRange === 'Above 6000') params.minPrice = 6000

        const productsResponse = await productsAPI.getByCategory(categoryId, params)
        
        if (productsResponse.data.success) {
          const backendProducts = productsResponse.data.data.map(product => ({
            id: product._id,
            _id: product._id, // Keep both for compatibility
            name: product.name,
            price: product.price,
            image: product.images?.[0]?.url || 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&h=400&fit=crop',
            status: product.status === 'sold-out' ? 'sold-out' : 'available',
            colors: product.colors,
            stock: product.stock,
            images: product.images // Keep full images array
          }))
          
          setProducts(backendProducts)
          setCategory({
            title: productsResponse.data.category?.name || categoryId.replace('-', ' ')
          })
        } else {
          throw new Error('No products found')
        }

      } catch (error) {
        console.error('Error fetching category data:', error)
        const fallbackCategory = fallbackCategoryData[categoryId] || { title: 'Category', products: [] }
        setProducts(fallbackCategory.products)
        setCategory({ title: fallbackCategory.title })
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryData()
  }, [categoryId, sortBy, availability, priceRange, color])

  // FIXED Add to cart handler
  const handleAddToCart = async (product) => {
    if (product.status !== 'sold-out') {
      console.log('Adding product to cart:', product) // Debug log

      // Create proper product object that matches CartContext expectations
      const productData = {
        _id: product.id || product._id,
        id: product.id || product._id,
        name: product.name,
        price: product.price,
        images: product.images || [{ url: product.image }],
        image: product.image,
        colors: product.colors || [],
        status: product.status,
        stock: product.stock
      }

      try {
        // Call addToCart with correct parameters: (product, quantity, selectedColor, selectedSize)
        await addToCart(
          productData,                    // Full product object
          1,                             // quantity
          product.colors?.[0] || null,   // selectedColor
          null                           // selectedSize
        )
        
        console.log('Product added successfully')
      } catch (error) {
        console.error('Error adding product to cart:', error)
      }
    }
  }

  // Filter products locally
  const filteredProducts = products.filter(product => {
    if (availability === 'Available' && product.status === 'sold-out') return false
    if (availability === 'Sold Out' && product.status !== 'sold-out') return false
    
    if (priceRange === 'Under 3000' && product.price >= 3000) return false
    if (priceRange === '3000-6000' && (product.price < 3000 || product.price > 6000)) return false
    if (priceRange === 'Above 6000' && product.price <= 6000) return false
    
    return true
  })

  // Sort products locally
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'Price: Low to High') return a.price - b.price
    if (sortBy === 'Price: High to Low') return b.price - a.price
    return 0
  })

  const handleApplyFilters = () => {
    setFilterOpen(false)
  }

  const handleRemoveAllFilters = () => {
    setAvailability('All')
    setPriceRange('All')
    setColor('All')
    setSortBy('Best selling')
  }

  return (
    <section className="category-page">
      <div className="container">
        
        <h1 className="category-title">
          {loading ? 'Loading...' : category?.title || 'Products'}
        </h1>
        
        {/* Desktop Filter Bar */}
        <div className="filter-bar desktop-only">
          <div className="filter-section">
            <span className="filter-label">Filter:</span>
            
            <div className="filter-group">
              <label htmlFor="availability">Availability</label>
              <div className="select-wrapper">
                <select 
                  id="availability" 
                  value={availability} 
                  onChange={(e) => setAvailability(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Available">Available</option>
                  <option value="Sold Out">Sold Out</option>
                </select>
                <svg className="dropdown-arrow" width="12" height="8" viewBox="0 0 12 8">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="filter-group">
              <label htmlFor="price">Price</label>
              <div className="select-wrapper">
                <select 
                  id="price" 
                  value={priceRange} 
                  onChange={(e) => setPriceRange(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Under 3000">Under ₹3,000</option>
                  <option value="3000-6000">₹3,000 - ₹6,000</option>
                  <option value="Above 6000">Above ₹6,000</option>
                </select>
                <svg className="dropdown-arrow" width="12" height="8" viewBox="0 0 12 8">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div className="filter-group">
              <label htmlFor="color">Color</label>
              <div className="select-wrapper">
                <select 
                  id="color" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Multicolor">Multicolor</option>
                  <option value="Pink">Pink</option>
                  <option value="Blue">Blue</option>
                  <option value="White">White</option>
                </select>
                <svg className="dropdown-arrow" width="12" height="8" viewBox="0 0 12 8">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="sort-section">
            <span className="sort-label">Sort by:</span>
            <div className="select-wrapper">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option>Best selling</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
              </select>
              <svg className="dropdown-arrow" width="12" height="8" viewBox="0 0 12 8">
                <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <div className="product-count">
              {sortedProducts.length} products
            </div>
          </div>
        </div>

        {/* Mobile Filter Button */}
        <div className="mobile-filter-bar mobile-only">
          <button 
            className="filter-trigger-btn" 
            onClick={() => setFilterOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Filter and sort
          </button>
          <div className="mobile-product-count">
            {sortedProducts.length} products
          </div>
        </div>

        {/* Mobile Filter Modal */}
        {filterOpen && (
          <div className="filter-modal-overlay" onClick={() => setFilterOpen(false)}>
            <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
              <div className="filter-modal-header">
                <h3>Filter and sort</h3>
                <button 
                  className="close-modal" 
                  onClick={() => setFilterOpen(false)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="filter-modal-content">
                <div className="product-count-header">
                  {sortedProducts.length} products
                </div>

                <div className="filter-section-mobile">
                  <div className="filter-item">
                    <label className="filter-item-label">
                      Availability
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </label>
                    <select 
                      value={availability} 
                      onChange={(e) => setAvailability(e.target.value)}
                      className="filter-select"
                    >
                      <option value="All">All</option>
                      <option value="Available">Available</option>
                      <option value="Sold Out">Sold Out</option>
                    </select>
                  </div>

                  <div className="filter-item">
                    <label className="filter-item-label">
                      Price
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </label>
                    <select 
                      value={priceRange} 
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="filter-select"
                    >
                      <option value="All">All</option>
                      <option value="Under 3000">Under ₹3,000</option>
                      <option value="3000-6000">₹3,000 - ₹6,000</option>
                      <option value="Above 6000">Above ₹6,000</option>
                    </select>
                  </div>

                  <div className="filter-item">
                    <label className="filter-item-label">
                      Color
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </label>
                    <select 
                      value={color} 
                      onChange={(e) => setColor(e.target.value)}
                      className="filter-select"
                    >
                      <option value="All">All</option>
                      <option value="Multicolor">Multicolor</option>
                      <option value="Pink">Pink</option>
                      <option value="Blue">Blue</option>
                      <option value="White">White</option>
                    </select>
                  </div>

                  <div className="filter-item">
                    <label className="filter-item-label">
                      Sort by:
                    </label>
                    <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="filter-select"
                    >
                      <option>Best selling</option>
                      <option>Price: Low to High</option>
                      <option>Price: High to Low</option>
                      <option>Newest</option>
                    </select>
                  </div>
                </div>

                <div className="filter-modal-footer">
                  <button 
                    className="remove-all-btn" 
                    onClick={handleRemoveAllFilters}
                  >
                    Remove all
                  </button>
                  <button 
                    className="apply-filters-btn" 
                    onClick={handleApplyFilters}
                  >
                    Apply filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="product-grid">
          {loading ? (
            Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="product-card loading">
                <div className="product-image">
                  <div className="loading-placeholder"></div>
                </div>
                <div className="product-info">
                  <div className="loading-text"></div>
                  <div className="loading-text short"></div>
                </div>
                <div className="loading-text button"></div>
              </div>
            ))
          ) : (
            sortedProducts.map(product => (
              <div key={product.id} className="product-card">
                {/* Make the image clickable and link to product detail */}
                <Link to={`/product/${product.id}`} className="product-image-link">
                  <div className="product-image">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&h=400&fit=crop'
                      }}
                    />
                    {product.status === 'sold-out' && (
                      <div className="sold-out-badge">Sold out</div>
                    )}
                  </div>
                </Link>
                
                <div className="product-info">
                  {/* Make the product name clickable */}
                  <Link to={`/product/${product.id}`} className="product-name-link">
                    <h3 className="product-name">{product.name}</h3>
                  </Link>
                  <p className="product-price">AED {product.price.toLocaleString()}</p>
                </div>
                
                <button 
                  className={`product-btn ${product.status === 'sold-out' ? 'sold-out' : ''}`}
                  disabled={product.status === 'sold-out' || cartLoading}
                  onClick={() => handleAddToCart(product)}
                >
                  {product.status === 'sold-out' ? 'Sold out' : 
                   cartLoading ? 'Adding...' : 'ADD TO CART'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default CategoryPage
