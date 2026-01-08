import mongoose, { Schema, Document, Model } from 'mongoose'
import bcrypt from 'bcrypt'

export interface IUser extends Document {
  _id: string
  name: string
  email: string
  phone?: string
  password?: string // Optional for OAuth users
  avatar?: string // URL or predefined avatar
  profileImage?: string // Custom uploaded profile image
  color: string // User color for avatars
  googleId?: string // Google OAuth ID
  provider?: 'local' | 'google' // Authentication provider
  isEmailVerified: boolean
  createdAt: Date
  updatedAt: Date
  comparePassword(password: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
      default: 'avatar-1', // Predefined avatar name
    },
    profileImage: {
      type: String, // URL of uploaded profile image
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
    },
    googleId: {
      type: String,
      sparse: true,
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    if (this.password) {
      this.password = await bcrypt.hash(this.password, salt)
    }
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  if (!this.password) return false
  return bcrypt.compare(password, this.password)
}

// Clear any existing model to force recompilation
if (mongoose.models.User) {
  delete mongoose.models.User
}

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema)

export { User }
export default User
