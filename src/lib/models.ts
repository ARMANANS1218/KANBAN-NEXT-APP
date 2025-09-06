import { Schema, model, models, Document } from 'mongoose'
import { User, Board, Column, Task } from '@/types'

// User Schema
const userSchema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  color: { type: String, required: true },
}, {
  timestamps: true,
})

// Task Schema
const taskSchema = new Schema<Task>({
  title: { type: String, required: true },
  description: { type: String },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  tags: [{ type: String }],
  assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  columnId: { type: String, required: true },
  boardId: { type: String, required: true },
  order: { type: Number, required: true, default: 0 },
  dueDate: { type: Date },
}, {
  timestamps: true,
})

// Column Schema
const columnSchema = new Schema<Column>({
  title: { type: String, required: true },
  tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  order: { type: Number, required: true, default: 0 },
  boardId: { type: String, required: true },
}, {
  timestamps: true,
})

// Board Schema
const boardSchema = new Schema<Board>({
  title: { type: String, required: true },
  description: { type: String },
  columns: [{ type: Schema.Types.ObjectId, ref: 'Column' }],
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  owner: { type: String, required: true },
}, {
  timestamps: true,
})

// Add indexes for better performance
taskSchema.index({ boardId: 1, columnId: 1, order: 1 })
taskSchema.index({ assignees: 1 })
taskSchema.index({ tags: 1 })
columnSchema.index({ boardId: 1, order: 1 })
boardSchema.index({ owner: 1 })
boardSchema.index({ members: 1 })

// Export models
export const UserModel = models.User || model<User>('User', userSchema)
export const TaskModel = models.Task || model<Task>('Task', taskSchema)
export const ColumnModel = models.Column || model<Column>('Column', columnSchema)
export const BoardModel = models.Board || model<Board>('Board', boardSchema)
