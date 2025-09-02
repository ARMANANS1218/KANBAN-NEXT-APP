import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UIState, Task, FilterOptions, SortOptions, OptimisticAction } from '@/types'

const initialState: UIState = {
  isLoading: false,
  error: null,
  selectedTask: null,
  isTaskModalOpen: false,
  isBoardModalOpen: false,
  isColumnModalOpen: false,
  theme: 'system',
  sidebarCollapsed: false,
  filterOptions: {
    search: '',
    assignees: [],
    tags: [],
    priorities: [],
  },
  sortOptions: {
    field: 'createdAt',
    direction: 'desc',
  },
  optimisticActions: [],
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload
    },
    setTaskModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isTaskModalOpen = action.payload
      if (!action.payload) {
        state.selectedTask = null
      }
    },
    setBoardModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isBoardModalOpen = action.payload
    },
    setColumnModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isColumnModalOpen = action.payload
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload
    },
    setFilterOptions: (state, action: PayloadAction<Partial<FilterOptions>>) => {
      state.filterOptions = { ...state.filterOptions, ...action.payload }
    },
    setSortOptions: (state, action: PayloadAction<SortOptions>) => {
      state.sortOptions = action.payload
    },
    clearFilters: (state) => {
      state.filterOptions = {
        search: '',
        assignees: [],
        tags: [],
        priorities: [],
      }
    },
    addOptimisticAction: (state, action: PayloadAction<OptimisticAction>) => {
      state.optimisticActions.push(action.payload)
    },
    removeOptimisticAction: (state, action: PayloadAction<string>) => {
      state.optimisticActions = state.optimisticActions.filter(
        action => action.id !== action.payload
      )
    },
    clearOptimisticActions: (state) => {
      state.optimisticActions = []
    },
    showNotification: (state, action: PayloadAction<{
      type: 'success' | 'error' | 'info' | 'warning'
      message: string
      duration?: number
    }>) => {
      // This will be handled by toast notifications in components
    },
  },
})

export const {
  setLoading,
  setError,
  clearError,
  setSelectedTask,
  setTaskModalOpen,
  setBoardModalOpen,
  setColumnModalOpen,
  setTheme,
  setSidebarCollapsed,
  setFilterOptions,
  setSortOptions,
  clearFilters,
  addOptimisticAction,
  removeOptimisticAction,
  clearOptimisticActions,
  showNotification,
} = uiSlice.actions

export default uiSlice.reducer
