#!/usr/bin/env node

const mongoose = require('mongoose')
const { faker } = require('@faker-js/faker')

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kanban-board'

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  color: { type: String, required: true },
}, {
  timestamps: true,
})

// Task Schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  tags: [{ type: String }],
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  columnId: { type: mongoose.Schema.Types.ObjectId, ref: 'Column', required: true },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  order: { type: Number, required: true, default: 0 },
  dueDate: { type: Date },
}, {
  timestamps: true,
})

// Column Schema
const columnSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  order: { type: Number, required: true, default: 0 },
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
}, {
  timestamps: true,
})

// Board Schema
const boardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  columns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Column' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
})

// Models
const User = mongoose.models.User || mongoose.model('User', userSchema)
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema)
const Column = mongoose.models.Column || mongoose.model('Column', columnSchema)
const Board = mongoose.models.Board || mongoose.model('Board', boardSchema)

const colors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e'
]

const taskTags = [
  'Frontend', 'Backend', 'API', 'UI/UX', 'Bug', 'Feature',
  'Enhancement', 'Documentation', 'Testing', 'Performance',
  'Security', 'Refactor', 'Mobile', 'Desktop'
]

const priorities = ['low', 'medium', 'high', 'urgent']

async function generateUsers(count = 10) {
  const users = []
  
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const user = new User({
      name: `${firstName} ${lastName}`,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      avatar: faker.image.avatar(),
      color: colors[Math.floor(Math.random() * colors.length)],
    })
    
    users.push(user)
  }
  
  return await User.insertMany(users)
}

async function generateColumns(boardId, columnTitles) {
  const columns = []
  
  for (let i = 0; i < columnTitles.length; i++) {
    const column = new Column({
      title: columnTitles[i],
      order: i,
      boardId,
      tasks: [],
    })
    
    columns.push(column)
  }
  
  return await Column.insertMany(columns)
}

async function generateTasks(columns, users, boardId, tasksPerColumn = 5) {
  const tasks = []
  
  for (const column of columns) {
    for (let i = 0; i < tasksPerColumn; i++) {
      const assigneeCount = Math.floor(Math.random() * 3) + 1
      const selectedAssignees = faker.helpers.arrayElements(users, assigneeCount)
      const tagCount = Math.floor(Math.random() * 4) + 1
      const selectedTags = faker.helpers.arrayElements(taskTags, tagCount)
      
      const task = new Task({
        title: faker.lorem.sentence({ min: 2, max: 6 }).replace(/\.$/, ''),
        description: Math.random() > 0.3 ? faker.lorem.paragraphs(2) : undefined,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        tags: selectedTags,
        assignees: selectedAssignees.map(u => u._id),
        columnId: column._id,
        boardId,
        order: i,
        dueDate: Math.random() > 0.5 ? faker.date.future() : undefined,
      })
      
      tasks.push(task)
    }
  }
  
  const savedTasks = await Task.insertMany(tasks)
  
  // Update columns with task references
  for (const column of columns) {
    const columnTasks = savedTasks.filter(task => 
      task.columnId.toString() === column._id.toString()
    )
    column.tasks = columnTasks.map(task => task._id)
    await column.save()
  }
  
  return savedTasks
}

async function generateBoard(users) {
  const owner = users[0]
  const members = faker.helpers.arrayElements(users, Math.floor(Math.random() * 5) + 3)
  
  const board = new Board({
    title: faker.company.name() + ' Project',
    description: faker.lorem.paragraph(),
    members: members.map(u => u._id),
    owner: owner._id,
    columns: [],
  })
  
  const savedBoard = await board.save()
  
  // Create columns for the board
  const columnTitles = ['Backlog', 'Todo', 'In Progress', 'Review', 'Done']
  const columns = await generateColumns(savedBoard._id, columnTitles)
  
  // Update board with column references
  savedBoard.columns = columns.map(col => col._id)
  await savedBoard.save()
  
  // Generate tasks for the columns
  await generateTasks(columns, users, savedBoard._id)
  
  return savedBoard
}

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')
    
    // Clear existing data
    console.log('Clearing existing data...')
    await Task.deleteMany({})
    await Column.deleteMany({})
    await Board.deleteMany({})
    await User.deleteMany({})
    
    // Generate users
    console.log('Generating users...')
    const users = await generateUsers(10)
    console.log(`Created ${users.length} users`)
    
    // Generate demo board
    console.log('Generating demo board...')
    const board = await generateBoard(users)
    console.log(`Created board: ${board.title}`)
    
    // Create a special demo board with ID 'demo'
    const demoBoard = new Board({
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
      title: 'Demo Kanban Board',
      description: 'A demonstration board showcasing all features',
      members: users.slice(0, 5).map(u => u._id),
      owner: users[0]._id,
      columns: [],
    })
    
    await demoBoard.save()
    
    // Create columns for demo board
    const demoColumns = await generateColumns(demoBoard._id, [
      'Backlog', 'Todo', 'In Progress', 'Review', 'Done'
    ])
    
    demoBoard.columns = demoColumns.map(col => col._id)
    await demoBoard.save()
    
    // Generate tasks for demo board
    await generateTasks(demoColumns, users, demoBoard._id, 8)
    
    console.log('Demo board created with ID:', demoBoard._id)
    console.log('Database seeded successfully!')
    
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase()
}

module.exports = { seedDatabase }
