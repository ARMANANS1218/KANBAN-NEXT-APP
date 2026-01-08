import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthUser {
  _id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  profileImage?: string
  provider: 'local' | 'google'
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Login actions
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.isLoading = false
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      state.error = null
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', action.payload.token)
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      }
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
      state.isAuthenticated = false
    },

    // Register actions
    registerStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    registerSuccess: (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.isLoading = false
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      state.error = null
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', action.payload.token)
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      }
    },
    registerFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
      state.isAuthenticated = false
    },

    // Logout
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
      }
    },

    // Set user from localStorage
    setUserFromStorage: (state, action: PayloadAction<{ user: AuthUser; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
    },

    // Update profile
    updateProfileStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    updateProfileSuccess: (state, action: PayloadAction<AuthUser>) => {
      state.isLoading = false
      state.user = action.payload
      state.error = null
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(action.payload))
      }
    },
    updateProfileFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error = action.payload
    },

    // Clear error
    clearError: (state) => {
      state.error = null
    },
  },
})

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  logout,
  setUserFromStorage,
  updateProfileStart,
  updateProfileSuccess,
  updateProfileFailure,
  clearError,
} = authSlice.actions

export default authSlice.reducer
