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
              src="/3.png" 
              alt="Nayher Logo" 
              className="logo-image"
            />
          </Link>
          
          <div className="header-icons">
            <Search />
            
            {/* WhatsApp Link */}
            <a
              href="https://wa.me/971558912650"
              target="_blank"
              rel="noopener noreferrer"
              className="profile-btn"
              aria-label="Contact us on WhatsApp"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>

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
