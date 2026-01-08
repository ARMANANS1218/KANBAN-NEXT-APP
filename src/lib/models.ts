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
  boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
  position: { type: Number, required: true, default: 0 },
  dueDate: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
})

// Column Schema (for embedded documents in Board)
const columnSchema = new Schema({
  title: { type: String, required: true },
  position: { type: Number, required: true, default: 0 },
}, {
  timestamps: true,
})

// Board Schema
const boardSchema = new Schema<Board>({
  title: { type: String, required: true },
  description: { type: String },
  columns: [columnSchema], // Embedded subdocuments, not references
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
})

// Add indexes for better performance
taskSchema.index({ boardId: 1, columnId: 1, position: 1 })
taskSchema.index({ assignees: 1 })
taskSchema.index({ tags: 1 })
taskSchema.index({ createdBy: 1 })
boardSchema.index({ owner: 1 })
boardSchema.index({ members: 1 })

// Force model recompilation
if (models.Board) {
  delete models.Board
}
if (models.User) {
  delete models.User
}
if (models.Task) {
  delete models.Task
}

// Export models
export const UserModel = models.User || model<User>('User', userSchema)
export const TaskModel = models.Task || model<Task>('Task', taskSchema)
export const BoardModel = models.Board || model<Board>('Board', boardSchema)
