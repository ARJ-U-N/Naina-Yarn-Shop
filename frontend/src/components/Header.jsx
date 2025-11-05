import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../components/contexts/CartContext'
import { SiShopee } from 'react-icons/si'
import Search from './Search'
import './Header.css'

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const location = useLocation()
  const { getCartItemsCount } = useCart()

  useEffect(() => {
    // Enhanced user session checking for backend integration
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    if (userData && token) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        // Clear invalid user data
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
  }, [])

  // Enhanced logout handler for backend integration
  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    
    // Reload to reset cart and other user-specific data
    window.location.reload()
  }

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-top">
          <button 
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <Link to="/" className="logo">
            <img 
              src="/1.png" 
              alt="Nayher Logo" 
              className="logo-image"
            />
          </Link>
          
          <div className="header-icons">
            <Search />
            
            {/* Desktop Profile - Keep on desktop */}
            <div className="desktop-only">
              {user ? (
                <div className="profile-dropdown">
                  <button className="profile-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="dropdown-menu">
                    <p className="user-email">{user.email}</p>
                    {user.name && <p className="user-name">{user.name}</p>}
                    {user.role === 'admin' && <span className="admin-badge">Admin</span>}
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="profile-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
            </div>

            <Link to="/cart" className="cart-btn">
              <SiShopee size={24} />
              {getCartItemsCount() > 0 && (
                <span className="cart-count">{getCartItemsCount()}</span>
              )}
            </Link>
          </div>
        </div>

        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
            About
          </Link>
          {/*<a href="#" className="nav-link">Women</a>
          <a href="#" className="nav-link">Kids</a>
          <a href="#" className="nav-link">Decor</a>
          <a href="#" className="nav-link">Organizers</a>
          <a href="#" className="nav-link">Gifting</a>
          <a href="#" className="nav-link">Clearance Sale</a>*/}
          
          {/* Mobile Login Section - Added at bottom of menu */}
          <div className="mobile-auth-section mobile-only">
            {user ? (
              <div className="mobile-user-info">
                <div className="user-details">
                  <p className="user-email">{user.email}</p>
                  {user.name && <p className="user-name">{user.name}</p>}
                  {user.role === 'admin' && <span className="admin-badge">Admin</span>}
                </div>
                <button onClick={handleLogout} className="mobile-logout-btn">
                  Log out
                </button>
              </div>
            ) : (
              <Link to="/login" className="mobile-login-btn" onClick={() => setMenuOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Log in
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
