#!/usr/bin/env node

const mongoose = require('mongoose')

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://armanansarig813:hngGrAHCpGvb4hwg@cluster0.bwkin.mongodb.net/'

// Realistic software development tasks
const realisticTasks = [
  {
    title: "Design user authentication flow",
    description: "Create wireframes and user flow for login/signup process",
    priority: "high",
    tags: ["UI/UX", "Design", "Authentication"]
  },
  {
    title: "Implement JWT authentication",
    description: "Set up JWT token-based authentication system with refresh tokens",
    priority: "urgent",
    tags: ["Backend", "Security", "API"]
  },
  {
    title: "Create responsive dashboard layout",
    description: "Build responsive dashboard component with sidebar navigation",
    priority: "medium",
    tags: ["Frontend", "UI/UX", "Responsive"]
  },
  {
    title: "Set up database migrations",
    description: "Create initial database schema and migration scripts",
    priority: "high",
    tags: ["Database", "Backend", "Migration"]
  },
  {
    title: "Write unit tests for user service",
    description: "Add comprehensive unit tests for user-related API endpoints",
    priority: "medium",
    tags: ["Testing", "Backend", "Quality"]
  },
  {
    title: "Optimize API performance",
    description: "Profile and optimize slow API endpoints, add caching where needed",
    priority: "low",
    tags: ["Performance", "Backend", "Optimization"]
  },
  {
    title: "Add drag-and-drop functionality",
    description: "Implement drag-and-drop for task cards between columns",
    priority: "urgent",
    tags: ["Frontend", "Feature", "UX"]
  },
  {
    title: "Configure CI/CD pipeline",
    description: "Set up automated testing and deployment pipeline",
    priority: "medium",
    tags: ["DevOps", "CI/CD", "Automation"]
  },
  {
    title: "Fix mobile navigation bug",
    description: "Resolve issue where mobile menu doesn't close after selection",
    priority: "high",
    tags: ["Bug", "Mobile", "Frontend"]
  },
  {
    title: "Update documentation",
    description: "Update API documentation and add setup instructions",
    priority: "low",
    tags: ["Documentation", "Maintenance"]
  },
  {
    title: "Implement real-time notifications",
    description: "Add WebSocket support for real-time task updates",
    priority: "medium",
    tags: ["Feature", "WebSocket", "Real-time"]
  },
  {
    title: "Add task filtering options",
    description: "Allow users to filter tasks by priority, assignee, and tags",
    priority: "medium",
    tags: ["Frontend", "Feature", "Filter"]
  },
  {
    title: "Implement dark mode",
    description: "Add dark/light theme toggle functionality",
    priority: "low",
    tags: ["Frontend", "UI/UX", "Theme"]
  },
  {
    title: "Security audit",
    description: "Conduct security review and implement recommended fixes",
    priority: "high",
    tags: ["Security", "Audit", "Quality"]
  },
  {
    title: "Add task due date reminders",
    description: "Send email notifications for upcoming task deadlines",
    priority: "medium",
    tags: ["Feature", "Email", "Notifications"]
  }
]

async function addRealisticTasks() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Get existing board and columns
    const boards = await mongoose.connection.db.collection('boards').find({}).toArray()
    if (boards.length === 0) {
      console.log('No boards found. Please run the main seed script first.')
      return
    }

    const board = boards.find(b => b._id.toString() === '507f1f77bcf86cd799439012') || boards[0]
    console.log('Using board:', board.title)

    const columns = await mongoose.connection.db.collection('columns').find({ boardId: board._id }).toArray()
    const users = await mongoose.connection.db.collection('users').find({}).toArray()

    if (columns.length === 0 || users.length === 0) {
      console.log('No columns or users found. Please run the main seed script first.')
      return
    }

    console.log(`Found ${columns.length} columns and ${users.length} users`)

    // Distribute tasks across columns
    const columnNames = ['Backlog', 'Todo', 'In Progress', 'Review', 'Done']
    const distributions = [0.4, 0.3, 0.2, 0.08, 0.02] // Most in backlog, fewer in done

    let taskIndex = 0
    const tasksToCreate = []

    for (let i = 0; i < columnNames.length; i++) {
      const column = columns.find(c => c.title === columnNames[i]) || columns[i % columns.length]
      const taskCount = Math.ceil(realisticTasks.length * distributions[i])
      
      for (let j = 0; j < taskCount && taskIndex < realisticTasks.length; j++) {
        const task = realisticTasks[taskIndex]
        const randomUsers = users.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1)
        
        const newTask = {
          _id: new mongoose.Types.ObjectId(),
          title: task.title,
          description: task.description,
          priority: task.priority,
          tags: task.tags,
          assignees: randomUsers.map(u => u._id),
          columnId: column._id.toString(),
          boardId: board._id.toString(),
          order: j,
          dueDate: Math.random() > 0.5 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        tasksToCreate.push(newTask)
        taskIndex++
      }
    }

    // Insert the realistic tasks
    if (tasksToCreate.length > 0) {
      await mongoose.connection.db.collection('tasks').insertMany(tasksToCreate)
      console.log(`Added ${tasksToCreate.length} realistic tasks to the board`)
    }

    console.log('Realistic tasks added successfully!')

  } catch (error) {
    console.error('Error adding realistic tasks:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

// Run the function
if (require.main === module) {
  addRealisticTasks()
}

module.exports = { addRealisticTasks }
