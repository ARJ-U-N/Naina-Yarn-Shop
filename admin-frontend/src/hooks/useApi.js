import { useState, useEffect } from 'react'
import { useToast } from '../context/ToastContext'

export const useApi = (apiCall, dependencies = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { error: showError } = useToast()

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall()
      setData(result)
    } catch (err) {
      setError(err.message)
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, dependencies)

  return { data, loading, error, refetch: fetchData }
}

export const useApiMutation = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { success, error: showError } = useToast()

  const mutate = async (apiCall, successMessage) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiCall()
      if (successMessage) {
        success(successMessage)
      }
      return { success: true, data: result }
    } catch (err) {
      setError(err.message)
      showError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error }
}
