
import React from 'react'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Info</h3>
            <ul>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Refund Policy</a></li>
              <li><a href="#">Shipping Policy</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Subscribe to our emails</h3>
            <div className="newsletter">
              <input type="email" placeholder="Email" />
              <button type="submit">→</button>
            </div>
            <div className="social-links">
              <a href="#" aria-label="Facebook">f</a>
              <a href="#" aria-label="Pinterest">p</a>
              <a href="#" aria-label="Instagram">i</a>
              <a href="#" aria-label="YouTube">y</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2025, Naina. </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
