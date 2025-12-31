import React from 'react'
import { Link } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import api from '../../utils/api'
import { 
  ShoppingBag, 
  Package, 
  Users, 
  Star, 
  TrendingUp, 
  Calendar,
  ArrowUpRight,
  Eye,
  IndianRupee
} from 'lucide-react'

const Dashboard = () => {
  const { data: ordersData, loading: ordersLoading } = useApi(() => api.orders.getAll({ page: 1, limit: 5 }))
  const { data: productsData } = useApi(() => api.products.getAll({ page: 1, limit: 1 }))

  const stats = [
    {
      name: 'Total Orders',
      value: ordersData?.summary?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Total Revenue',
      value: `₹${(ordersData?.summary?.totalRevenue || 0).toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Products',
      value: productsData?.pagination?.total || 0,
      icon: Package,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+3',
      changeType: 'positive'
    },
    {
      name: 'Avg Rating',
      value: '4.8',
      icon: Star,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '+0.1',
      changeType: 'positive'
    }
  ]

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your store.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date().toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                    <span className="text-xs text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body text-center">
            <Package className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Add Product</h3>
            <p className="text-sm text-gray-500 mb-4">Add a new product to your store</p>
            <Link to="/products/new" className="btn btn-primary btn-sm">
              Add Product
            </Link>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <ShoppingBag className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">View Orders</h3>
            <p className="text-sm text-gray-500 mb-4">Manage customer orders</p>
            <Link to="/orders" className="btn btn-success btn-sm">
              View Orders
            </Link>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body text-center">
            <Star className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Reviews</h3>
            <p className="text-sm text-gray-500 mb-4">Moderate customer reviews</p>
            <Link to="/reviews" className="btn btn-secondary btn-sm">
              View Reviews
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link to="/orders" className="btn btn-sm btn-outline">
            View All
          </Link>
        </div>
        <div className="card-body">
          {ordersLoading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : ordersData?.data?.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersData.data.slice(0, 5).map((order) => (
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
                        <span className="font-semibold">AED{order.totalAmount.toLocaleString('en-IN')}</span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </span>
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
              <p className="text-lg font-medium text-gray-900 mb-2">No orders yet</p>
              <p className="text-gray-500">Orders will appear here once customers start purchasing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
