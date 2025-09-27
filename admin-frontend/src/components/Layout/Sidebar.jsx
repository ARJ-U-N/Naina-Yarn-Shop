import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  FolderOpen, 
  MessageSquare,
  LogOut,
  Store
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Sidebar.css'

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth()

  const menuItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
    },
    {
      path: '/orders',
      icon: ShoppingBag,
      label: 'Orders',
    },
    {
      path: '/products',
      icon: Package,
      label: 'Products',
    },
    {
      path: '/categories',
      icon: FolderOpen,
      label: 'Categories',
    },
    {
      path: '/reviews',
      icon: MessageSquare,
      label: 'Reviews',
    },
  ]

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Store className="sidebar-logo-icon" />
          </div>
          <div className="sidebar-title">
            <h1>Naiana Admin</h1>
            <p>Management Panel</p>
          </div>
        </div>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="user-avatar">
            <span>{user?.name?.charAt(0).toUpperCase() || 'A'}</span>
          </div>
          <div className="user-info">
            <p className="user-name">{user?.name || 'Admin User'}</p>
            <p className="user-email">{user?.email || 'admin@nayher2.com'}</p>
            <p className="user-status">● Online</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-items">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && onClose()}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item-active' : ''}`
                }
              >
                <item.icon className="nav-icon" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            <LogOut className="logout-icon" />
            Logout
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
