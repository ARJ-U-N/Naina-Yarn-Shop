import React, { useState, useRef } from 'react'
import { useApi, useApiMutation } from '../../hooks/useApi'
import api from '../../utils/api'
import { Plus, Edit, Trash2, FolderOpen, X, Save, Upload, Image as ImageIcon } from 'lucide-react'

const Categories = () => {
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: ''
  })
  const [errors, setErrors] = useState({})
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const { data: categories, loading, refetch } = useApi(() => api.categories.getAll())
  const { mutate: saveCategory, loading: saving } = useApiMutation()
  const { mutate: deleteCategory, loading: deleting } = useApiMutation()

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: ''
    })
    setErrors({})
    setEditingCategory(null)
    setSelectedFile(null)
    setImagePreview('')
  }

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || '',
        image: category.image || ''
      })
      setImagePreview(category.image || '')
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Category name is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      setSelectedFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result)
        // Clear manual URL when file is selected
        setFormData(prev => ({ ...prev, image: '' }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Upload file to server
  const uploadFile = async () => {
    if (!selectedFile) return null

    setUploading(true)
    try {
      console.log('🚀 Starting file upload...')
      const uploadFormData = new FormData()
      uploadFormData.append('image', selectedFile)

      const response = await api.categories.uploadImage(uploadFormData)
      
      console.log('✅ Upload response:', response)
      
      if (response && response.success && response.data) {
        console.log('✅ Image uploaded successfully:', response.data.imageUrl)
        return response.data.imageUrl
      } else {
        console.error('❌ Upload response structure:', response)
        throw new Error('Upload response is invalid')
      }
    } catch (error) {
      console.error('❌ Upload error:', error)
      // More specific error handling
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('Authentication failed. Please log in again.')
      } else if (error.message.includes('413')) {
        throw new Error('File is too large. Maximum size is 5MB.')
      } else if (error.message.includes('400')) {
        throw new Error('Invalid file format. Please use JPG, PNG, or GIF.')
      } else {
        throw new Error(`Upload failed: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setUploading(false)
    }
  }

  // Handle form submission with file upload
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      let finalFormData = { ...formData }

      // Upload file if selected
      if (selectedFile) {
        const uploadedImageUrl = await uploadFile()
        finalFormData.image = uploadedImageUrl
      }

      const result = await saveCategory(
        () => editingCategory 
          ? api.categories.update(editingCategory._id, finalFormData)
          : api.categories.create(finalFormData),
        `Category ${editingCategory ? 'updated' : 'created'} successfully`
      )

      if (result.success) {
        closeModal()
        refetch()
      }
    } catch (error) {
      alert(error.message || 'Failed to save category')
    }
  }

  const handleDelete = async (category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"? This cannot be undone.`)) {
      const result = await deleteCategory(
        () => api.categories.delete(category._id),
        'Category deleted successfully'
      )
      if (result.success) {
        refetch()
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }

    // Update preview when URL changes
    if (name === 'image') {
      setImagePreview(value)
      // Clear selected file when URL is entered
      if (value) {
        setSelectedFile(null)
      }
    }
  }

  // Remove selected image
  const removeImage = () => {
    setSelectedFile(null)
    setImagePreview('')
    setFormData(prev => ({ ...prev, image: '' }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your product categories
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="mt-4 sm:mt-0 btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : categories?.data?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.data.map((category) => (
                <div 
                  key={category._id} 
                  className="border rounded-lg hover:shadow-lg transition-shadow flex flex-col h-full"
                >
                  {/* Fixed image section with consistent height */}
                  <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-gray-100">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div 
                      className="absolute inset-0 flex items-center justify-center bg-blue-50"
                      style={{display: category.image ? 'none' : 'flex'}}
                    >
                      <FolderOpen className="w-16 h-16 text-blue-400" />
                    </div>
                  </div>

                  {/* Card content with flex-grow for uniform heights */}
                  <div className="p-6 flex flex-col flex-grow">
                    {/* Header with title and actions */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-grow">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {category.productCount || 0} products
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => openModal(category)}
                          className="btn btn-primary btn-sm"
                          title="Edit category"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          disabled={deleting || category.productCount > 0}
                          className="btn btn-danger btn-sm"
                          title={category.productCount > 0 ? 'Cannot delete category with products' : 'Delete category'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Description */}
                    {category.description && (
                      <p className="text-sm text-gray-600 mb-4 flex-grow">
                        {category.description}
                      </p>
                    )}
                    
                    {/* Footer with date - pushed to bottom */}
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100 mt-auto">
                      Created: {new Date(category.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FolderOpen className="empty-state-icon" />
              <p className="text-lg font-medium text-gray-900 mb-2">No categories yet</p>
              <p className="text-gray-500 mb-4">
                Create your first category to organize your products.
              </p>
              <button
                onClick={() => openModal()}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4" />
                Create Category
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label htmlFor="name">Category Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`form-control ${errors.name ? 'error' : ''}`}
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter category name"
                  />
                  {errors.name && <div className="error">{errors.name}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    className="form-control"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter category description (optional)"
                    rows="3"
                  />
                </div>

                {/* Image Upload Section */}
                <div className="form-group">
                  <label>Category Image</label>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-3 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Category preview"
                        className="w-24 h-24 object-cover rounded-lg border"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'block'
                        }}
                      />
                      <div className="text-sm text-red-500 mt-1" style={{display: 'none'}}>
                        Invalid image URL
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* File Upload Option */}
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      
                      <div className="space-y-2">
                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Choose image file
                          </button>
                          <p className="text-sm text-gray-500 mt-1">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* OR Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">OR</span>
                      </div>
                    </div>

                    {/* URL Input */}
                    <div>
                      <input
                        type="url"
                        id="image"
                        name="image"
                        className="form-control"
                        value={formData.image}
                        onChange={handleInputChange}
                        placeholder="Enter image URL: https://example.com/image.jpg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Or paste an image URL from the web
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="btn btn-primary"
                >
                  <Save className="w-4 h-4" />
                  {saving || uploading
                    ? (uploading ? 'Uploading...' : (editingCategory ? 'Updating...' : 'Creating...'))
                    : (editingCategory ? 'Update' : 'Create')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories
