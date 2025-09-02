const { createServer } = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kanban-board'

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err))

// Create HTTP server
const httpServer = createServer()

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"]
  }
})

// Store active users per board
const boardUsers = new Map()

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Join board room
  socket.on('join-board', ({ boardId, userId }) => {
    socket.join(boardId)
    socket.boardId = boardId
    socket.userId = userId

    // Add user to board users
    if (!boardUsers.has(boardId)) {
      boardUsers.set(boardId, new Set())
    }
    boardUsers.get(boardId).add(userId)

    console.log(`User ${userId} joined board ${boardId}`)

    // Notify other users in the board
    socket.to(boardId).emit('user-connected', { 
      userId,
      timestamp: Date.now()
    })

    // Send current board users to the new user
    const currentUsers = Array.from(boardUsers.get(boardId) || [])
    socket.emit('board-users', { users: currentUsers })
  })

  // Leave board room
  socket.on('leave-board', ({ boardId, userId }) => {
    socket.leave(boardId)

    // Remove user from board users
    if (boardUsers.has(boardId)) {
      boardUsers.get(boardId).delete(userId)
      if (boardUsers.get(boardId).size === 0) {
        boardUsers.delete(boardId)
      }
    }

    console.log(`User ${userId} left board ${boardId}`)

    // Notify other users in the board
    socket.to(boardId).emit('user-disconnected', { 
      userId,
      timestamp: Date.now()
    })
  })

  // Task events
  socket.on('task-created', (data) => {
    console.log('Task created:', data.task?.title)
    socket.to(data.boardId).emit('task-created', data)
  })

  socket.on('task-updated', (data) => {
    console.log('Task updated:', data.task?.title)
    socket.to(data.boardId).emit('task-updated', data)
  })

  socket.on('task-deleted', (data) => {
    console.log('Task deleted:', data.taskId)
    socket.to(data.boardId).emit('task-deleted', data)
  })

  socket.on('task-moved', (data) => {
    console.log('Task moved:', data.taskId, 'to column', data.destinationColumnId)
    socket.to(data.boardId).emit('task-moved', data)
  })

  // Board events
  socket.on('board-updated', (data) => {
    console.log('Board updated:', data.board?.title)
    socket.to(data.board?.id || socket.boardId).emit('board-updated', data)
  })

  // Column events
  socket.on('column-created', (data) => {
    console.log('Column created:', data.column?.title)
    socket.to(data.boardId).emit('column-created', data)
  })

  socket.on('column-updated', (data) => {
    console.log('Column updated:', data.column?.title)
    socket.to(data.boardId).emit('column-updated', data)
  })

  socket.on('column-deleted', (data) => {
    console.log('Column deleted:', data.columnId)
    socket.to(data.boardId).emit('column-deleted', data)
  })

  // Typing indicators (for real-time collaboration)
  socket.on('start-typing', (data) => {
    socket.to(data.boardId).emit('user-typing', {
      userId: data.userId,
      taskId: data.taskId,
      timestamp: Date.now()
    })
  })

  socket.on('stop-typing', (data) => {
    socket.to(data.boardId).emit('user-stopped-typing', {
      userId: data.userId,
      taskId: data.taskId,
      timestamp: Date.now()
    })
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)

    // Clean up user from board
    if (socket.boardId && socket.userId) {
      if (boardUsers.has(socket.boardId)) {
        boardUsers.get(socket.boardId).delete(socket.userId)
        if (boardUsers.get(socket.boardId).size === 0) {
          boardUsers.delete(socket.boardId)
        }
      }

      // Notify other users in the board
      socket.to(socket.boardId).emit('user-disconnected', { 
        userId: socket.userId,
        timestamp: Date.now()
      })
    }
  })

  // Error handling
  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })
})

// Health check endpoint
httpServer.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      activeBoards: boardUsers.size,
      totalConnections: io.engine.clientsCount
    }))
  } else {
    res.writeHead(404)
    res.end('Not Found')
  }
})

const PORT = process.env.SOCKET_PORT || 3002

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
  console.log(`Health check available at http://localhost:${PORT}/health`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down socket server...')
  httpServer.close(() => {
    mongoose.disconnect()
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('Shutting down socket server...')
  httpServer.close(() => {
    mongoose.disconnect()
    process.exit(0)
  })
})
