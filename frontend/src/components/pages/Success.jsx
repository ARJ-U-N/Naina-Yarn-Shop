import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import './Success.css'

const Success = () => {
  const [searchParams] = useSearchParams()
  const [orderStatus, setOrderStatus] = useState('loading')
  const [orderDetails, setOrderDetails] = useState(null)
  const [error, setError] = useState(null)
  const { clearCart } = useCart()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setOrderStatus('error')
      setError('No session ID found')
      return
    }

   
    const verifyPayment = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/checkout/verify-payment?session_id=${sessionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })

        const data = await response.json()

        if (data.success && data.paymentStatus === 'paid') {
          console.log('✅ Payment verified successfully')
          setOrderStatus('success')
          setOrderDetails({
            sessionId: sessionId,
            amount: data.amount ? (data.amount / 100).toFixed(2) : 'N/A',
            email: data.email || localStorage.getItem('user')?.email,
            date: new Date().toLocaleDateString(),
          })
          
          
          clearCart()
          
          
          localStorage.setItem('lastOrder', JSON.stringify({
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            amount: data.amount,
          }))
        } else {
          console.error('Payment not completed:', data)
          setOrderStatus('error')
          setError(data.message || 'Payment was not completed')
        }
      } catch (err) {
        console.error('❌ Error verifying payment:', err)
        setOrderStatus('error')
        setError(err.message || 'Failed to verify payment')
      }
    }

    verifyPayment()
  }, [sessionId, clearCart])

  const handleContinueShopping = () => {
    navigate('/')
  }

  const handleViewOrders = () => {
    navigate('/orders')
  }

  if (orderStatus === 'loading') {
    return (
      <div className="success-page">
        <div className="success-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <h1>Processing Your Order...</h1>
          <p>Please wait while we verify your payment</p>
        </div>
      </div>
    )
  }

  if (orderStatus === 'error') {
    return (
      <div className="success-page error-page">
        <div className="success-container">
          <div className="error-icon">❌</div>
          <h1>Payment Failed</h1>
          <p className="error-message">{error || 'There was an issue processing your order'}</p>
          <p className="error-note">Please try again or contact our support team</p>
          
          <div className="action-buttons">
            <button onClick={handleContinueShopping} className="btn btn-primary">
              Back to Shopping
            </button>
            <a href="mailto:support@naina.com" className="btn btn-secondary">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-icon">✅</div>
        
        <h1>Thank You for Your Order!</h1>
        <p className="success-message">Your payment was successful</p>

        {orderDetails && (
          <div className="order-details">
            <div className="detail-item">
              <span className="detail-label">Order ID:</span>
              <span className="detail-value">{orderDetails.sessionId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Amount:</span>
              <span className="detail-value">₹{orderDetails.amount}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{orderDetails.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{orderDetails.date}</span>
            </div>
          </div>
        )}

        <div className="success-info">
          <p>📧 A confirmation email has been sent to your registered email address</p>
          <p>🚚 You can track your order status from your account</p>
          <p>💬 Need help? Contact our support team</p>
        </div>

        <div className="action-buttons">
          <button onClick={handleContinueShopping} className="btn btn-primary">
            Continue Shopping
          </button>
          <button onClick={handleViewOrders} className="btn btn-secondary">
            View My Orders
          </button>
        </div>
      </div>
    </div>
  )
}

export default Success
