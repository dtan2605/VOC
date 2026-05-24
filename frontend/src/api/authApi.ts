import axiosInstance from './axiosInstance'
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth'

export const authApi = {
  login: (data: LoginRequest) =>
    axiosInstance.post<AuthResponse>('/api/auth/login', data),

  register: (data: RegisterRequest) =>
    axiosInstance.post<AuthResponse>('/api/auth/register', data),

  refresh: (refreshToken: string) =>
    axiosInstance.post<AuthResponse>('/api/auth/refresh', { refreshToken }),

  revoke: (refreshToken: string) =>
    axiosInstance.post('/api/auth/revoke', { refreshToken }),
}
