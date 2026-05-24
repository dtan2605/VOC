import axiosInstance from './axiosInstance'
import type { UserProfile } from '../types/user'

export const userApi = {
  getProfile: () => axiosInstance.get<UserProfile>('/api/user/me'),
}
