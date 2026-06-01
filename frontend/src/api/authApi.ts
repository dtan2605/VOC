import axiosInstance from './axiosInstance'
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth'
import { API_ROUTES } from '../config/api'

export const authApi = {
  login: (data: LoginRequest) =>
    axiosInstance.post<AuthResponse>(`${API_ROUTES.auth}/login`, data),

  register: (data: RegisterRequest) =>
    axiosInstance.post<AuthResponse>(`${API_ROUTES.auth}/register`, data),

  refresh: (refreshToken: string) =>
    axiosInstance.post<AuthResponse>(`${API_ROUTES.auth}/refresh`, { refreshToken }),

  revoke: (refreshToken: string) =>
    axiosInstance.post(`${API_ROUTES.auth}/revoke`, { refreshToken }),
}
