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
  const [customerEmail, setCustomerEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  })
  const [phoneNumber, setPhoneNumber] = useState('')
  const [formErrors, setFormErrors] = useState({})

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

  
  const validateForm = () => {
    const errors = {}
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const emailForCheckout = user?.email || customerEmail
    if (!emailForCheckout || !emailForCheckout.includes('@')) {
      errors.email = 'Please enter a valid email address'
    }
    if (!shippingAddress.street.trim()) errors.street = 'Street address is required'
    if (!shippingAddress.city.trim()) errors.city = 'City is required'
    if (!shippingAddress.state.trim()) errors.state = 'State is required'
    if (!shippingAddress.zipCode.trim()) errors.zipCode = 'ZIP / PIN code is required'
    if (!shippingAddress.country.trim()) errors.country = 'Country is required'
    if (!phoneNumber.trim()) errors.phone = 'Phone number is required'
    return errors
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty!')
      return
    }

    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      if (errors.email) setEmailError(errors.email)
      return
    }

    setFormErrors({})
    setEmailError('')
    setIsCheckingOut(true)

    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const emailForCheckout = user?.email || customerEmail

    const fullShippingAddress = {
      name: user?.name || 'Customer',
      street: shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zipCode: shippingAddress.zipCode,
      country: shippingAddress.country,
      phone: phoneNumber
    }

    try {
      // --- COD Flow ---
      if (paymentMethod === 'cod') {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') && {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            })
          },
          body: JSON.stringify({
            shippingAddress: fullShippingAddress,
            phone_number: phoneNumber,
            payment_method: 'cod',
            specialInstructions
          })
        })
        const data = await response.json()
        if (data.success) {
          window.location.href = '/success?method=cod&order=' + data.data?.orderNumber
        } else {
          alert('Error placing order: ' + (data.message || 'Unknown error'))
          setIsCheckingOut(false)
        }
        return
      }

      // --- Stripe Card Flow ---
      const checkoutItems = cartItems.map(item => ({
        name: getSafeName(item),
        price: getSafePrice(item),
        quantity: item.quantity || 1,
        image: getSafeImage(item),
        description: `Size: ${item.selectedSize || 'N/A'}, Color: ${item.selectedColor || 'N/A'}`,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
      }))

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/checkout/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        },
        body: JSON.stringify({
          cartItems: checkoutItems,
          guestEmail: emailForCheckout,
          shippingAddress: fullShippingAddress,
          phoneNumber,
          specialInstructions
        }),
      })

      const data = await response.json()

      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        alert('Error creating checkout session: ' + (data.message || 'Unknown error'))
        setIsCheckingOut(false)
      }
    } catch (error) {
      console.error('Error during checkout:', error)
      alert('Failed to proceed to checkout. Please try again.')
      setIsCheckingOut(false)
    }
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
                    <p className="featured-price">AED {product.price.toLocaleString()}</p>
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
                      <p className="product-price">AED {itemPrice.toLocaleString()}</p>
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
                    <span className="item-total">AED {(itemPrice * itemQuantity).toLocaleString()}</span>
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
              {/* Email Input for Guest Users */}
              {!JSON.parse(localStorage.getItem('user') || '{}')?.email && (
                <div className="email-section">
                  <label className="email-label">📧 Email Address *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value)
                      setEmailError('')
                      setFormErrors(prev => ({ ...prev, email: '' }))
                    }}
                    placeholder="Enter your email for order confirmation"
                    className={`email-input ${emailError ? 'error' : ''}`}
                    required
                  />
                  {emailError && <p className="email-error">{emailError}</p>}
                </div>
              )}

              {/* Shipping Address */}
              <div className="shipping-form-section">
                <h3 className="shipping-form-title">📦 Shipping Address</h3>
                <div className="shipping-form-grid">
                  <div className="form-field full-width">
                    <label>Street Address *</label>
                    <input
                      type="text"
                      value={shippingAddress.street}
                      onChange={(e) => {
                        setShippingAddress(prev => ({ ...prev, street: e.target.value }))
                        setFormErrors(prev => ({ ...prev, street: '' }))
                      }}
                      placeholder="123 Main St, Apt 4B"
                      className={`checkout-field ${formErrors.street ? 'field-error' : ''}`}
                    />
                    {formErrors.street && <p className="field-error-msg">{formErrors.street}</p>}
                  </div>
                  <div className="form-field">
                    <label>City *</label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => {
                        setShippingAddress(prev => ({ ...prev, city: e.target.value }))
                        setFormErrors(prev => ({ ...prev, city: '' }))
                      }}
                      placeholder="Dubai"
                      className={`checkout-field ${formErrors.city ? 'field-error' : ''}`}
                    />
                    {formErrors.city && <p className="field-error-msg">{formErrors.city}</p>}
                  </div>
                  <div className="form-field">
                    <label>State / Emirate *</label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => {
                        setShippingAddress(prev => ({ ...prev, state: e.target.value }))
                        setFormErrors(prev => ({ ...prev, state: '' }))
                      }}
                      placeholder="Dubai"
                      className={`checkout-field ${formErrors.state ? 'field-error' : ''}`}
                    />
                    {formErrors.state && <p className="field-error-msg">{formErrors.state}</p>}
                  </div>
                  <div className="form-field">
                    <label>ZIP / PIN Code *</label>
                    <input
                      type="text"
                      value={shippingAddress.zipCode}
                      onChange={(e) => {
                        setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))
                        setFormErrors(prev => ({ ...prev, zipCode: '' }))
                      }}
                      placeholder="00000"
                      className={`checkout-field ${formErrors.zipCode ? 'field-error' : ''}`}
                    />
                    {formErrors.zipCode && <p className="field-error-msg">{formErrors.zipCode}</p>}
                  </div>
                  <div className="form-field full-width">
                    <label>Country *</label>
                    <input
                      type="text"
                      value={shippingAddress.country}
                      onChange={(e) => {
                        setShippingAddress(prev => ({ ...prev, country: e.target.value }))
                        setFormErrors(prev => ({ ...prev, country: '' }))
                      }}
                      placeholder="United Arab Emirates"
                      className={`checkout-field ${formErrors.country ? 'field-error' : ''}`}
                    />
                    {formErrors.country && <p className="field-error-msg">{formErrors.country}</p>}
                  </div>
                  <div className="form-field full-width">
                    <label>📞 Phone Number *</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value)
                        setFormErrors(prev => ({ ...prev, phone: '' }))
                      }}
                      placeholder="+971 50 000 0000"
                      className={`checkout-field ${formErrors.phone ? 'field-error' : ''}`}
                    />
                    {formErrors.phone && <p className="field-error-msg">{formErrors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="payment-method-section">
                <h3 className="payment-method-title">💳 Payment Method</h3>
                <div className="payment-options">
                  <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <span className="payment-option-icon">💳</span>
                    <div>
                      <span className="payment-option-label">Pay with Card (Stripe)</span>
                      <span className="payment-option-desc">Secure online payment via Stripe</span>
                    </div>
                  </label>
                  <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                    />
                    <span className="payment-option-icon">🚚</span>
                    <div>
                      <span className="payment-option-label">Cash on Delivery (COD)</span>
                      <span className="payment-option-desc">Pay when your order arrives</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="subtotal">
                <span>Subtotal</span>
                <span>AED {cartTotal.toLocaleString()}</span>
              </div>
              <p className="shipping-note">
                Taxes and <Link to="/shipping">shipping</Link> calculated at checkout
              </p>
              <button 
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={isCheckingOut || loading || cartItems.length === 0}
              >
                {isCheckingOut
                  ? 'Processing...'
                  : loading
                  ? 'Updating...'
                  : paymentMethod === 'cod'
                  ? '🚚 Place COD Order'
                  : '💳 Proceed to Payment'}
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
                  <p className="featured-price">AED {product.price.toLocaleString()}</p>
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
