import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CartProvider } from './components/contexts/CartContext'
import Header from './components/Header'
import Collections from './components/pages/Collections'
import CategoryPage from './components/pages/CategoryPage'
import Cart from './components/pages/Cart'
import Success from './components/pages/Success'
import Footer from './components/Footer'
import './App.css'
import About from './components/pages/About'
import Login from './components/pages/Login'
import ProductDetail from './components/pages/ProductDetail'

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<Collections />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/success" element={<Success />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/product/:id" element={<ProductDetail />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </CartProvider>
  )
}

export default App
