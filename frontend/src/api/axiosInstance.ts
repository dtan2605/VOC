import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { AuthResponse } from '../types/auth'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

const axiosInstance = axios.create({
  baseURL: BASE_URL,
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
          const res = await axios.post<AuthResponse>(`${BASE_URL}/api/auth/refresh`, { refreshToken })
          localStorage.setItem('accessToken', res.data.accessToken)
          localStorage.setItem('refreshToken', res.data.refreshToken)

          axiosError.config.headers = axiosError.config.headers ?? {}
          axiosError.config.headers.Authorization = `Bearer ${res.data.accessToken}`

          return axiosInstance(axiosError.config)
        } catch {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/auth'
        }
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
