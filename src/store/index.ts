import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

import boardsReducer from './boardsSlice'
import tasksReducer from './tasksSlice'
import usersReducer from './usersSlice'
import uiReducer from './uiSlice'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    boards: boardsReducer,
    tasks: tasksReducer,
    users: usersReducer,
    ui: uiReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state
        ignoredPaths: [
          'tasks.tasks',
          'ui.selectedTask',
          'ui.optimisticActions',
        ],
        // Ignore these action types
        ignoredActions: [
          'persist/PERSIST',
          'tasks/fetchTasks/fulfilled',
          'tasks/createTask/fulfilled',
          'tasks/updateTask/fulfilled',
          'tasks/optimisticCreateTask',
          'tasks/optimisticUpdateTask',
          'ui/setSelectedTask',
          'ui/addOptimisticAction',
        ],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
