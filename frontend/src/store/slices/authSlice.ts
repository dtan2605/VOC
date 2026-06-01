import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { authApi } from '../../api/authApi'
import { userApi } from '../../api/userApi'
import type { LoginRequest, RegisterRequest } from '../../types/auth'
import type { UserProfile } from '../../types/user'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

interface RejectedApiError {
  message: string
  status?: number
}

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  isLoading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
}

export const login = createAsyncThunk(
  'auth/login',
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      const res = await authApi.login(data)
      return res.data
    } catch (err: unknown) {
      const e = err as { response?: { data?: string; status?: number } }
      return rejectWithValue({
        message: e.response?.data ?? 'Login failed. Please check your credentials.',
        status: e.response?.status,
      } satisfies RejectedApiError)
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const res = await authApi.register(data)
      return res.data
    } catch (err: unknown) {
      const e = err as { response?: { data?: string; status?: number } }
      return rejectWithValue({
        message: e.response?.data ?? 'Registration failed. Please try again.',
        status: e.response?.status,
      } satisfies RejectedApiError)
    }
  }
)

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.getProfile()
      return res.data
    } catch (err: unknown) {
      const e = err as { response?: { data?: string; status?: number } }
      return rejectWithValue({
        message: e.response?.data ?? 'Failed to load profile.',
        status: e.response?.status,
      } satisfies RejectedApiError)
    }
  }
)

export const logout = createAsyncThunk<void, void, { state: { auth: AuthState } }>(
  'auth/logout',
  async (_, { getState }) => {
    const { refreshToken } = getState().auth

    if (refreshToken) {
      try {
        await authApi.revoke(refreshToken)
      } catch {
        // Ignore revoke errors and clear the local session anyway.
      }
    }

    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        localStorage.setItem('accessToken', action.payload.accessToken)
        localStorage.setItem('refreshToken', action.payload.refreshToken)
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as RejectedApiError | undefined)?.message ?? 'Login failed.'
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        localStorage.setItem('accessToken', action.payload.accessToken)
        localStorage.setItem('refreshToken', action.payload.refreshToken)
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as RejectedApiError | undefined)?.message ?? 'Registration failed.'
      })
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false
        const payload = action.payload as RejectedApiError | undefined
        state.error = payload?.message ?? 'Failed to load profile.'
        if (payload?.status === 401) {
          state.user = null
          state.accessToken = null
          state.refreshToken = null
          state.isAuthenticated = false
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.error = null
        state.isLoading = false
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
