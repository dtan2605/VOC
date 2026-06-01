import axiosInstance from './axiosInstance'
import type { UserProfile } from '../types/user'
import { API_ROUTES } from '../config/api'

export const userApi = {
  getProfile: () => axiosInstance.get<UserProfile>(`${API_ROUTES.user}/me`),
}
