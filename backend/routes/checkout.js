const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');


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
    const { cartItems, email, guestEmail, shippingAddress, phoneNumber, specialInstructions } = req.body;

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
        currency: 'aed',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          description: item.description || `Size: ${item.selectedSize}, Color: ${item.selectedColor}`,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity || 1,
    }));

    // Add flat 10 AED shipping fee as a separate Stripe line item
    lineItems.push({
      price_data: {
        currency: 'aed',
        product_data: {
          name: 'Shipping',
          description: 'Flat rate shipping fee',
        },
        unit_amount: 1000, // 10 AED in fils (smallest currency unit)
      },
      quantity: 1,
    });

    // Stripe metadata values must be strings
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
        customerEmail: customerEmail,
        itemCount: String(cartItems.length),
        // Shipping details threaded through so verify-payment can use real data
        shippingName:    shippingAddress?.name    || '',
        shippingStreet:  shippingAddress?.street  || '',
        shippingCity:    shippingAddress?.city    || '',
        shippingState:   shippingAddress?.state   || '',
        shippingZip:     shippingAddress?.zipCode || '',
        shippingCountry: shippingAddress?.country || '',
        shippingPhone:   phoneNumber              || shippingAddress?.phone || '',
        specialInstructions: specialInstructions  || ''
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

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items.data.price.product']
    });

    if (session.payment_status === 'paid') {
      console.log('✅ Payment verified:', session_id);

      const existingOrder = await Order.findOne({ 'paymentInfo.transactionId': session_id });
      if (existingOrder) {
        return res.status(200).json({
          success: true,
          message: 'Payment verified (order already exists)',
          paymentStatus: 'paid',
          amount: session.amount_total,
          email: session.customer_email,
          order: existingOrder,
          orderId: existingOrder._id,
          orderNumber: existingOrder.orderNumber
        });
      }

      let lineItems = session.line_items?.data || [];
      if (!lineItems.length) {
        const fetchedLineItems = await stripe.checkout.sessions.listLineItems(session_id, {
          limit: 100,
          expand: ['data.price.product']
        });
        lineItems = fetchedLineItems.data || [];
      }
      const cartItems = lineItems.map((lineItem) => {
        const quantity = lineItem.quantity || 1;
        const product = lineItem.price?.product;
        const productDescription = typeof product === 'object' ? product.description : '';

        let selectedSize = null;
        let selectedColor = null;

        if (productDescription && productDescription.includes(',')) {
          const parts = productDescription.split(',').map((part) => part.trim());
          const sizePart = parts.find((part) => part.toLowerCase().startsWith('size:'));
          const colorPart = parts.find((part) => part.toLowerCase().startsWith('color:'));

          if (sizePart) {
            const sizeValue = sizePart.split(':').slice(1).join(':').trim();
            selectedSize = sizeValue && sizeValue !== 'N/A' ? sizeValue : null;
          }

          if (colorPart) {
            const colorValue = colorPart.split(':').slice(1).join(':').trim();
            selectedColor = colorValue || null;
          }
        }

        return {
          name: lineItem.description || 'Product',
          price: ((lineItem.amount_subtotal || 0) / Math.max(quantity, 1)) / 100,
          quantity,
          selectedColor,
          selectedSize
        };
      });
      const userId = session.metadata.userId;
      let user;
      if (userId && userId !== 'guest' && !userId.startsWith('guest-')) {
        user = await User.findById(userId);
      } else {

        user = await User.findOne({ email: session.customer_email });
        if (!user) {


          const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

          user = await User.create({
            name: 'Guest User',
            email: session.customer_email,
            password: randomPassword,
            role: 'user',
            isActive: true
          });
        }
      }

      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shippingCost = 10; // Flat 10 AED shipping fee
      const tax = 0; // No additional tax
      const totalAmount = subtotal + shippingCost;

      const orderItems = cartItems.map(item => ({
        product: null,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize
      }));

      // Build shipping address from metadata (real data passed from frontend)
      const meta = session.metadata || {};
      const resolvedShippingAddress = {
        name:    meta.shippingName    || user.name || 'Customer',
        street:  meta.shippingStreet  || '',
        city:    meta.shippingCity    || '',
        state:   meta.shippingState   || '',
        zipCode: meta.shippingZip     || '',
        country: meta.shippingCountry || '',
        phone:   meta.shippingPhone   || user.phone || ''
      };

      // Create the order
      const order = new Order({
        user: user._id,
        items: orderItems,
        shippingAddress: resolvedShippingAddress,
        paymentInfo: {
          method: 'card',
          status: 'completed',
          transactionId: session_id
        },
        orderStatus: 'confirmed',
        subtotal: subtotal,
        shippingCost: shippingCost,
        tax: tax,
        totalAmount: totalAmount,
        specialInstructions: meta.specialInstructions || 'Order placed via Stripe'
      });

      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      order.orderNumber = `NYH${year}${month}${day}${random}`;

      await order.save();

      console.log('✅ Order created:', order.orderNumber);

      res.status(200).json({
        success: true,
        message: 'Payment verified and order created',
        paymentStatus: 'paid',
        amount: session.amount_total,
        email: session.customer_email,
        order: order, // Send full order details
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus
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

router.post('/cod', optionalAuth, async (req, res) => {
  try {
    const { cartItems, email, guestEmail, shippingAddress, phoneNumber, specialInstructions } = req.body;

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

    let user;
    if (req.user) {
      user = req.user;
    } else {
      user = await User.findOne({ email: customerEmail });
      if (!user) {
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        user = await User.create({
          name: shippingAddress?.name || 'Guest User',
          email: customerEmail,
          password: randomPassword,
          role: 'user',
          isActive: true
        });
      }
    }

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingCost = 10; // Flat 10 AED shipping fee
    const tax = 0; // No additional tax
    const totalAmount = subtotal + shippingCost;

    const orderItems = cartItems.map(item => ({
      product: item.id || item._id || null,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize
    }));

    const order = new Order({
      user: user._id,
      items: orderItems,
      shippingAddress: {
        name:    shippingAddress?.name    || user.name || 'Customer',
        street:  shippingAddress?.street  || '',
        city:    shippingAddress?.city    || '',
        state:   shippingAddress?.state   || '',
        zipCode: shippingAddress?.zipCode || '',
        country: shippingAddress?.country || '',
        phone:   phoneNumber              || shippingAddress?.phone || user.phone || ''
      },
      paymentInfo: {
        method: 'cod',
        status: 'pending',
        transactionId: 'cod-' + Date.now()
      },
      orderStatus: 'confirmed',
      subtotal: subtotal,
      shippingCost: shippingCost,
      tax: tax,
      totalAmount: totalAmount,
      specialInstructions: specialInstructions || 'Order placed via Cash on Delivery'
    });

    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    order.orderNumber = `NYH${year}${month}${day}${random}`;

    await order.save();

    if (req.user) {
      const Cart = require('../models/Cart');
      await Cart.findOneAndUpdate(
        { user: req.user._id },
        { items: [], totalAmount: 0, totalItems: 0 }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Order created successfully (COD)',
      order: order,
      orderId: order._id,
      orderNumber: order.orderNumber
    });
  } catch (error) {
    console.error('❌ Error creating COD order:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
});

module.exports = router;
