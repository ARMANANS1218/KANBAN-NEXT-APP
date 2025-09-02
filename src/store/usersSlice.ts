import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { User, ApiResponse } from '@/types'

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/users')
      const data: ApiResponse<User[]> = await response.json()
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch users')
      }
      
      return data.data || []
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: { name: string; email: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })
      
      const data: ApiResponse<User> = await response.json()
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to create user')
      }
      
      return data.data!
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

interface UsersState {
  users: User[]
  currentUser: User | null
  isLoading: boolean
  error: string | null
}

const initialState: UsersState = {
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    userConnected: (state, action: PayloadAction<User>) => {
      const exists = state.users.some(user => user._id === action.payload._id)
      if (!exists) {
        state.users.push(action.payload)
      }
    },
    userDisconnected: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user._id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false
        state.users = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Create user
      .addCase(createUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isLoading = false
        const exists = state.users.some(user => user._id === action.payload._id)
        if (!exists) {
          state.users.push(action.payload)
        }
        state.currentUser = action.payload
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const {
  setCurrentUser,
  clearError,
  userConnected,
  userDisconnected,
} = usersSlice.actions

export default usersSlice.reducer
