import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  moveTask,
  optimisticCreateTask,
  optimisticUpdateTask,
  optimisticDeleteTask,
  optimisticMoveTask,
  rollbackOptimisticMove,
} from '@/store/tasksSlice'
import { addOptimisticAction, removeOptimisticAction, showNotification } from '@/store/uiSlice'
import { useSocket } from './useSocket'
import { Task, CreateTaskData, UpdateTaskData, FilterOptions, SortOptions } from '@/types'
import { generateId } from '@/utils'

export const useTasks = (boardId?: string) => {
  const dispatch = useAppDispatch()
  const { emitTaskCreated, emitTaskUpdated, emitTaskDeleted, emitTaskMoved } = useSocket(boardId)
  
  const tasks = useAppSelector(state => state.tasks.tasks)
  const isLoading = useAppSelector(state => state.tasks.isLoading)
  const error = useAppSelector(state => state.tasks.error)
  const filterOptions = useAppSelector(state => state.ui.filterOptions)
  const sortOptions = useAppSelector(state => state.ui.sortOptions)
  const optimisticMoves = useAppSelector(state => state.tasks.optimisticMoves)

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks

    // Apply board filter
    if (boardId) {
      filtered = filtered.filter(task => task.boardId === boardId)
    }

    // Apply search filter
    if (filterOptions.search) {
      const search = filterOptions.search.toLowerCase()
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        task.tags.some(tag => tag.toLowerCase().includes(search))
      )
    }

    // Apply assignee filter
    if (filterOptions.assignees.length > 0) {
      filtered = filtered.filter(task =>
        task.assignees.some(assignee =>
          filterOptions.assignees.includes(assignee._id)
        )
      )
    }

    // Apply tag filter
    if (filterOptions.tags.length > 0) {
      filtered = filtered.filter(task =>
        task.tags.some(tag => filterOptions.tags.includes(tag))
      )
    }

    // Apply priority filter
    if (filterOptions.priorities.length > 0) {
      filtered = filtered.filter(task =>
        filterOptions.priorities.includes(task.priority)
      )
    }

    // Sort tasks
    filtered.sort((a, b) => {
      const { field, direction } = sortOptions
      let aValue: any = a[field]
      let bValue: any = b[field]

      // Handle date fields
      if (field === 'createdAt' || field === 'updatedAt' || field === 'dueDate') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      // Handle priority field
      if (field === 'priority') {
        const priorityOrder: Record<string, number> = { low: 1, medium: 2, high: 3, urgent: 4 }
        aValue = priorityOrder[aValue as string] || 0
        bValue = priorityOrder[bValue as string] || 0
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [tasks, boardId, filterOptions, sortOptions])

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    
    filteredAndSortedTasks.forEach(task => {
      if (!grouped[task.columnId]) {
        grouped[task.columnId] = []
      }
      grouped[task.columnId].push(task)
    })

    // Sort tasks within each column by order
    Object.keys(grouped).forEach(columnId => {
      grouped[columnId].sort((a, b) => a.order - b.order)
    })

    return grouped
  }, [filteredAndSortedTasks])

  // Fetch tasks
  const loadTasks = useCallback(async (boardId: string) => {
    try {
      await dispatch(fetchTasks(boardId)).unwrap()
    } catch (error) {
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to load tasks',
      }))
    }
  }, [dispatch])

  // Create task with optimistic update
  const createTaskOptimistic = useCallback(async (taskData: CreateTaskData) => {
    const optimisticId = `temp-${generateId()}`
    const optimisticTask: Task = {
      _id: optimisticId,
      ...taskData,
      assignees: [], // Will be populated after API call
      order: Date.now(), // Temporary order
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Optimistic update
    dispatch(optimisticCreateTask(optimisticTask))
    dispatch(addOptimisticAction({
      id: optimisticId,
      type: 'CREATE_TASK',
      data: optimisticTask,
      timestamp: Date.now(),
    }))

    try {
      const result = await dispatch(createTask(taskData)).unwrap()
      
      // Emit socket event
      emitTaskCreated({ task: result, boardId: taskData.boardId })
      
      dispatch(removeOptimisticAction(optimisticId))
      dispatch(showNotification({
        type: 'success',
        message: 'Task created successfully',
      }))
      
      return result
    } catch (error) {
      // Rollback optimistic update
      dispatch(optimisticDeleteTask(optimisticId))
      dispatch(removeOptimisticAction(optimisticId))
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to create task',
      }))
      throw error
    }
  }, [dispatch, emitTaskCreated])

  // Update task with optimistic update
  const updateTaskOptimistic = useCallback(async (taskData: UpdateTaskData) => {
    const originalTask = tasks.find(t => t._id === taskData._id)
    if (!originalTask) return

    const optimisticTask = { ...originalTask, ...taskData, updatedAt: new Date() } as Task
    const actionId = generateId()

    // Optimistic update
    dispatch(optimisticUpdateTask(optimisticTask))
    dispatch(addOptimisticAction({
      id: actionId,
      type: 'UPDATE_TASK',
      data: { original: originalTask, updated: optimisticTask },
      timestamp: Date.now(),
    }))

    try {
      const result = await dispatch(updateTask(taskData)).unwrap()
      
      // Emit socket event
      emitTaskUpdated({ task: result, boardId: result.boardId })
      
      dispatch(removeOptimisticAction(actionId))
      dispatch(showNotification({
        type: 'success',
        message: 'Task updated successfully',
      }))
      
      return result
    } catch (error) {
      // Rollback optimistic update
      dispatch(optimisticUpdateTask(originalTask))
      dispatch(removeOptimisticAction(actionId))
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to update task',
      }))
      throw error
    }
  }, [dispatch, tasks, emitTaskUpdated])

  // Delete task with optimistic update
  const deleteTaskOptimistic = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t._id === taskId)
    if (!task) return

    const actionId = generateId()

    // Optimistic update
    dispatch(optimisticDeleteTask(taskId))
    dispatch(addOptimisticAction({
      id: actionId,
      type: 'DELETE_TASK',
      data: task,
      timestamp: Date.now(),
    }))

    try {
      await dispatch(deleteTask(taskId)).unwrap()
      
      // Emit socket event
      emitTaskDeleted(taskId, task.columnId, task.boardId)
      
      dispatch(removeOptimisticAction(actionId))
      dispatch(showNotification({
        type: 'success',
        message: 'Task deleted successfully',
      }))
    } catch (error) {
      // Rollback optimistic update
      dispatch(optimisticCreateTask(task))
      dispatch(removeOptimisticAction(actionId))
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to delete task',
      }))
      throw error
    }
  }, [dispatch, tasks, emitTaskDeleted])

  // Move task with optimistic update
  const moveTaskOptimistic = useCallback(async (moveData: {
    taskId: string
    sourceColumnId: string
    destinationColumnId: string
    sourceIndex: number
    destinationIndex: number
  }) => {
    const moveId = generateId()
    const optimisticMoveData = { ...moveData, id: moveId }

    // Optimistic update
    dispatch(optimisticMoveTask(optimisticMoveData))
    dispatch(addOptimisticAction({
      id: moveId,
      type: 'MOVE_TASK',
      data: moveData,
      timestamp: Date.now(),
    }))

    try {
      const result = await dispatch(moveTask(moveData)).unwrap()
      
      // Emit socket event
      emitTaskMoved({
        ...moveData,
        boardId: result.task.boardId,
        task: result.task,
        affectedTasks: result.affectedTasks,
      })
      
      dispatch(removeOptimisticAction(moveId))
    } catch (error) {
      // Rollback optimistic update
      dispatch(rollbackOptimisticMove(moveId))
      dispatch(removeOptimisticAction(moveId))
      dispatch(showNotification({
        type: 'error',
        message: 'Failed to move task',
      }))
      throw error
    }
  }, [dispatch, emitTaskMoved])

  // Get tasks for a specific column
  const getTasksForColumn = useCallback((columnId: string) => {
    return tasksByColumn[columnId] || []
  }, [tasksByColumn])

  // Get task by ID
  const getTaskById = useCallback((taskId: string) => {
    return tasks.find(task => task._id === taskId)
  }, [tasks])

  // Check if there are pending optimistic operations
  const hasPendingOperations = optimisticMoves.length > 0

  return {
    tasks: filteredAndSortedTasks,
    tasksByColumn,
    isLoading,
    error,
    hasPendingOperations,
    loadTasks,
    createTask: createTaskOptimistic,
    updateTask: updateTaskOptimistic,
    deleteTask: deleteTaskOptimistic,
    moveTask: moveTaskOptimistic,
    getTasksForColumn,
    getTaskById,
  }
}
