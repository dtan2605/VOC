import { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '../store'
import {
  login,
  register,
  logout,
  fetchProfile,
  clearError,
} from '../store/slices/authSlice'
import type { LoginRequest, RegisterRequest } from '../types/auth'

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isLoading, error, isAuthenticated, accessToken } = useSelector(
    (state: RootState) => state.auth
  )

  const handleLogin = useCallback(
    (data: LoginRequest) => dispatch(login(data)),
    [dispatch]
  )

  const handleRegister = useCallback(
    (data: RegisterRequest) => dispatch(register(data)),
    [dispatch]
  )

  const handleLogout = useCallback(() => dispatch(logout()), [dispatch])

  const handleFetchProfile = useCallback(() => dispatch(fetchProfile()), [dispatch])

  const handleClearError = useCallback(() => dispatch(clearError()), [dispatch])

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    accessToken,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    fetchProfile: handleFetchProfile,
    clearError: handleClearError,
  }
}
