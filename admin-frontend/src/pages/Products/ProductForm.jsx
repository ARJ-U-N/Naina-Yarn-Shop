import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApi, useApiMutation } from '../../hooks/useApi'
import api from '../../utils/api'
import { ArrowLeft, Save, X, Plus, Upload, Star, Check } from 'lucide-react'
import './ProductForm.css'

const ProductForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: [{ url: '', alt: '' }],
    tags: [],
    colors: [],
    sizes: [],
    materials: [],
    isFeatured: false,
    weight: '',
    dimensions: { length: '', width: '', height: '' }
  })

  const [newTag, setNewTag] = useState('')
  const [newColor, setNewColor] = useState('')
  const [newSize, setNewSize] = useState('')
  const [newMaterial, setNewMaterial] = useState('')
  const [errors, setErrors] = useState({})
  const [uploadingImages, setUploadingImages] = useState(false)
  
  // Category creation state
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  // API hooks
  const { data: product, loading: productLoading } = useApi(
    () => isEditing ? api.products.getById(id) : null,
    [id]
  )
  const { data: categories, refetch: refetchCategories } = useApi(() => api.categories.getAll())
  const { mutate: saveProduct, loading: saving } = useApiMutation()

  // Create new category
  const createNewCategory = async () => {
    if (!newCategoryName.trim()) {
      setErrors(prev => ({ ...prev, newCategory: 'Category name is required' }))
      return
    }

    setCreatingCategory(true)
    
    try {
      const categoryData = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || `${newCategoryName.trim()} category`,
        slug: newCategoryName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        isActive: true
      }

      const result = await api.categories.create(categoryData)
      
      if (result.success) {
        setFormData(prev => ({ ...prev, category: result.data._id }))
        setNewCategoryName('')
        setNewCategoryDescription('')
        setShowNewCategoryInput(false)
        setErrors(prev => ({ ...prev, newCategory: undefined }))
        await refetchCategories()
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        newCategory: error.message || 'Failed to create category. Please try again.'
      }))
    } finally {
      setCreatingCategory(false)
    }
  }

  // Cancel category creation
  const cancelNewCategory = () => {
    setShowNewCategoryInput(false)
    setNewCategoryName('')
    setNewCategoryDescription('')
    setErrors(prev => ({ ...prev, newCategory: undefined }))
  }

  // FIXED useEffect for handling edit mode
  useEffect(() => {
    if (product?.data) {
      const productData = product.data
      
      // Fix image URL handling for editing
      let processedImages = []
      if (productData.images && productData.images.length > 0) {
        processedImages = productData.images.map(image => ({
          ...image,
          url: image.url.startsWith('http') 
            ? image.url 
            : `http://localhost:5000${image.url}`
        }))
      } else {
        processedImages = [{ url: '', alt: '' }]
      }
      
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price || '',
        category: productData.category._id || '',
        stock: productData.stock || '',
        images: processedImages,
        tags: productData.tags || [],
        colors: productData.colors || [],
        sizes: productData.sizes || [],
        materials: productData.materials || [],
        isFeatured: productData.isFeatured || false,
        weight: productData.weight || '',
        dimensions: {
          length: productData.dimensions?.length || '',
          width: productData.dimensions?.width || '',
          height: productData.dimensions?.height || ''
        }
      })
    }
  }, [product])

  // Image upload
  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    setUploadingImages(true)
    try {
      const formData = new FormData()
      files.forEach(file => formData.append('images', file))

      const result = await api.upload.images(formData)
      
      if (result.success) {
        const newImages = result.images.map(img => ({
          url: img.url,
          alt: img.alt || ''
        }))
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images.filter(img => img.url), ...newImages]
        }))
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, images: 'Failed to upload images. Please try again.' }))
    } finally {
      setUploadingImages(false)
      event.target.value = ''
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleDimensionChange = (dimension, value) => {
    setFormData(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [dimension]: value }
    }))
  }

  const handleImageChange = (index, field, value) => {
    const updatedImages = [...formData.images]
    updatedImages[index] = { ...updatedImages[index], [field]: value }
    setFormData(prev => ({ ...prev, images: updatedImages }))
  }

  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, { url: '', alt: '' }]
    }))
  }

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  // Helper functions for variants
  const addItem = (type, value, setState) => {
    if (value.trim() && !formData[type].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()]
      }))
      setState('')
    }
  }

  const removeItem = (type, item) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter(i => i !== item)
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required'
    if (!formData.category) newErrors.category = 'Category is required'
    if (!formData.stock || formData.stock < 0) newErrors.stock = 'Valid stock quantity is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // FIXED handleSubmit for saving
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    // Convert image URLs back to relative format for saving
    const processedImages = formData.images
      .filter(img => img.url.trim() !== '')
      .map(img => ({
        ...img,
        url: img.url.includes('http://localhost:5000') 
          ? img.url.replace('http://localhost:5000', '')
          : img.url
      }))

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      dimensions: {
        length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : undefined,
        width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : undefined,
        height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : undefined
      },
      images: processedImages
    }

    const result = await saveProduct(
      () => isEditing 
        ? api.products.update(id, productData)
        : api.products.create(productData),
      `Product ${isEditing ? 'updated' : 'created'} successfully`
    )

    if (result.success) {
      navigate('/products')
    }
  }

  if (productLoading) {
    return (
      <div className="product-form-loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="product-form-container">
      <div className="product-form-wrapper">
        {/* Header */}
        <div className="form-header">
          <button
            onClick={() => navigate('/products')}
            className="back-button"
          >
            <ArrowLeft className="back-icon" />
            Back to Products
          </button>
          <div className="header-content">
            <h1 className="form-title">
              {isEditing ? 'Edit Product' : 'Create New Product'}
            </h1>
            <p className="form-subtitle">
              {isEditing ? 'Update product information' : 'Add a new product to your inventory'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          {/* Basic Information */}
          <div className="form-section">
            <h2 className="section-title">
              <div className="section-icon">
                <div className="icon-dot"></div>
              </div>
              Product Information
            </h2>
            
            <div className="form-fields">
              <div className="field-group">
                <label className="field-label">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter product name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                />
                {errors.name && <p className="error-message">{errors.name}</p>}
              </div>

              <div className="field-group">
                <label className="field-label">
                  Product Description *
                </label>
                <textarea
                  name="description"
                  placeholder="Describe your product in detail..."
                  rows="4"
                  className="form-textarea"
                  value={formData.description}
                  onChange={handleInputChange}
                />
                {errors.description && <p className="error-message">{errors.description}</p>}
              </div>

              <div className="grid-3">
                <div className="field-group">
                  <label className="field-label">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                  {errors.price && <p className="error-message">{errors.price}</p>}
                </div>
                
                <div className="field-group">
                  <label className="field-label">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    placeholder="0"
                    min="0"
                    className="form-input"
                    value={formData.stock}
                    onChange={handleInputChange}
                  />
                  {errors.stock && <p className="error-message">{errors.stock}</p>}
                </div>
                
                <div className="field-group">
                  <label className="field-label">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    placeholder="0.0"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.weight}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="form-section">
            <h2 className="section-title">
              <div className="section-icon">
                <Upload className="section-icon-svg" />
              </div>
              Product Images
            </h2>
            
            <div className="form-fields">
              {/* Upload Area */}
              <div className="upload-area">
                <Upload className="upload-icon" />
                <label className="upload-label">
                  <span className="upload-text">
                    {uploadingImages ? 'Uploading...' : 'Drop files here or click to browse'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    className="upload-input"
                  />
                </label>
                <p className="upload-help">
                  Supports JPG, PNG, GIF up to 5MB each
                </p>
              </div>

              {/* Manual URLs */}
              <div className="image-urls">
                <h4 className="urls-title">Manual Image URLs</h4>
                {formData.images.map((image, index) => (
                  <div key={index} className="image-url-row">
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg or /uploads/products/image.jpg"
                      className="url-input"
                      value={image.url}
                      onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Alt text"
                      className="alt-input"
                      value={image.alt}
                      onChange={(e) => handleImageChange(index, 'alt', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={formData.images.length === 1}
                      className="remove-image-btn"
                    >
                      <X className="remove-icon" />
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addImage}
                  className="add-image-btn"
                >
                  <Plus className="add-icon" />
                  Add Image URL
                </button>
              </div>

              {/* Preview */}
              {formData.images.some(img => img.url) && (
                <div className="image-preview">
                  <h4 className="preview-title">Preview</h4>
                  <div className="preview-grid">
                    {formData.images
                      .filter(img => img.url)
                      .map((image, index) => {
                        const imageUrl = image.url.startsWith('http') 
                          ? image.url 
                          : `http://localhost:5000${image.url}`
                        
                        return (
                          <div key={index} className="preview-item">
                            <img
                              src={imageUrl}
                              alt={image.alt}
                              className="preview-img"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YzZjRmNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGV4dCB5PSI1MCUiIHg9IjUwJSIgZHk9IjAuMzVlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Y2EzYWYiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
                              }}
                            />
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Variants */}
          <div className="form-section">
            <h2 className="section-title">
              <div className="section-icon">
                <div className="variant-icon"></div>
              </div>
              Product Variants
            </h2>
            
            <div className="variants-grid">
              {/* Tags & Colors */}
              <div className="variant-column">
                {/* Tags */}
                <div className="variant-group">
                  <label className="field-label">Tags</label>
                  <div className="variant-input-row">
                    <input
                      type="text"
                      placeholder="Add tag"
                      className="variant-input"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('tags', newTag, setNewTag))}
                    />
                    <button
                      type="button"
                      onClick={() => addItem('tags', newTag, setNewTag)}
                      className="variant-add-btn"
                    >
                      Add
                    </button>
                  </div>
                  <div className="variant-tags">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="variant-tag variant-tag-gray">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeItem('tags', tag)}
                          className="tag-remove-btn"
                        >
                          <X className="tag-remove-icon" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="variant-group">
                  <label className="field-label">Colors</label>
                  <div className="variant-input-row">
                    <input
                      type="text"
                      placeholder="Add color"
                      className="variant-input"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('colors', newColor, setNewColor))}
                    />
                    <button
                      type="button"
                      onClick={() => addItem('colors', newColor, setNewColor)}
                      className="variant-add-btn"
                    >
                      Add
                    </button>
                  </div>
                  <div className="variant-tags">
                    {formData.colors.map((color, index) => (
                      <span key={index} className="variant-tag variant-tag-blue">
                        {color}
                        <button
                          type="button"
                          onClick={() => removeItem('colors', color)}
                          className="tag-remove-btn"
                        >
                          <X className="tag-remove-icon" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sizes & Materials */}
              <div className="variant-column">
                {/* Sizes */}
                <div className="variant-group">
                  <label className="field-label">Sizes</label>
                  <div className="variant-input-row">
                    <input
                      type="text"
                      placeholder="Add size"
                      className="variant-input"
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('sizes', newSize, setNewSize))}
                    />
                    <button
                      type="button"
                      onClick={() => addItem('sizes', newSize, setNewSize)}
                      className="variant-add-btn"
                    >
                      Add
                    </button>
                  </div>
                  <div className="variant-tags">
                    {formData.sizes.map((size, index) => (
                      <span key={index} className="variant-tag variant-tag-green">
                        {size}
                        <button
                          type="button"
                          onClick={() => removeItem('sizes', size)}
                          className="tag-remove-btn"
                        >
                          <X className="tag-remove-icon" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Materials */}
                <div className="variant-group">
                  <label className="field-label">Materials</label>
                  <div className="variant-input-row">
                    <input
                      type="text"
                      placeholder="Add material"
                      className="variant-input"
                      value={newMaterial}
                      onChange={(e) => setNewMaterial(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('materials', newMaterial, setNewMaterial))}
                    />
                    <button
                      type="button"
                      onClick={() => addItem('materials', newMaterial, setNewMaterial)}
                      className="variant-add-btn"
                    >
                      Add
                    </button>
                  </div>
                  <div className="variant-tags">
                    {formData.materials.map((material, index) => (
                      <span key={index} className="variant-tag variant-tag-purple">
                        {material}
                        <button
                          type="button"
                          onClick={() => removeItem('materials', material)}
                          className="tag-remove-btn"
                        >
                          <X className="tag-remove-icon" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category & Settings */}
          <div className="settings-grid">
            <div className="form-section">
              <h3 className="subsection-title">Category</h3>
              
              <div className="form-fields">
                <div className="field-group">
                  <label className="field-label">
                    Select Category *
                  </label>
                  <select
                    name="category"
                    className="form-select"
                    value={formData.category}
                    onChange={handleInputChange}
                    disabled={showNewCategoryInput}
                  >
                    <option value="">Choose Category</option>
                    {categories?.data?.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="error-message">{errors.category}</p>}
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                  className="create-category-btn"
                >
                  {showNewCategoryInput ? 'Cancel' : '+ Create New Category'}
                </button>

                {showNewCategoryInput && (
                  <div className="new-category-form">
                    <input
                      type="text"
                      placeholder="Category name"
                      className="form-input"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <textarea
                      placeholder="Description (optional)"
                      rows="2"
                      className="form-textarea"
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                    />
                    {errors.newCategory && <p className="error-message">{errors.newCategory}</p>}
                    <div className="category-actions">
                      <button
                        type="button"
                        onClick={createNewCategory}
                        disabled={creatingCategory || !newCategoryName.trim()}
                        className="create-btn"
                      >
                        {creatingCategory ? 'Creating...' : 'Create & Select'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelNewCategory}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3 className="subsection-title">Settings</h3>
              
              <div className="form-fields">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    className="form-checkbox"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">Featured Product</span>
                  <Star className="star-icon" />
                </label>

                <div className="field-group">
                  <label className="field-label">
                    Dimensions (cm)
                  </label>
                  <div className="dimensions-grid">
                    <input
                      type="number"
                      placeholder="Length"
                      className="dimension-input"
                      value={formData.dimensions.length}
                      onChange={(e) => handleDimensionChange('length', e.target.value)}
                      step="0.1"
                      min="0"
                    />
                    <input
                      type="number"
                      placeholder="Width"
                      className="dimension-input"
                      value={formData.dimensions.width}
                      onChange={(e) => handleDimensionChange('width', e.target.value)}
                      step="0.1"
                      min="0"
                    />
                    <input
                      type="number"
                      placeholder="Height"
                      className="dimension-input"
                      value={formData.dimensions.height}
                      onChange={(e) => handleDimensionChange('height', e.target.value)}
                      step="0.1"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="cancel-action-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImages || creatingCategory}
              className="submit-btn"
            >
              {saving 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update Product' : 'Create Product')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductForm
