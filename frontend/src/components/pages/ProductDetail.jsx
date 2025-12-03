import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import ImageGallery from './ImageGallery'
import './ProductDetail.css'
import CustomerReviews from '../CustomerReviews'

const ProductDetail = () => {
  const { id } = useParams() // ✅ You're using 'id' here
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showFullscreen, setShowFullscreen] = useState(false)
  
  const { addToCart, loading: cartLoading } = useCart()

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`https://naina-yarn-shop-9nbt.vercel.app/api/products/${id}`)
      const data = await response.json()

      if (data.success) {
        setProduct(data.data)
        if (data.data.colors?.length > 0) {
          setSelectedColor(data.data.colors[0])
        }
        if (data.data.sizes?.length > 0) {
          setSelectedSize(data.data.sizes[0])
        }
      } else {
        setError(data.message || 'Product not found')
      }
    } catch (err) {
      setError('Failed to fetch product')
    } finally {
      setLoading(false)
    }
  }

  // FIXED handleAddToCart function
  const handleAddToCart = async () => {
    if (!product) return

    console.log('Product Detail - Adding to cart:', {
      product,
      quantity,
      selectedColor,
      selectedSize
    }) // Debug log

    // Create the cart item with the correct structure for your CartContext
    const cartItem = {
      _id: product._id,
      id: product._id,
      name: product.name,
      price: product.price,
      images: product.images,
      image: product.images?.[0]?.url,
      colors: product.colors,
      sizes: product.sizes,
      stock: product.stock,
      status: product.stock > 0 ? 'available' : 'sold-out',
      description: product.description
    }

    try {
      // Call addToCart with correct parameters: (product, quantity, selectedColor, selectedSize)
      const success = await addToCart(
        cartItem,           // Full product object
        quantity,           // Selected quantity from state
        selectedColor,      // Selected color from state
        selectedSize        // Selected size from state
      )
      
      if (success !== false) {
        console.log('Added to cart successfully')
        // Optional: Show success notification
        alert(`Added ${quantity} ${cartItem.name} to cart!`)
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add item to cart. Please try again.')
    }
  }

  const handleImageClick = (index) => {
    setActiveImageIndex(index)
    setShowFullscreen(true)
  }

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity)
    }
  }

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading product...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail-error">
        <h2>Product Not Found</h2>
        <p>{error}</p>
        <Link to="/" className="back-home-btn">Back to Home</Link>
      </div>
    )
  }

  const mainImage = product.images?.[activeImageIndex] || product.images?.[0]
  const isOutOfStock = product.stock === 0

  return (
    <div className="product-detail">
      <div className="product-detail-container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">NAINA</Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="product-content">
          {/* Image Gallery */}
          <div className="product-images">
            <div className="main-image-container">
              <img
                src={mainImage?.url}
                alt={mainImage?.alt || product.name}
                className="main-image"
                onClick={() => handleImageClick(activeImageIndex)}
              />
              {product.images?.length > 1 && (
                <div className="image-thumbnails">
                  {product.images.map((image, index) => (
                    <img
                      key={index}
                      src={image.url}
                      alt={image.alt}
                      className={`thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info">
            <div className="product-brand">NAINA</div>
            <h1 className="product-title">{product.name}</h1>
            <div className="product-price">Rs. {product.price.toLocaleString()}</div>
            
            <div className="shipping-info">
              <Link to="#" className="shipping-link">Shipping</Link>
              <span> calculated at checkout.</span>
            </div>

            {/* Color Selection */}
            {product.colors?.length > 0 && (
              <div className="product-options">
                <label className="option-label">Colour</label>
                <div className="color-options">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                      onClick={() => setSelectedColor(color)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes?.length > 0 && (
              <div className="product-options">
                <label className="option-label">Size</label>
                <div className="size-options">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="product-options">
              <label className="option-label">Quantity</label>
              <div className="quantity-selector">
                <button
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="quantity-display">{quantity}</span>
                <button
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Buttons */}
            <div className="product-actions">
              <button
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={isOutOfStock || cartLoading}
              >
                {isOutOfStock ? 'Out of Stock' : cartLoading ? 'Adding...' : 'Add to cart'}
              </button>
              
              <button className="buy-now-btn" disabled={isOutOfStock}>
                Buy it now
              </button>
            </div>

            {/* Product Description */}
            {product.description && (
              <div className="product-description">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>
            )}

            {/* Additional Product Details */}
            <div className="product-details">
              <div className="detail-section">
                <h4>📦 Product Details</h4>
                <ul>
                  <li>✅ Handcrafted with premium quality materials</li>
                  <li>🧼 Easy to wash and maintain</li>
                  <li>🎨 Available in multiple colors</li>
                  <li>📏 Custom sizes available on request</li>
                </ul>
              </div>

              <div className="detail-section">
                <h4>🚚 Shipping Info</h4>
                <ul>
                  <li>📍 Free shipping within India</li>
                  <li>⚡ 3-5 business days delivery</li>
                  <li>📦 Secure packaging guaranteed</li>
                </ul>
              </div>

              <div className="detail-section">
                <h4>🔄 Return Policy</h4>
                <ul>
                  <li>↩️ 7-day return policy</li>
                  <li>💯 100% money back guarantee</li>
                  <li>📞 24/7 customer support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ FIXED: Customer Reviews Section - Use 'id' instead of 'productId' */}
        <CustomerReviews productId={id} />
      </div>

      {/* Fullscreen Image Modal */}
      {showFullscreen && (
        <ImageGallery
          images={product.images}
          initialIndex={activeImageIndex}
          onClose={() => setShowFullscreen(false)}
        />
      )}
    </div>
  )
}

export default ProductDetail
