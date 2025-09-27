import React, { useState } from 'react'
import { useApi, useApiMutation } from '../../hooks/useApi'
import api from '../../utils/api'
import { Plus, Edit, Trash2, FolderOpen, X, Save } from 'lucide-react'

const Categories = () => {
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: ''
  })
  const [errors, setErrors] = useState({})

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
  }

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || '',
        image: category.image || ''
      })
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const result = await saveCategory(
      () => editingCategory 
        ? api.categories.update(editingCategory._id, formData)
        : api.categories.create(formData),
      `Category ${editingCategory ? 'updated' : 'created'} successfully`
    )

    if (result.success) {
      closeModal()
      refetch()
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
                <div key={category._id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-12 h-12 rounded-lg object-cover mr-3"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3" 
                           style={{display: category.image ? 'none' : 'flex'}}>
                        <FolderOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">
                          {category.productCount || 0} products
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openModal(category)}
                        className="btn btn-primary btn-sm"
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
                  
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {category.description}
                    </p>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Created: {new Date(category.createdAt).toLocaleDateString('en-IN')}
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

                <div className="form-group">
                  <label htmlFor="image">Category Image URL</label>
                  <input
                    type="url"
                    id="image"
                    name="image"
                    className="form-control"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Add an image URL to represent this category
                  </p>
                </div>

                {/* Image Preview */}
                {formData.image && (
                  <div className="form-group">
                    <label>Preview</label>
                    <img
                      src={formData.image}
                      alt="Category preview"
                      className="w-20 h-20 object-cover rounded-lg border"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'block'
                      }}
                    />
                    <div className="text-sm text-red-500 mt-1" style={{display: 'none'}}>
                      Invalid image URL
                    </div>
                  </div>
                )}
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
                  disabled={saving}
                  className="btn btn-primary"
                >
                  <Save className="w-4 h-4" />
                  {saving 
                    ? (editingCategory ? 'Updating...' : 'Creating...') 
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
