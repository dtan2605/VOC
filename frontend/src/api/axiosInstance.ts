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

    if (axiosError.response?.status === 401 && axiosError.config && !axiosError.config._retry) {
      axiosError.config._retry = true
      const refreshToken = localStorage.getItem('refreshToken')

      if (refreshToken) {
        try {
          // Call refresh using the same axiosInstance so config/interceptors stay consistent.
          // Important: ensure we always retry the original request with the updated Authorization header.
          const res = await axiosInstance.post<AuthResponse>(
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
