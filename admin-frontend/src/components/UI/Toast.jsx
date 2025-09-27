import React from 'react'
import { useToast } from '../../context/ToastContext'
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

const Toast = () => {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'error':
        return <XCircle className="w-5 h-5" />
      case 'warning':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getToastClass = (type) => {
    const baseClasses = 'flex items-center p-4 mb-3 rounded-lg shadow-lg border-l-4 max-w-sm animate-slide-in'
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-500 text-green-800`
      case 'error':
        return `${baseClasses} bg-red-50 border-red-500 text-red-800`
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-500 text-yellow-800`
      default:
        return `${baseClasses} bg-blue-50 border-blue-500 text-blue-800`
    }
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={getToastClass(toast.type)}>
            <div className="flex items-center">
              {getIcon(toast.type)}
              <span className="ml-3 text-sm font-medium">
                {toast.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-current opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}

export default Toast
