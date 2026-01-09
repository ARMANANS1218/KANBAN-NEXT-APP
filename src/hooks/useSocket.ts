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

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002'
    console.log('Connecting to socket server at:', socketUrl)

    // Initialize socket connection with optimized settings
    socketRef.current = io(socketUrl, {
      query: {
        userId: currentUser._id,
        boardId: boardId || '',
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      // Optimize for performance
      forceNew: false,
      multiplex: true,
    })

    const socket = socketRef.current

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected successfully!')
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message)
    })

    socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected:', reason)
      // Only log, don't show UI notification to avoid spam
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts')
    })

    // Join board room if boardId is provided (with debounce)
    if (boardId) {
      // Small delay to batch join requests
      const joinTimer = setTimeout(() => {
        socket.emit('join-board', { boardId, userId: currentUser._id })
        console.log('Joining board room:', boardId)
      }, 100)
      
      return () => clearTimeout(joinTimer)
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
