import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { categoriesAPI } from '../services/api'
import './Collections.css'
//import Carousel from '../Carousel'

const Collections = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
   const carouselSlides = [
    {
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200&h=400&fit=crop',
      alt: 'Baby Blankets Collection',
      title: 'Handcrafted Baby Blankets',
      description: 'Soft, cozy, and made with love for your little ones',
      buttonText: 'Shop Now',
      buttonLink: '#products'
    },
    {
      image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=1200&h=400&fit=crop',
      alt: 'Premium Yarn Products',
      title: 'Premium Quality Yarns',
      description: 'Discover our collection of finest quality materials',
      buttonText: 'Explore',
      buttonLink: '#products'
    },
    {
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop',
      alt: 'Custom Orders',
      title: 'Custom Made Orders',
      description: 'Personalized products tailored just for you',
      buttonText: 'Customize',
      buttonLink: '#products'
    }
  ]

  // Fallback categories (your original data as backup)
  const fallbackCategories = [
    {
      id: 'baby-blanket',
      name: 'Baby Blanket',
      slug: 'baby-blanket',
      image: '/api/placeholder/400/300',
      description: 'Soft handcrafted blankets for newborns and toddlers'
    },
    {
      id: 'baby-set',
      name: 'Baby Set', 
      slug: 'baby-set',
      image: '/api/placeholder/400/300',
      description: 'Complete baby clothing and accessory sets'
    },
    {
      id: 'babywear',
      name: 'Babywear',
      slug: 'babywear', 
      image: '/api/placeholder/400/300',
      description: 'Comfortable handmade clothing for babies'
    },
    {
      id: 'bags',
      name: 'Bags',
      slug: 'bags',
      image: '/api/placeholder/400/300',
      description: 'Handcrafted bags and carriers for daily use'
    },
    {
      id: 'bookmarks',
      name: 'Bookmarks',
      slug: 'bookmarks',
      image: '/api/placeholder/400/300',
      description: 'Decorative bookmarks for book lovers'
    },
    {
      id: 'christmas-special',
      name: 'Christmas Special',
      slug: 'christmas-special',
      image: '/api/placeholder/400/300',
      description: 'Festive holiday decorations and gifts'
    },
    {
      id: 'cushion-covers',
      name: 'Cushion Covers',
      slug: 'cushion-covers',
      image: '/api/placeholder/400/300',
      description: 'Beautiful handmade cushion covers and pillows'
    },
    {
      id: 'table-runners',
      name: 'Table Runners',
      slug: 'table-runners',
      image: '/api/placeholder/400/300',
      description: 'Elegant table runners and dining accessories'
    },
    {
      id: 'wall-hangings',
      name: 'Wall Hangings',
      slug: 'wall-hangings',
      image: '/api/placeholder/400/300',
      description: 'Decorative wall art and hangings'
    },
    {
      id: 'keychains',
      name: 'Keychains',
      slug: 'keychains',
      image: '/api/placeholder/400/300',
      description: 'Cute handmade keychains and accessories'
    },
    {
      id: 'coasters',
      name: 'Coasters',
      slug: 'coasters',
      image: '/api/placeholder/400/300',
      description: 'Protective and decorative drink coasters'
    },
    {
      id: 'photo-frames',
      name: 'Photo Frames',
      slug: 'photo-frames',
      image: '/api/placeholder/400/300',
      description: 'Handcrafted frames for precious memories'
    }
  ]

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getAll()
        if (response.data.success && response.data.data.length > 0) {
          // Map backend data to match your existing format
          const backendCategories = response.data.data.map(cat => ({
            id: cat.slug,
            name: cat.name,
            slug: cat.slug,
            image: cat.image || 'https://www.shutterstock.com/image-photo/colorful-yarn-on-spool-tube-600nw-785262139.jpg',
            description: cat.description
          }))
          setCategories(backendCategories)
        } else {
          // Use fallback data if backend returns no categories
          setCategories(fallbackCategories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        // Use fallback data on error
        setCategories(fallbackCategories)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Show loading state briefly
  if (loading) {
    return (
      <main className="collections">
        <div className="container">
          <h1 className="collections-title">Collections</h1>
          <div className="collections-grid">
            {/* Show skeleton loading using your existing grid */}
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="collection-card loading">
                <div className="collection-image">
                  <div className="loading-placeholder"></div>
                </div>
                <div className="collection-info">
                  <div className="loading-text"></div>
                  <div className="loading-text short"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="collections">
      
      <div className="container">
        <h1 className="collections-title">Collections</h1>
        
        <div className="collections-grid">
          {categories.map(category => (
            <Link 
              key={category.id} 
              to={`/category/${category.slug}`} 
              className="collection-card"
            >
              <div className="collection-image">
                <img src={category.image} alt={category.name} />
                <div className="collection-overlay">
                  <span className="collection-arrow">→</span>
                </div>
              </div>
              <div className="collection-info">
                <h3 className="collection-name">{category.name}</h3>
                <p className="collection-description">{category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

export default Collections
