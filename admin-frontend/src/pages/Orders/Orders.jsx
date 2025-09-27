import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApi, useApiMutation } from '../../hooks/useApi'
import api from '../../utils/api'
import { 
  Eye, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  Calendar,
  ShoppingBag
} from 'lucide-react'

const Orders = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    search: ''
  })

  const { data, loading, refetch } = useApi(() => api.orders.getAll(filters), [filters])
  const { mutate: updateStatus, loading: updating } = useApiMutation()

  const handleStatusChange = async (orderId, newStatus) => {
    const result = await updateStatus(
      () => api.orders.updateStatus(orderId, { status: newStatus }),
      `Order status updated to ${newStatus}`
    )
    if (result.success) {
      refetch()
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    // Search is handled automatically through filters state
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      processing: 'badge-info',
      shipped: 'badge-info',
      delivered: 'badge-success',
      cancelled: 'badge-danger'
    }
    return badges[status] || 'badge-secondary'
  }

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track customer orders
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button 
            onClick={refetch}
            className="btn btn-outline btn-sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="btn btn-secondary btn-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {data?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-xl font-bold">{data.summary.totalOrders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">₹</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold">₹{(data.summary.totalRevenue || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-xl font-bold">
                  {data.data?.filter(order => 
                    new Date(order.createdAt).getMonth() === new Date().getMonth()
                  ).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group mb-0">
              <label>Search Orders</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by order number or customer..."
                  className="form-control pl-10"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group mb-0">
              <label>Status Filter</label>
              <select
                className="form-control"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mb-0">
              <label>Items per page</label>
              <select
                className="form-control"
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </form>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : data?.data?.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <span className="font-mono text-sm font-medium">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">{order.user.name}</p>
                          <p className="text-sm text-gray-500">{order.user.email}</p>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                      </td>
                      <td>
                        <select
                          className={`badge ${getStatusBadge(order.orderStatus)} cursor-pointer`}
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          disabled={updating}
                          style={{ 
                            background: 'inherit',
                            border: 'none',
                            color: 'inherit',
                            fontSize: 'inherit',
                            padding: 'inherit'
                          }}
                        >
                          {statusOptions.slice(1).map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="text-sm">
                          <p className="text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                          </p>
                          <p className="text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString('en-IN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/orders/${order._id}`}
                          className="btn btn-sm btn-secondary"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <ShoppingBag className="empty-state-icon" />
              <p className="text-lg font-medium text-gray-900 mb-2">No orders found</p>
              <p className="text-gray-500">
                {filters.search || filters.status 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Orders will appear here once customers start purchasing.'
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-gray-700">
                Showing {((filters.page - 1) * filters.limit) + 1} to{' '}
                {Math.min(filters.page * filters.limit, data.pagination.total)} of{' '}
                {data.pagination.total} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  disabled={filters.page === 1}
                  className="btn btn-sm btn-secondary"
                >
                  Previous
                </button>
                <span className="flex items-center px-3 text-sm text-gray-500">
                  Page {filters.page} of {data.pagination.pages}
                </span>
                <button
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  disabled={filters.page >= data.pagination.pages}
                  className="btn btn-sm btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Orders
