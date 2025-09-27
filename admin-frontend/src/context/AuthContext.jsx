import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('admin_token'))
  const [loading, setLoading] = useState(true)

  // Check if user is authenticated
  const isAuthenticated = !!token && !!user

  // Login function
  const login = async (email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Check if user is admin
      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.')
      }

      // Store token and user data
      localStorage.setItem('admin_token', data.token)
      setToken(data.token)
      setUser(data.user)

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem('admin_token')
    setToken(null)
    setUser(null)
  }

  // Get current user data
  const getCurrentUser = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }

      const data = await response.json()
      
      // Check if user is still admin
      if (data.user.role !== 'admin') {
        logout()
        return
      }

      setUser(data.user)
    } catch (error) {
      console.error('Get current user error:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  // Check authentication status on app load
  useEffect(() => {
    getCurrentUser()
  }, [token])

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    getCurrentUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
