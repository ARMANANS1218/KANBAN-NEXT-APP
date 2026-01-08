import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITask extends Document {
  _id: string
  title: string
  description?: string
  columnId: string
  boardId: string
  position: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  tags?: string[]
  assignees?: string[] // User IDs
  dueDate?: Date
  createdBy: string // User ID
  createdAt: Date
  updatedAt: Date
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    columnId: {
      type: String,
      required: [true, 'Column ID is required'],
    },
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board ID is required'],
    },
    position: {
      type: Number,
      required: true,
      default: 0,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    assignees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    dueDate: Date,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
TaskSchema.index({ boardId: 1, columnId: 1, position: 1 })
TaskSchema.index({ assignees: 1 })
TaskSchema.index({ createdBy: 1 })

let Task: Model<ITask>

try {
  Task = mongoose.model<ITask>('Task')
} catch (error) {
  Task = mongoose.model<ITask>('Task', TaskSchema)
}

export { Task }
export default Task
