const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();


const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const User = require('../models/User');
      req.user = await User.findById(decoded.id).select('-password');
    }
    
    next();
  } catch (error) {
    
    next();
  }
};


router.post('/create-session', optionalAuth, async (req, res) => {
  try {
    const { cartItems, email, guestEmail } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }


    const customerEmail = req.user?.email || guestEmail || email;

    if (!customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for checkout'
      });
    }

   
    const lineItems = cartItems.map(item => ({
      price_data: {
        currency: 'inr', 
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          description: item.description || `Size: ${item.selectedSize}, Color: ${item.selectedColor}`,
        },
        unit_amount: Math.round(item.price * 100), 
      },
      quantity: item.quantity || 1,
    }));


    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      client_reference_id: req.user?._id?.toString() || 'guest-' + Date.now(),
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart`,
      metadata: {
        userId: req.user?._id?.toString() || 'guest',
      },
    });

    console.log('✅ Checkout session created:', session.id);

    res.status(200).json({
      success: true,
      message: 'Checkout session created',
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create checkout session'
    });
  }
});


router.get('/verify-payment', async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      console.log('✅ Payment verified:', session_id);
      res.status(200).json({
        success: true,
        message: 'Payment verified',
        paymentStatus: 'paid',
        amount: session.amount_total,
        email: session.customer_email,
      });
    } else {
      res.status(200).json({
        success: false,
        message: 'Payment not completed',
        paymentStatus: session.payment_status,
      });
    }
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment'
    });
  }
});

module.exports = router;
