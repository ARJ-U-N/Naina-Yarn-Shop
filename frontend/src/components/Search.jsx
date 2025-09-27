import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { productsAPI } from './services/api'
import './Search.css'

const Search = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  // Keep your original mock data as fallback
  const fallbackSearchData = [
    { id: 1, name: 'Blanket: Jungle Safari (New Born)', price: 7000, category: 'baby-blanket', image: '/api/placeholder/50/50' },
    { id: 2, name: 'Blanket: Teddy (Made to Order)', price: 5000, category: 'baby-blanket', image: '/api/placeholder/50/50' },
    { id: 3, name: 'Baby Set: Pink Bunny Collection', price: 3500, category: 'baby-set', image: '/api/placeholder/50/50' },
    { id: 4, name: 'Babywear: Knitted Cardigan', price: 2500, category: 'babywear', image: '/api/placeholder/50/50' },
    { id: 5, name: 'Handwoven Tote Bag', price: 1500, category: 'bags', image: '/api/placeholder/50/50' },
    { id: 6, name: 'Christmas Ornament Set', price: 800, category: 'christmas-special', image: '/api/placeholder/50/50' },
    { id: 7, name: 'Floral Embroidered Cushion Cover', price: 400, category: 'cushion-covers', image: '/api/placeholder/50/50' }
  ]

  // Enhanced search function with backend + fallback
  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      if (searchTerm.trim()) {
        setLoading(true)
        try {
          // Try backend search first
          const response = await productsAPI.search(searchTerm)
          
          if (response.data.success && response.data.data.length > 0) {
            // Map backend results to your existing format
            const backendResults = response.data.data.slice(0, 5).map(product => ({
              id: product._id,
              name: product.name,
              price: product.price,
              category: product.category?.slug || 'category',
              image: product.images?.[0]?.url || '/api/placeholder/50/50'
            }))
            setSearchResults(backendResults)
          } else {
            // Fallback to mock search
            const filtered = fallbackSearchData.filter(item =>
              item.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setSearchResults(filtered.slice(0, 5))
          }
        } catch (error) {
          console.error('Search error:', error)
          // Fallback to mock search on error
          const filtered = fallbackSearchData.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          setSearchResults(filtered.slice(0, 5))
        } finally {
          setLoading(false)
        }
      } else {
        setSearchResults([])
        setLoading(false)
      }
    }, 300) // Keep your debounce delay

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  // Keep all your existing useEffect hooks exactly the same
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keep your exact event handlers
  const handleSearchClick = () => {
    setIsOpen(true)
  }

  const handleResultClick = (result) => {
    navigate(`/category/${result.category}`)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      // Navigate to search results page or category
      navigate('/')
      setIsOpen(false)
      setSearchTerm('')
    }
  }

  return (
    <div className="search-component" ref={searchRef}>
      <button className="search-btn" onClick={handleSearchClick}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="search-dropdown">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              autoFocus
            />
            <button type="submit" className="search-submit">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </form>

          {/* Add loading state while keeping your design */}
          {loading && (
            <div className="search-loading">
              <p>Searching...</p>
            </div>
          )}

          {/* Keep your exact results structure */}
          {!loading && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(result => (
                <div
                  key={result.id}
                  className="search-result-item"
                  onClick={() => handleResultClick(result)}
                >
                  <img src={result.image} alt={result.name} />
                  <div className="result-info">
                    <span className="result-name">{result.name}</span>
                    <span className="result-price">Rs. {result.price.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Keep your exact no-results structure */}
          {!loading && searchTerm && searchResults.length === 0 && (
            <div className="no-results">
              <p>No products found for "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Search
