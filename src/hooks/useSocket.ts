import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  taskCreatedBySocket,
  taskUpdatedBySocket,
  taskDeletedBySocket,
  taskMovedBySocket,
} from '@/store/tasksSlice'
import { boardUpdatedBySocket } from '@/store/boardsSlice'
import { userConnected, userDisconnected } from '@/store/usersSlice'
import {
  TaskCreatedEventData,
  TaskUpdatedEventData,
  TaskDeletedEventData,
  TaskMovedEventData,
} from '@/types'

export const useSocket = (boardId?: string) => {
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector(state => state.users.currentUser)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!currentUser) return

    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002', {
      query: {
        userId: currentUser._id,
        boardId: boardId || '',
      },
    })

    const socket = socketRef.current

    // Join board room if boardId is provided
    if (boardId) {
      socket.emit('join-board', { boardId, userId: currentUser._id })
    }

    // Task events
    socket.on('task-created', (data: TaskCreatedEventData) => {
      if (data.userId !== currentUser._id) {
        dispatch(taskCreatedBySocket(data.task))
      }
    })

    socket.on('task-updated', (data: TaskUpdatedEventData) => {
      if (data.userId !== currentUser._id) {
        dispatch(taskUpdatedBySocket(data.task))
      }
    })

    socket.on('task-deleted', (data: TaskDeletedEventData) => {
      if (data.userId !== currentUser._id) {
        dispatch(taskDeletedBySocket(data.taskId))
      }
    })

    socket.on('task-moved', (data: TaskMovedEventData & { task: any; affectedTasks: any[] }) => {
      if (data.userId !== currentUser._id) {
        dispatch(taskMovedBySocket({
          task: data.task,
          affectedTasks: data.affectedTasks,
        }))
      }
    })

    // Board events
    socket.on('board-updated', (data: { board: any; userId: string }) => {
      if (data.userId !== currentUser._id) {
        dispatch(boardUpdatedBySocket(data.board))
      }
    })

    // User events
    socket.on('user-connected', (data: { user: any }) => {
      dispatch(userConnected(data.user))
    })

    socket.on('user-disconnected', (data: { userId: string }) => {
      dispatch(userDisconnected(data.userId))
    })

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to socket server')
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from socket server')
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    return () => {
      if (boardId) {
        socket.emit('leave-board', { boardId, userId: currentUser._id })
      }
      socket.disconnect()
    }
  }, [currentUser, boardId, dispatch])

  const emitTaskCreated = (taskData: any) => {
    if (socketRef.current && currentUser) {
      socketRef.current.emit('task-created', {
        ...taskData,
        userId: currentUser._id,
        timestamp: Date.now(),
      })
    }
  }

  const emitTaskUpdated = (taskData: any) => {
    if (socketRef.current && currentUser) {
      socketRef.current.emit('task-updated', {
        ...taskData,
        userId: currentUser._id,
        timestamp: Date.now(),
      })
    }
  }

  const emitTaskDeleted = (taskId: string, columnId: string, boardId: string) => {
    if (socketRef.current && currentUser) {
      socketRef.current.emit('task-deleted', {
        taskId,
        columnId,
        boardId,
        userId: currentUser._id,
        timestamp: Date.now(),
      })
    }
  }

  const emitTaskMoved = (moveData: {
    taskId: string
    sourceColumnId: string
    destinationColumnId: string
    sourceIndex: number
    destinationIndex: number
    boardId: string
    task: any
    affectedTasks: any[]
  }) => {
    if (socketRef.current && currentUser) {
      socketRef.current.emit('task-moved', {
        ...moveData,
        userId: currentUser._id,
        timestamp: Date.now(),
      })
    }
  }

  const emitBoardUpdated = (boardData: any) => {
    if (socketRef.current && currentUser) {
      socketRef.current.emit('board-updated', {
        board: boardData,
        userId: currentUser._id,
        timestamp: Date.now(),
      })
    }
  }

  return {
    socket: socketRef.current,
    emitTaskCreated,
    emitTaskUpdated,
    emitTaskDeleted,
    emitTaskMoved,
    emitBoardUpdated,
  }
}
