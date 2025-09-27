import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { cartAPI } from '../services/api'

const CartContext = createContext()

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        cartItems: action.payload.items || action.payload || [],
        loading: false,
        error: null
      }
    
    case 'ADD_ITEM':
      const existingItemIndex = state.cartItems.findIndex(item => 
        item.id === action.payload.id || item.product?._id === action.payload.id
      )
      
      if (existingItemIndex > -1) {
        const updatedItems = state.cartItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) } // FIXED: Add the new quantity
            : item
        )
        return {
          ...state,
          cartItems: updatedItems,
          loading: false,
          error: null
        }
      }
      
      return {
        ...state,
        cartItems: [...state.cartItems, { 
          ...action.payload, 
          quantity: action.payload.quantity || 1  // FIXED: Use payload quantity
        }],
        loading: false,
        error: null
      }
    
    case 'UPDATE_ITEM':
      return {
        ...state,
        cartItems: state.cartItems.map(item =>
          (item.id === action.payload.id || item.product?._id === action.payload.id)
            ? { ...item, quantity: Math.max(0, action.payload.quantity) }
            : item
        ).filter(item => item.quantity > 0),
        loading: false,
        error: null
      }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        cartItems: state.cartItems.filter(item => 
          item.id !== action.payload.id && item.product?._id !== action.payload.id
        ),
        loading: false,
        error: null
      }
    
    case 'CLEAR_CART':
      return {
        ...state,
        cartItems: [],
        loading: false,
        error: null
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      }
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    
    default:
      return state
  }
}

const initialState = {
  cartItems: [],
  loading: false,
  error: null
}

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Load cart from localStorage or backend on mount
  useEffect(() => {
    const loadCart = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        // User is logged in - try to load from backend
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
          const response = await cartAPI.get();
          dispatch({ type: 'SET_CART', payload: response.data.data });
        } catch (error) {
          console.error('Error loading backend cart:', error);
          // Fallback to localStorage cart
          const savedCart = localStorage.getItem('nayher-cart');
          if (savedCart) {
            try {
              const parsedCart = JSON.parse(savedCart);
              dispatch({ type: 'SET_CART', payload: parsedCart });
            } catch (parseError) {
              console.error('Error parsing localStorage cart:', parseError);
              dispatch({ type: 'SET_CART', payload: [] });
            }
          } else {
            dispatch({ type: 'SET_CART', payload: [] });
          }
        }
      } else {
        // User not logged in - load from localStorage
        const savedCart = localStorage.getItem('nayher-cart');
        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart);
            dispatch({ type: 'SET_CART', payload: parsedCart });
          } catch (error) {
            console.error('Error parsing localStorage cart:', error);
            dispatch({ type: 'SET_CART', payload: [] });
          }
        } else {
          dispatch({ type: 'SET_CART', payload: [] });
        }
      }
    };

    loadCart();
  }, []);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('nayher-cart', JSON.stringify(state.cartItems));
  }, [state.cartItems]);

  // FIXED addToCart function
  const addToCart = async (product, quantity = 1, selectedColor = null, selectedSize = null) => {
    console.log('CartContext - addToCart called with:', { product: product.name, quantity, selectedColor, selectedSize }) // Debug log

    const token = localStorage.getItem('token');
    
    if (token) {
      // User is logged in - try backend first
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await cartAPI.add({
          productId: product._id || product.id,
          quantity,
          selectedColor,
          selectedSize
        });
        dispatch({ type: 'SET_CART', payload: response.data.data });
        return;
      } catch (error) {
        console.error('Backend cart error, falling back to localStorage:', error);
        // Continue to localStorage fallback below
      }
    }
    
    // Fallback to localStorage (for guests or when backend fails)
    const cartProduct = {
      id: product._id || product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url || product.image,
      selectedColor,
      selectedSize,
      quantity, // FIXED: Include quantity in the payload
      product: product // Store full product for compatibility
    };
    
    console.log('CartContext - dispatching ADD_ITEM with:', cartProduct) // Debug log
    dispatch({ type: 'ADD_ITEM', payload: cartProduct });
  };

  const removeFromCart = async (productId, selectedColor = null, selectedSize = null) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await cartAPI.remove(productId, { selectedColor, selectedSize });
        dispatch({ type: 'SET_CART', payload: response.data.data });
        return;
      } catch (error) {
        console.error('Backend remove error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    dispatch({ type: 'REMOVE_ITEM', payload: { id: productId } });
  };

  const updateQuantity = async (productId, quantity, selectedColor = null, selectedSize = null) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await cartAPI.update({
          productId,
          quantity,
          selectedColor,
          selectedSize
        });
        dispatch({ type: 'SET_CART', payload: response.data.data });
        return;
      } catch (error) {
        console.error('Backend update error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: { id: productId } });
    } else {
      dispatch({ type: 'UPDATE_ITEM', payload: { id: productId, quantity } });
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await cartAPI.clear();
        dispatch({ type: 'CLEAR_CART' });
        return;
      } catch (error) {
        console.error('Backend clear error, falling back to localStorage:', error);
      }
    }
    
    // Fallback to localStorage
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartTotal = () => {
    return state.cartItems.reduce((total, item) => {
      const price = item.price || item.product?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    return state.cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems: state.cartItems,
      loading: state.loading,
      error: state.error,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemsCount,
      clearError: () => dispatch({ type: 'CLEAR_ERROR' })
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
