import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Board, CreateBoardData, UpdateBoardData, ApiResponse } from '@/types'

// Async thunks
export const fetchBoards = createAsyncThunk(
  'boards/fetchBoards',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/boards')
      const data: ApiResponse<Board[]> = await response.json()
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch boards')
      }
      
      return data.data || []
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const createBoard = createAsyncThunk(
  'boards/createBoard',
  async (boardData: CreateBoardData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boardData),
      })
      
      const data: ApiResponse<Board> = await response.json()
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to create board')
      }
      
      return data.data!
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const updateBoard = createAsyncThunk(
  'boards/updateBoard',
  async (boardData: UpdateBoardData, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/boards/${boardData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boardData),
      })
      
      const data: ApiResponse<Board> = await response.json()
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to update board')
      }
      
      return data.data!
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const deleteBoard = createAsyncThunk(
  'boards/deleteBoard',
  async (boardId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
      })
      
      const data: ApiResponse = await response.json()
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to delete board')
      }
      
      return boardId
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

// Create column async thunk
export const createColumn = createAsyncThunk(
  'boards/createColumn',
  async ({ boardId, title }: { boardId: string; title: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/boards/${boardId}/columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create column')
      }
      
      return { boardId, column: data }
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

interface BoardsState {
  boards: Board[]
  currentBoard: Board | null
  isLoading: boolean
  error: string | null
}

const initialState: BoardsState = {
  boards: [],
  currentBoard: null,
  isLoading: false,
  error: null,
}

const boardsSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {
    setCurrentBoard: (state, action: PayloadAction<Board | null>) => {
      state.currentBoard = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    // Optimistic updates
    optimisticCreateBoard: (state, action: PayloadAction<Board>) => {
      state.boards.push(action.payload)
    },
    optimisticUpdateBoard: (state, action: PayloadAction<Board>) => {
      const index = state.boards.findIndex(board => board._id === action.payload._id)
      if (index !== -1) {
        state.boards[index] = action.payload
      }
      if (state.currentBoard?._id === action.payload._id) {
        state.currentBoard = action.payload
      }
    },
    optimisticDeleteBoard: (state, action: PayloadAction<string>) => {
      state.boards = state.boards.filter(board => board._id !== action.payload)
      if (state.currentBoard?._id === action.payload) {
        state.currentBoard = null
      }
    },
    // Socket updates
    boardUpdatedBySocket: (state, action: PayloadAction<Board>) => {
      const index = state.boards.findIndex(board => board._id === action.payload._id)
      if (index !== -1) {
        state.boards[index] = action.payload
      }
      if (state.currentBoard?._id === action.payload._id) {
        state.currentBoard = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch boards
      .addCase(fetchBoards.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.isLoading = false
        state.boards = action.payload
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Create board
      .addCase(createBoard.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.isLoading = false
        // Check if board already exists (from optimistic update)
        const existingIndex = state.boards.findIndex(board => board._id === action.payload._id)
        if (existingIndex === -1) {
          state.boards.push(action.payload)
        } else {
          state.boards[existingIndex] = action.payload
        }
      })
      .addCase(createBoard.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        // Remove optimistic board if it exists
        state.boards = state.boards.filter(board => !board._id.startsWith('temp-'))
      })
      // Update board
      .addCase(updateBoard.pending, (state) => {
        state.error = null
      })
      .addCase(updateBoard.fulfilled, (state, action) => {
        const index = state.boards.findIndex(board => board._id === action.payload._id)
        if (index !== -1) {
          state.boards[index] = action.payload
        }
        if (state.currentBoard?._id === action.payload._id) {
          state.currentBoard = action.payload
        }
      })
      .addCase(updateBoard.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Delete board
      .addCase(deleteBoard.pending, (state) => {
        state.error = null
      })
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.boards = state.boards.filter(board => board._id !== action.payload)
        if (state.currentBoard?._id === action.payload) {
          state.currentBoard = null
        }
      })
      .addCase(deleteBoard.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Create column
      .addCase(createColumn.pending, (state) => {
        state.error = null
      })
      .addCase(createColumn.fulfilled, (state, action) => {
        const { boardId, column } = action.payload
        // Update the board in the boards array
        const boardIndex = state.boards.findIndex(board => board._id === boardId)
        if (boardIndex !== -1) {
          state.boards[boardIndex].columns.push(column)
        }
        // Update current board if it's the same
        if (state.currentBoard?._id === boardId) {
          state.currentBoard.columns.push(column)
        }
      })
      .addCase(createColumn.rejected, (state, action) => {
        state.error = action.payload as string
      })
  },
})

export const {
  setCurrentBoard,
  clearError,
  optimisticCreateBoard,
  optimisticUpdateBoard,
  optimisticDeleteBoard,
  boardUpdatedBySocket,
} = boardsSlice.actions

export default boardsSlice.reducer
