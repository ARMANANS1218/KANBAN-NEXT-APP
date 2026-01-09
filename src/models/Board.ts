import mongoose, { Schema, Document, Model, Types } from 'mongoose'

// Interface for Column subdocument
interface IColumnDoc {
  title: string
  position: number
  createdAt?: Date
  updatedAt?: Date
}

export interface IColumn {
  _id: string
  title: string
  position: number
  createdAt: Date
  updatedAt: Date
}

// Interface for Board document (with ObjectId for database)
interface IBoardDoc {
  title: string
  description?: string
  owner: Types.ObjectId
  members?: Types.ObjectId[]
  columns: IColumnDoc[]
  createdAt: Date
  updatedAt: Date
}

// Interface for the populated/hydrated document (with string for app use)
export interface IBoard extends Document {
  _id: string
  title: string
  description?: string
  owner: Types.ObjectId | string
  members?: (Types.ObjectId | string)[]
  columns: IColumn[]
  createdAt: Date
  updatedAt: Date
}

const ColumnSchema = new Schema<IColumnDoc>(
  {
    title: {
      type: String,
      required: [true, 'Column title is required'],
      trim: true,
      maxlength: [100, 'Column title cannot exceed 100 characters'],
    },
    position: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
)

const BoardSchema = new Schema<IBoardDoc>(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
      maxlength: [200, 'Board title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Board description cannot exceed 1000 characters'],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Board owner is required'],
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    columns: [ColumnSchema],
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
BoardSchema.index({ owner: 1 })
BoardSchema.index({ members: 1 })
// Ensure column positions are unique within a board
BoardSchema.index({ 'columns.position': 1 })

// Clear any existing model to force recompilation
if (mongoose.models.Board) {
  delete mongoose.models.Board
}

const Board = mongoose.model('Board', BoardSchema) as unknown as Model<IBoard>

export { Board }
export default Board
