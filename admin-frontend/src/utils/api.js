const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  getAuthHeaders() {
    const token = localStorage.getItem('admin_token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    // Add debug logging to see what URL is being called
    console.log('🌐 API Request:', url)
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      console.error('Full URL:', url)
      throw error
    }
  }

  // HTTP Methods
  async get(endpoint, params = {}) {
    const queryString = Object.keys(params).length 
      ? '?' + new URLSearchParams(params).toString() 
      : ''
    
    return this.request(`${endpoint}${queryString}`)
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    })
  }

  // ✅ Upload API - NOW INSIDE THE CLASS
  upload = {
    images: (formData) => {
      // For FormData, we need to remove Content-Type header
      const headers = this.getAuthHeaders();
      delete headers['Content-Type']; // Let browser set it with boundary
      
      return this.request('/upload/images', {
        method: 'POST',
        headers,
        body: formData, // FormData object, not JSON
      });
    },
    deleteImage: (filename) => this.delete(`/upload/images/${filename}`),
  }

  // Auth API
  auth = {
    login: (credentials) => this.post('/auth/login', credentials),
    me: () => this.get('/auth/me'),
  }

  // Orders API
  orders = {
    getAll: (params) => this.get('/orders/admin/all', params),
    getById: (id) => this.get(`/orders/${id}`),
    updateStatus: (id, statusData) => this.put(`/orders/${id}/status`, statusData),
    cancel: (id) => this.put(`/orders/${id}/cancel`),
  }

  // Products API
  products = {
    getAll: (params) => this.get('/products', params),
    getById: (id) => this.get(`/products/${id}`),
    create: (productData) => this.post('/products', productData),
    update: (id, productData) => this.put(`/products/${id}`, productData),
    delete: (id) => this.delete(`/products/${id}`),
    getByCategory: (slug, params) => this.get(`/products/category/${slug}`, params),
  }

  // Categories API
  categories = {
    getAll: () => this.get('/categories'),
    getBySlug: (slug) => this.get(`/categories/${slug}`),
    create: (categoryData) => this.post('/categories', categoryData),
    update: (id, categoryData) => this.put(`/categories/${id}`, categoryData),
    delete: (id) => this.delete(`/categories/${id}`),
  }

  // Reviews API
  reviews = {
    getAll: (params) => this.get('/reviews', params),
    getByProduct: (productId, params) => this.get(`/reviews/product/${productId}`, params),
    approve: (id, isApproved) => this.put(`/reviews/${id}/approve`, { isApproved }),
    delete: (id) => this.delete(`/reviews/${id}`),
  }
}

export const api = new ApiClient()
export default api
