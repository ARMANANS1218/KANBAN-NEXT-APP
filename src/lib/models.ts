import { Schema, model, models, Document, Types } from 'mongoose'

// Mongoose document interfaces (using ObjectId)
interface IUserDoc extends Document {
  name: string
  email: string
  avatar?: string
  profileImage?: string
  color: string
  createdAt: Date
  updatedAt: Date
}

interface ITaskDoc extends Document {
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  assignees: Types.ObjectId[]
  columnId: string
  boardId: Types.ObjectId
  position: number
  dueDate?: Date
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

interface IColumnDoc {
  _id: Types.ObjectId
  title: string
  position: number
  createdAt: Date
  updatedAt: Date
}

interface IBoardDoc extends Document {
  title: string
  description?: string
  columns: IColumnDoc[]
  members: Types.ObjectId[]
  owner: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// User Schema
const userSchema = new Schema<IUserDoc>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  profileImage: { type: String },
  color: { type: String, required: true },
}, {
  timestamps: true,
})

// Task Schema
const taskSchema = new Schema<ITaskDoc>({
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
const columnSchema = new Schema<IColumnDoc>({
  title: { type: String, required: true },
  position: { type: Number, required: true, default: 0 },
}, {
  timestamps: true,
})

// Board Schema
const boardSchema = new Schema<IBoardDoc>({
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
export const UserModel = models.User || model<IUserDoc>('User', userSchema)
export const TaskModel = models.Task || model<ITaskDoc>('Task', taskSchema)
export const BoardModel = models.Board || model<IBoardDoc>('Board', boardSchema)
