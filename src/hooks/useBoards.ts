import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  fetchBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  createColumn,
  setCurrentBoard,
  optimisticCreateBoard,
  optimisticUpdateBoard,
  optimisticDeleteBoard,
} from '@/store/boardsSlice'
import { addOptimisticAction, removeOptimisticAction, showNotification } from '@/store/uiSlice'
import { useSocket } from './useSocket'
import { Board, CreateBoardData, UpdateBoardData } from '@/types'
import { generateId } from '@/utils'

export const useBoards = () => {
  const dispatch = useAppDispatch()
  const { emitBoardUpdated } = useSocket()
  
  const boards = useAppSelector(state => state.boards.boards)
  const currentBoard = useAppSelector(state => state.boards.currentBoard)
  const isLoading = useAppSelector(state => state.boards.isLoading)
  const error = useAppSelector(state => state.boards.error)

  // Fetch boards
  const loadBoards = useCallback(async () => {
    try {
      await dispatch(fetchBoards()).unwrap()
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to load boards',
      }))
    }
  }, [dispatch])

  // Create board with optimistic update
  const createBoardOptimistic = useCallback(async (boardData: CreateBoardData) => {
    const optimisticId = `temp-${generateId()}`
    const optimisticBoard: Board = {
      _id: optimisticId,
      ...boardData,
      columns: [],
      members: [], // Will be populated after API call
      owner: '', // Will be set from current user
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Optimistic update
    dispatch(optimisticCreateBoard(optimisticBoard))
    dispatch(addOptimisticAction({
      id: optimisticId,
      type: 'CREATE_TASK', // Reusing type for simplicity
      data: optimisticBoard,
      timestamp: Date.now(),
    }))

    try {
      const result = await dispatch(createBoard(boardData)).unwrap()
      
      // Emit socket event
      emitBoardUpdated(result)
      
      dispatch(removeOptimisticAction(optimisticId))
      dispatch(showNotification({
        type: 'success',
        message: 'Board created successfully',
      }))
      
      return result
    } catch (error) {
      // Rollback optimistic update
      dispatch(optimisticDeleteBoard(optimisticId))
      dispatch(removeOptimisticAction(optimisticId))
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to create board',
      }))
      throw error
    }
  }, [dispatch, emitBoardUpdated])

  // Update board with optimistic update
  const updateBoardOptimistic = useCallback(async (boardData: UpdateBoardData) => {
    const originalBoard = boards.find(b => b._id === boardData._id)
    if (!originalBoard) return

    const optimisticBoard = { ...originalBoard, ...boardData, updatedAt: new Date() } as Board
    const actionId = generateId()

    // Optimistic update
    dispatch(optimisticUpdateBoard(optimisticBoard))
    dispatch(addOptimisticAction({
      id: actionId,
      type: 'UPDATE_TASK', // Reusing type for simplicity
      data: { original: originalBoard, updated: optimisticBoard },
      timestamp: Date.now(),
    }))

    try {
      const result = await dispatch(updateBoard(boardData)).unwrap()
      
      // Emit socket event
      emitBoardUpdated(result)
      
      dispatch(removeOptimisticAction(actionId))
      dispatch(showNotification({
        type: 'success',
        message: 'Board updated successfully',
      }))
      
      return result
    } catch (error) {
      // Rollback optimistic update
      dispatch(optimisticUpdateBoard(originalBoard))
      dispatch(removeOptimisticAction(actionId))
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to update board',
      }))
      throw error
    }
  }, [dispatch, boards, emitBoardUpdated])

  // Delete board with optimistic update
  const deleteBoardOptimistic = useCallback(async (boardId: string) => {
    const board = boards.find(b => b._id === boardId)
    if (!board) return

    const actionId = generateId()

    // Optimistic update
    dispatch(optimisticDeleteBoard(boardId))
    dispatch(addOptimisticAction({
      id: actionId,
      type: 'DELETE_TASK', // Reusing type for simplicity
      data: board,
      timestamp: Date.now(),
    }))

    try {
      await dispatch(deleteBoard(boardId)).unwrap()
      
      dispatch(removeOptimisticAction(actionId))
      dispatch(showNotification({
        type: 'success',
        message: 'Board deleted successfully',
      }))
    } catch (error) {
      // Rollback optimistic update
      dispatch(optimisticCreateBoard(board))
      dispatch(removeOptimisticAction(actionId))
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to delete board',
      }))
      throw error
    }
  }, [dispatch, boards])

  // Set current board
  const selectBoard = useCallback((board: Board | null) => {
    dispatch(setCurrentBoard(board))
  }, [dispatch])

  // Get board by ID
  const getBoardById = useCallback((boardId: string) => {
    return boards.find(board => board._id === boardId)
  }, [boards])

  // Create column
  const createBoardColumn = useCallback(async (boardId: string, title: string) => {
    try {
      await dispatch(createColumn({ boardId, title })).unwrap()
      dispatch(showNotification({
        type: 'success',
        message: 'Column created successfully',
      }))
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to create column',
      }))
    }
  }, [dispatch])

  return {
    boards,
    currentBoard,
    isLoading,
    error,
    loadBoards,
    createBoard: createBoardOptimistic,
    updateBoard: updateBoardOptimistic,
    deleteBoard: deleteBoardOptimistic,
    createColumn: createBoardColumn,
    selectBoard,
    getBoardById,
  }
}
