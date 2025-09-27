import React from 'react'
import { Link } from 'react-router-dom'
import './About.css'

const About = () => {
  return (
    <div className="about-page">
      <div className="container">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="hero-content">
            <h1 className="about-title">About</h1>
            <p className="about-subtitle">
              Crafting love, one stitch at a time for your little ones
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="story-section">
          <div className="story-content">
            <div className="story-text">
              <h2>Our Story</h2>
              <p>
                Nayher began as a mother's love story. What started as a passion for creating 
                beautiful, handmade items for my own children has blossomed into a mission to 
                bring comfort, joy, and warmth to families everywhere.
              </p>
              <p>
                Every piece we create is made with the same care and attention I would give 
                to items for my own little ones. From cozy baby blankets to adorable clothing 
                sets, each product tells a story of love, craftsmanship, and dedication to quality.
              </p>
            </div>
            <div className="story-image">
              <img src="https://www.shutterstock.com/image-photo/background-colorful-balls-wool-threads-600nw-2485028439.jpg" alt="Crafting process" />
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="values-section">
          <h2>What We Stand For</h2>
          <div className="values-grid">
            <div className="value-item">
              <div className="value-icon">✋</div>
              <h3>Handcrafted Excellence</h3>
              <p>Every item is carefully handmade with attention to detail, ensuring unique quality in each piece.</p>
            </div>
            <div className="value-item">
              <div className="value-icon">👶</div>
              <h3>Baby-Safe Materials</h3>
              <p>We use only the softest, baby-friendly materials that are gentle on delicate skin and built to last.</p>
            </div>
            <div className="value-item">
              <div className="value-icon">❤️</div>
              <h3>Made with Love</h3>
              <p>Each creation carries the love and care of a mother, bringing comfort and joy to your family.</p>
            </div>
            <div className="value-item">
              <div className="value-icon">🌱</div>
              <h3>Sustainable Practices</h3>
              <p>We believe in creating beautiful products while being mindful of our impact on the environment.</p>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="process-section">
          <div className="process-content">
            <div className="process-image">
              <img src="https://media.istockphoto.com/id/1265040574/photo/stack-of-sweaters-on-a-wooden-table.jpg?s=612x612&w=0&k=20&c=0v38ZnwvwhnOIEACif5syG7PoEhNdWm61Dhpyo7SL_c=" alt="Our workspace" />
            </div>
            <div className="process-text">
              <h2>Our Craft Process</h2>
              <div className="process-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h4>Design & Planning</h4>
                    <p>Every piece begins with careful design, selecting patterns and colors that bring joy.</p>
                  </div>
                </div>
                <div className="step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h4>Material Selection</h4>
                    <p>We choose only the finest, baby-safe materials that are soft, durable, and comfortable.</p>
                  </div>
                </div>
                <div className="step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h4>Handcrafted Creation</h4>
                    <p>Each item is lovingly crafted by hand, with careful attention to every detail and stitch.</p>
                  </div>
                </div>
                <div className="step">
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <h4>Quality Assurance</h4>
                    <p>Before reaching you, every piece undergoes thorough quality checks to ensure perfection.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mission-section">
          <div className="mission-content">
            <h2>Our Mission</h2>
            <p>
              To create beautiful, handcrafted items that bring comfort, warmth, and joy to families 
              around the world. We believe every child deserves products made with love, care, and 
              the highest quality materials.
            </p>
            <p>
              Whether it's a cozy blanket for naptime, a special outfit for memorable moments, or 
              unique accessories that spark imagination, Nayher is here to be part of your family's 
              precious memories.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Happy Families</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">1000+</span>
              <span className="stat-label">Items Crafted</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">5</span>
              <span className="stat-label">Years of Crafting</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">12+</span>
              <span className="stat-label">Product Categories</span>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Discover Our Collection?</h2>
            <p>Explore our carefully curated range of handcrafted items for your little ones.</p>
            <Link to="/" className="cta-button">
              Shop Now
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default About
