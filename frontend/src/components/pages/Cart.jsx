import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { productsAPI } from '../services/api'
import './Cart.css'

const Cart = () => {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    getCartTotal, 
    loading, 
    error,
    clearCart 
  } = useCart()
  
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [featuredProducts, setFeaturedProducts] = useState([])

  // Fallback featured products
  const fallbackFeaturedProducts = [
    {
      id: 'featured-1',
      name: 'Baby: Giraffe Set',
      price: 3000,
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&h=300&fit=crop',
      status: 'available'
    },
    {
      id: 'featured-2',
      name: 'Baby: Braids & Roses Hat',
      price: 1000,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
      status: 'sold-out'
    },
    {
      id: 'featured-3',
      name: 'Baby: Adventurer Hat',
      price: 900,
      image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=300&h=300&fit=crop',
      status: 'sold-out'
    },
    {
      id: 'featured-4',
      name: 'Baby: Bunny set (Made to Order)',
      price: 8000,
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&h=300&fit=crop',
      status: 'available'
    }
  ]

  // Fetch featured products from backend
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await productsAPI.getAll({ featured: 'true', limit: 4 })
        if (response.data.success && response.data.data.length > 0) {
          const backendFeatured = response.data.data.map(product => ({
            id: product._id,
            name: product.name,
            price: product.price,
            image: product.images?.[0]?.url || 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=300&h=300&fit=crop',
            status: product.status === 'sold-out' ? 'sold-out' : 'available'
          }))
          setFeaturedProducts(backendFeatured)
        } else {
          setFeaturedProducts(fallbackFeaturedProducts)
        }
      } catch (error) {
        console.error('Error fetching featured products:', error)
        setFeaturedProducts(fallbackFeaturedProducts)
      }
    }

    fetchFeaturedProducts()
  }, [])

  // Fixed quantity change handler to match CartContext signature
  const handleQuantityChange = (productId, newQuantity, selectedColor = null, selectedSize = null) => {
    updateQuantity(productId, newQuantity, selectedColor, selectedSize)
  }

  // Enhanced checkout handler
  const handleCheckout = () => {
    setIsCheckingOut(true)
    setTimeout(() => {
      alert('Checkout functionality would be implemented here!')
      setIsCheckingOut(false)
    }, 1000)
  }

  // Helper function to get safe price value
  const getSafePrice = (item) => {
    return item?.price || item?.product?.price || 0
  }

  // Helper function to get safe name
  const getSafeName = (item) => {
    return item?.name || item?.product?.name || 'Unknown Product'
  }

  // Helper function to get safe image
  const getSafeImage = (item) => {
    return item?.image || 
           item?.product?.images?.[0]?.url || 
           'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=300&h=300&fit=crop'
  }

  // Helper function to get safe ID
  const getSafeId = (item) => {
    return item?.id || item?.product?._id || item?.productId || 'unknown'
  }

  // Show error if cart loading failed
  if (error) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-error">
            <p>Error loading cart: {error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading && (!cartItems || cartItems.length === 0)) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-header">
            <h1>Your cart</h1>
            <Link to="/" className="continue-shopping">Continue shopping</Link>
          </div>
          <div className="cart-loading">
            <div className="loading-spinner"></div>
            <p>Loading your cart...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-header">
            <h1>Your cart</h1>
            <Link to="/" className="continue-shopping">Continue shopping</Link>
          </div>
          
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 3H5L5.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V17A2 2 0 0115 19H9A2 2 0 017 17V13"/>
              </svg>
            </div>
            <h2>Your cart is currently empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/" className="continue-shopping-btn">Continue Shopping</Link>
          </div>

          {/* Featured Collection */}
          <section className="featured-collection">
            <h2 className="featured-title">Featured collection</h2>
            <div className="featured-grid">
              {featuredProducts.map(product => (
                <Link key={product.id} to={`/product/${product.id}`} className="featured-product">
                  <div className="featured-image">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=300&h=300&fit=crop'
                      }}
                    />
                    {product.status === 'sold-out' && (
                      <div className="sold-out-badge">Sold out</div>
                    )}
                  </div>
                  <div className="featured-info">
                    <h3>{product.name}</h3>
                    <p className="featured-price">Rs. {product.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="view-all-container">
              <Link to="/" className="view-all-btn">View all</Link>
            </div>
          </section>
        </div>
      </div>
    )
  }

  // Calculate total safely
  const cartTotal = getCartTotal()

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Your cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</h1>
          <Link to="/" className="continue-shopping">Continue shopping</Link>
        </div>

        <div className="cart-content">
          <div className="cart-table-container">
            <div className="cart-table-header">
              <div className="header-product">PRODUCT</div>
              <div className="header-quantity">QUANTITY</div>
              <div className="header-total">TOTAL</div>
            </div>

            {/* Map cart items with proper data extraction */}
            {cartItems.map(item => {
              const itemId = getSafeId(item)
              const itemName = getSafeName(item)
              const itemPrice = getSafePrice(item)
              const itemImage = getSafeImage(item)
              const itemQuantity = item?.quantity || 1

              console.log('Cart Item:', item) // Debug log

              return (
                <div key={itemId} className="cart-item">
                  <div className="cart-product">
                    <Link to={`/product/${itemId}`} className="product-image-link">
                      <img 
                        src={itemImage}
                        alt={itemName}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=300&h=300&fit=crop'
                        }}
                      />
                    </Link>
                    <div className="product-details">
                      <Link to={`/product/${itemId}`} className="product-name-link">
                        <h3>{itemName}</h3>
                      </Link>
                      <p className="product-price">Rs. {itemPrice.toLocaleString()}</p>
                      {/* Show selected options if available */}
                      {item.selectedColor && <p className="selected-option">Color: {item.selectedColor}</p>}
                      {item.selectedSize && <p className="selected-option">Size: {item.selectedSize}</p>}
                    </div>
                  </div>

                  <div className="cart-quantity">
                    <div className="quantity-controls">
                      <button 
                        onClick={() => handleQuantityChange(itemId, itemQuantity - 1, item.selectedColor, item.selectedSize)}
                        className="quantity-btn"
                        disabled={itemQuantity <= 1 || loading}
                      >
                        −
                      </button>
                      <input 
                        type="number" 
                        value={itemQuantity} 
                        onChange={(e) => handleQuantityChange(itemId, parseInt(e.target.value) || 1, item.selectedColor, item.selectedSize)}
                        className="quantity-input"
                        min="1"
                        disabled={loading}
                      />
                      <button 
                        onClick={() => handleQuantityChange(itemId, itemQuantity + 1, item.selectedColor, item.selectedSize)}
                        className="quantity-btn"
                        disabled={loading}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-total">
                    <span className="item-total">Rs. {(itemPrice * itemQuantity).toLocaleString()}</span>
                    <button 
                      onClick={() => removeFromCart(itemId, item.selectedColor, item.selectedSize)}
                      className="remove-btn"
                      title="Remove item"
                      disabled={loading}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="cart-summary">
            <div className="special-instructions">
              <h3>Order special instructions</h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Enter any special requests for your order..."
                rows="4"
              />
            </div>

            <div className="order-summary">
              <div className="subtotal">
                <span>Subtotal</span>
                <span>Rs. {cartTotal.toLocaleString()}</span>
              </div>
              <p className="shipping-note">
                Taxes and <Link to="/shipping">shipping</Link> calculated at checkout
              </p>
              <button 
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={isCheckingOut || loading || cartItems.length === 0}
              >
                {isCheckingOut ? 'Processing...' : loading ? 'Updating...' : 'Check out'}
              </button>
              
              {/* Clear Cart Button */}
              <button 
                className="clear-cart-btn"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear your cart?')) {
                    clearCart()
                  }
                }}
                disabled={loading || cartItems.length === 0}
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>

        {/* Featured Collection */}
        <section className="featured-collection">
          <h2 className="featured-title">You might also like</h2>
          <div className="featured-grid">
            {featuredProducts.map(product => (
              <Link key={product.id} to={`/product/${product.id}`} className="featured-product">
                <div className="featured-image">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=300&h=300&fit=crop'
                    }}
                  />
                  {product.status === 'sold-out' && (
                    <div className="sold-out-badge">Sold out</div>
                  )}
                </div>
                <div className="featured-info">
                  <h3>{product.name}</h3>
                  <p className="featured-price">Rs. {product.price.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="view-all-container">
            <Link to="/" className="view-all-btn">View all</Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Cart
