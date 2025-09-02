import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Task, CreateTaskData, UpdateTaskData, ApiResponse } from '@/types'

// Async thunks
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (boardId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/boards/${boardId}/tasks`)
      const data: ApiResponse<Task[]> = await response.json()
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to fetch tasks')
      }
      
      return data.data || []
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData: CreateTaskData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })
      
      const data: ApiResponse<Task> = await response.json()
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to create task')
      }
      
      return data.data!
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async (taskData: UpdateTaskData, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      })
      
      const data: ApiResponse<Task> = await response.json()
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to update task')
      }
      
      return data.data!
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })
      
      const data: ApiResponse = await response.json()
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to delete task')
      }
      
      return taskId
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const moveTask = createAsyncThunk(
  'tasks/moveTask',
  async (moveData: {
    taskId: string
    sourceColumnId: string
    destinationColumnId: string
    sourceIndex: number
    destinationIndex: number
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/tasks/${moveData.taskId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moveData),
      })
      
      const data: ApiResponse<{ task: Task; affectedTasks: Task[] }> = await response.json()
      
      if (!data.success) {
        return rejectWithValue(data.error || 'Failed to move task')
      }
      
      return data.data!
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

interface TasksState {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  optimisticMoves: Array<{
    id: string
    taskId: string
    sourceColumnId: string
    destinationColumnId: string
    sourceIndex: number
    destinationIndex: number
  }>
}

const initialState: TasksState = {
  tasks: [],
  isLoading: false,
  error: null,
  optimisticMoves: [],
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    // Optimistic updates
    optimisticCreateTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload)
    },
    optimisticUpdateTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(task => task._id === action.payload._id)
      if (index !== -1) {
        state.tasks[index] = action.payload
      }
    },
    optimisticDeleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task._id !== action.payload)
    },
    optimisticMoveTask: (state, action: PayloadAction<{
      id: string
      taskId: string
      sourceColumnId: string
      destinationColumnId: string
      sourceIndex: number
      destinationIndex: number
    }>) => {
      const { taskId, destinationColumnId, destinationIndex } = action.payload
      const task = state.tasks.find(t => t._id === taskId)
      
      if (task) {
        // Update task column
        task.columnId = destinationColumnId
        
        // Add to optimistic moves for potential rollback
        state.optimisticMoves.push(action.payload)
        
        // Reorder tasks within the same column or move between columns
        const tasksInSourceColumn = state.tasks.filter(t => 
          t.columnId === action.payload.sourceColumnId && t._id !== taskId
        )
        const tasksInDestColumn = state.tasks.filter(t => 
          t.columnId === destinationColumnId && t._id !== taskId
        )
        
        // Update order for affected tasks
        tasksInSourceColumn.forEach((t, index) => {
          if (index >= action.payload.sourceIndex) {
            t.order = index
          }
        })
        
        tasksInDestColumn.forEach((t, index) => {
          if (index >= destinationIndex) {
            t.order = index + 1
          }
        })
        
        task.order = destinationIndex
      }
    },
    rollbackOptimisticMove: (state, action: PayloadAction<string>) => {
      const moveIndex = state.optimisticMoves.findIndex(move => move.id === action.payload)
      if (moveIndex !== -1) {
        const move = state.optimisticMoves[moveIndex]
        const task = state.tasks.find(t => t._id === move.taskId)
        
        if (task) {
          // Revert task to original column and position
          task.columnId = move.sourceColumnId
          task.order = move.sourceIndex
        }
        
        state.optimisticMoves.splice(moveIndex, 1)
      }
    },
    clearOptimisticMoves: (state) => {
      state.optimisticMoves = []
    },
    // Socket updates
    taskCreatedBySocket: (state, action: PayloadAction<Task>) => {
      const exists = state.tasks.some(task => task._id === action.payload._id)
      if (!exists) {
        state.tasks.push(action.payload)
      }
    },
    taskUpdatedBySocket: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(task => task._id === action.payload._id)
      if (index !== -1) {
        state.tasks[index] = action.payload
      }
    },
    taskDeletedBySocket: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task._id !== action.payload)
    },
    taskMovedBySocket: (state, action: PayloadAction<{
      task: Task
      affectedTasks: Task[]
    }>) => {
      const { task, affectedTasks } = action.payload
      
      // Update the moved task
      const taskIndex = state.tasks.findIndex(t => t._id === task._id)
      if (taskIndex !== -1) {
        state.tasks[taskIndex] = task
      }
      
      // Update affected tasks
      affectedTasks.forEach(affectedTask => {
        const index = state.tasks.findIndex(t => t._id === affectedTask._id)
        if (index !== -1) {
          state.tasks[index] = affectedTask
        }
      })
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false
        state.tasks = action.payload
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      // Create task
      .addCase(createTask.pending, (state) => {
        state.error = null
      })
      .addCase(createTask.fulfilled, (state, action) => {
        // Check if task already exists (from optimistic update)
        const existingIndex = state.tasks.findIndex(task => task._id === action.payload._id)
        if (existingIndex === -1) {
          state.tasks.push(action.payload)
        } else {
          state.tasks[existingIndex] = action.payload
        }
      })
      .addCase(createTask.rejected, (state, action) => {
        state.error = action.payload as string
        // Remove optimistic task if it exists
        state.tasks = state.tasks.filter(task => !task._id.startsWith('temp-'))
      })
      // Update task
      .addCase(updateTask.pending, (state) => {
        state.error = null
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(task => task._id === action.payload._id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Delete task
      .addCase(deleteTask.pending, (state) => {
        state.error = null
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter(task => task._id !== action.payload)
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Move task
      .addCase(moveTask.pending, (state) => {
        state.error = null
      })
      .addCase(moveTask.fulfilled, (state, action) => {
        const { task, affectedTasks } = action.payload
        
        // Update the moved task
        const taskIndex = state.tasks.findIndex(t => t._id === task._id)
        if (taskIndex !== -1) {
          state.tasks[taskIndex] = task
        }
        
        // Update affected tasks
        affectedTasks.forEach(affectedTask => {
          const index = state.tasks.findIndex(t => t._id === affectedTask._id)
          if (index !== -1) {
            state.tasks[index] = affectedTask
          }
        })
        
        // Clear optimistic moves
        state.optimisticMoves = []
      })
      .addCase(moveTask.rejected, (state, action) => {
        state.error = action.payload as string
        // Rollback all optimistic moves
        state.optimisticMoves.forEach(move => {
          const task = state.tasks.find(t => t._id === move.taskId)
          if (task) {
            task.columnId = move.sourceColumnId
            task.order = move.sourceIndex
          }
        })
        state.optimisticMoves = []
      })
  },
})

export const {
  clearError,
  optimisticCreateTask,
  optimisticUpdateTask,
  optimisticDeleteTask,
  optimisticMoveTask,
  rollbackOptimisticMove,
  clearOptimisticMoves,
  taskCreatedBySocket,
  taskUpdatedBySocket,
  taskDeletedBySocket,
  taskMovedBySocket,
} = tasksSlice.actions

export default tasksSlice.reducer
