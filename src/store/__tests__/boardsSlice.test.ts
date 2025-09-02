import { configureStore } from '@reduxjs/toolkit'
import boardsReducer, {
  setCurrentBoard,
  clearError,
  optimisticCreateBoard,
  optimisticUpdateBoard,
  optimisticDeleteBoard,
} from '../boardsSlice'
import { Board } from '@/types'

// Mock data
const mockBoard: Board = {
  _id: '1',
  title: 'Test Board',
  description: 'A test board',
  columns: [],
  members: [],
  owner: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('boardsSlice', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        boards: boardsReducer,
      },
    })
  })

  it('should handle initial state', () => {
    const state = store.getState().boards
    expect(state.boards).toEqual([])
    expect(state.currentBoard).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('should handle setCurrentBoard', () => {
    store.dispatch(setCurrentBoard(mockBoard))
    const state = store.getState().boards
    expect(state.currentBoard).toEqual(mockBoard)
  })

  it('should handle clearError', () => {
    // Set an error first
    store = configureStore({
      reducer: {
        boards: boardsReducer,
      },
      preloadedState: {
        boards: {
          boards: [],
          currentBoard: null,
          isLoading: false,
          error: 'Test error',
        },
      },
    })

    store.dispatch(clearError())
    const state = store.getState().boards
    expect(state.error).toBeNull()
  })

  it('should handle optimisticCreateBoard', () => {
    store.dispatch(optimisticCreateBoard(mockBoard))
    const state = store.getState().boards
    expect(state.boards).toContain(mockBoard)
  })

  it('should handle optimisticUpdateBoard', () => {
    // Add a board first
    store.dispatch(optimisticCreateBoard(mockBoard))
    
    const updatedBoard = { ...mockBoard, title: 'Updated Board' }
    store.dispatch(optimisticUpdateBoard(updatedBoard))
    
    const state = store.getState().boards
    expect(state.boards[0].title).toBe('Updated Board')
  })

  it('should handle optimisticDeleteBoard', () => {
    // Add a board first
    store.dispatch(optimisticCreateBoard(mockBoard))
    expect(store.getState().boards.boards).toHaveLength(1)
    
    store.dispatch(optimisticDeleteBoard(mockBoard._id))
    const state = store.getState().boards
    expect(state.boards).toHaveLength(0)
  })

  it('should update currentBoard when optimisticUpdateBoard is called on current board', () => {
    store.dispatch(setCurrentBoard(mockBoard))
    
    const updatedBoard = { ...mockBoard, title: 'Updated Current Board' }
    store.dispatch(optimisticUpdateBoard(updatedBoard))
    
    const state = store.getState().boards
    expect(state.currentBoard?.title).toBe('Updated Current Board')
  })

  it('should clear currentBoard when optimisticDeleteBoard is called on current board', () => {
    store.dispatch(setCurrentBoard(mockBoard))
    store.dispatch(optimisticDeleteBoard(mockBoard._id))
    
    const state = store.getState().boards
    expect(state.currentBoard).toBeNull()
  })
})
