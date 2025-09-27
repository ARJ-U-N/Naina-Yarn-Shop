import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import './Layout.css'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Main content area */}
      <div className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="content-area">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
