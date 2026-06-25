import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { AuthResponse } from '../types/auth'
import { API_BASE_URL, API_ROUTES } from '../config/api'

const clearSession = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Separate instance for refresh calls - NO interceptors to prevent infinite loop
const refreshInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as {
      response?: { status: number }
      config?: RetryableConfig
    }

    // Don't retry if already retried or if the failing request IS the refresh endpoint
    const isRefreshRequest = axiosError.config?.url?.includes('/refresh')
    if (axiosError.response?.status === 401 && axiosError.config && !axiosError.config._retry && !isRefreshRequest) {
      axiosError.config._retry = true
      const refreshToken = localStorage.getItem('refreshToken')

      if (refreshToken) {
        try {
          // Use separate instance to avoid triggering this interceptor again
          const res = await refreshInstance.post<AuthResponse>(
            `${API_ROUTES.auth}/refresh`,
            { refreshToken }
          )

          localStorage.setItem('accessToken', res.data.accessToken)
          localStorage.setItem('refreshToken', res.data.refreshToken)

          axiosError.config.headers = axiosError.config.headers ?? {}
          axiosError.config.headers.Authorization = `Bearer ${res.data.accessToken}`

          return axiosInstance(axiosError.config)
        } catch {
          clearSession()
          window.location.href = '/auth'
        }
      } else {
        clearSession()
        window.location.href = '/auth'
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
