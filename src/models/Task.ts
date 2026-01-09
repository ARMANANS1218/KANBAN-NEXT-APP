import mongoose, { Schema, Document, Model, Types } from 'mongoose'

// Interface for the document (with ObjectId for database)
interface ITaskDoc {
  title: string
  description?: string
  columnId: string
  boardId: Types.ObjectId
  position: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  tags?: string[]
  assignees?: Types.ObjectId[]
  dueDate?: Date
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// Interface for the populated/hydrated document (with string for app use)
export interface ITask extends Document {
  _id: string
  title: string
  description?: string
  columnId: string
  boardId: Types.ObjectId | string
  position: number
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  tags?: string[]
  assignees?: (Types.ObjectId | string)[]
  dueDate?: Date
  createdBy: Types.ObjectId | string
  createdAt: Date
  updatedAt: Date
}

const TaskSchema = new Schema<ITaskDoc>(
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
  Task = mongoose.model('Task') as unknown as Model<ITask>
} catch (error) {
  Task = mongoose.model('Task', TaskSchema) as unknown as Model<ITask>
}

export { Task }
export default Task
