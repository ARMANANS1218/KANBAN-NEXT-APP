const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

// Manually load .env file
const envPath = path.join(__dirname, '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = envContent.split('\n').reduce((acc, line) => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    acc[key.trim()] = valueParts.join('=').trim()
  }
  return acc
}, {})

const MONGODB_URI = envVars.MONGODB_URI

const colors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e'
]

function generateUserColor() {
  return colors[Math.floor(Math.random() * colors.length)]
}

async function addColorsToUsers() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Define User schema inline
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      phone: String,
      password: String,
      avatar: String,
      profileImage: String,
      color: String,
      googleId: String,
      provider: String,
      isEmailVerified: Boolean
    }, { timestamps: true })

    const User = mongoose.models.User || mongoose.model('User', userSchema)
    
    // Find all users without a color field
    const usersWithoutColor = await User.find({ color: { $exists: false } })
    
    console.log(`Found ${usersWithoutColor.length} users without color field`)
    
    if (usersWithoutColor.length === 0) {
      console.log('✅ All users already have colors')
      process.exit(0)
    }
    
    // Update each user with a random color
    for (const user of usersWithoutColor) {
      user.color = generateUserColor()
      await user.save()
      console.log(`✅ Added color ${user.color} to user: ${user.email}`)
    }
    
    console.log(`✅ Successfully added colors to ${usersWithoutColor.length} users`)
    process.exit(0)
  } catch (error) {
    console.error('Error adding colors to users:', error)
    process.exit(1)
  }
}

addColorsToUsers()
