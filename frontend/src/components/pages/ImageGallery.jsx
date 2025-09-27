import React, { useState, useEffect } from 'react'
import './ImageGallery.css'

const ImageGallery = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleArrowKeys = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('keydown', handleArrowKeys)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleArrowKeys)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (!images || images.length === 0) return null

  return (
    <div className="image-gallery-overlay" onClick={onClose}>
      <div className="image-gallery-container" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="gallery-close-btn" onClick={onClose}>
          ✕
        </button>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button className="gallery-nav-btn gallery-prev-btn" onClick={goToPrevious}>
              ‹
            </button>
            
            <button className="gallery-nav-btn gallery-next-btn" onClick={goToNext}>
              ›
            </button>
          </>
        )}

        {/* Main Image */}
        <div className="gallery-image-container">
          <img
            src={images[currentIndex]?.url}
            alt={images[currentIndex]?.alt}
            className="gallery-image"
          />
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="gallery-counter">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="gallery-thumbnails">
            {images.map((image, index) => (
              <img
                key={index}
                src={image.url}
                alt={image.alt}
                className={`gallery-thumbnail ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageGallery
