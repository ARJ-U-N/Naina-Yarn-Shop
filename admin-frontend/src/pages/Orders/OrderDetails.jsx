import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApi, useApiMutation } from '../../hooks/useApi'
import api from '../../utils/api'
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  CreditCard,
  Calendar,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Save,
  X
} from 'lucide-react'

const OrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [editingStatus, setEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')

  const { data: order, loading, refetch } = useApi(() => api.orders.getById(id), [id])
  const { mutate: updateOrder, loading: updating } = useApiMutation()

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="empty-state">
        <XCircle className="empty-state-icon" />
        <p className="text-lg font-medium text-gray-900 mb-2">Order not found</p>
        <p className="text-gray-500 mb-4">The order you're looking for doesn't exist.</p>
        <Link to="/orders" className="btn btn-primary">
          Back to Orders
        </Link>
      </div>
    )
  }

  const orderData = order.data

  const handleStatusUpdate = async () => {
    const result = await updateOrder(
      () => api.orders.updateStatus(id, { 
        status: newStatus,
        trackingNumber: trackingNumber || undefined
      }),
      `Order status updated to ${newStatus}`
    )
    
    if (result.success) {
      setEditingStatus(false)
      setNewStatus('')
      setTrackingNumber('')
      refetch()
    }
  }

  const startEditing = () => {
    setEditingStatus(true)
    setNewStatus(orderData.orderStatus)
    setTrackingNumber(orderData.trackingNumber || '')
  }

  const cancelEditing = () => {
    setEditingStatus(false)
    setNewStatus('')
    setTrackingNumber('')
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

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      confirmed: CheckCircle,
      processing: Package,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: XCircle
    }
    const Icon = icons[status] || Clock
    return <Icon className="w-4 h-4" />
  }

  const statusOptions = [
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
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/orders')}
            className="btn btn-outline btn-sm mr-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{orderData.orderNumber}
            </h1>
            <p className="text-sm text-gray-500">
              Placed on {new Date(orderData.createdAt).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status & Actions */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold">Order Status</h3>
            </div>
            <div className="card-body">
              {editingStatus ? (
                <div className="space-y-4">
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      className="form-control"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {newStatus === 'shipped' && (
                    <div className="form-group">
                      <label>Tracking Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter tracking number"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleStatusUpdate}
                      disabled={updating}
                      className="btn btn-primary btn-sm"
                    >
                      <Save className="w-4 h-4" />
                      {updating ? 'Updating...' : 'Update'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="btn btn-outline btn-sm"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`badge ${getStatusBadge(orderData.orderStatus)} text-sm`}>
                      {getStatusIcon(orderData.orderStatus)}
                      {orderData.orderStatus.toUpperCase()}
                    </span>
                    <button
                      onClick={startEditing}
                      className="btn btn-outline btn-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Update
                    </button>
                  </div>

                  {orderData.trackingNumber && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tracking Number</p>
                      <p className="font-mono text-sm">{orderData.trackingNumber}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                    <p className="text-sm capitalize">{orderData.paymentInfo.method}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                    <span className={`badge text-xs ${
                      orderData.paymentInfo.status === 'completed' ? 'badge-success' :
                      orderData.paymentInfo.status === 'failed' ? 'badge-danger' :
                      'badge-warning'
                    }`}>
                      {orderData.paymentInfo.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Customer Details</h4>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Name:</span> {orderData.user.name}</p>
                    <p><span className="text-gray-500">Email:</span> {orderData.user.email}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    Shipping Address
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p>{orderData.shippingAddress.name}</p>
                    <p>{orderData.shippingAddress.street}</p>
                    <p>{orderData.shippingAddress.city}, {orderData.shippingAddress.state}</p>
                    <p>{orderData.shippingAddress.zipCode}</p>
                    <p>{orderData.shippingAddress.country}</p>
                    <p className="mt-2">
                      <span className="text-gray-500">Phone:</span> {orderData.shippingAddress.phone}
                    </p>
                  </div>
                </div>
              </div>

              {orderData.specialInstructions && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">Special Instructions</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {orderData.specialInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Order Items ({orderData.items.length})
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex items-center p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>Qty: {item.quantity}</span>
                        <span>Price: ₹{item.price.toLocaleString('en-IN')}</span>
                        {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                        {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Order Summary
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{orderData.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>₹{orderData.shippingCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (GST):</span>
                  <span>₹{orderData.tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>₹{orderData.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetails
