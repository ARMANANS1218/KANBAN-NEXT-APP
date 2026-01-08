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

async function removeSeedUsers() {
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
    
    // Find all users
    const allUsers = await User.find()
    console.log(`\nFound ${allUsers.length} total users:`)
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Provider: ${user.provider || 'N/A'}`)
    })
    
    // Remove users without password (seed/demo users)
    // Keep users with provider='local' or provider='google' (real registered users)
    const seedUsers = await User.find({ 
      $or: [
        { password: { $exists: false } },
        { provider: { $exists: false } }
      ]
    })
    
    if (seedUsers.length === 0) {
      console.log('\n✅ No seed users found. All users are registered users.')
      process.exit(0)
    }
    
    console.log(`\n\nFound ${seedUsers.length} seed/demo users to remove:`)
    seedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`)
    })
    
    const result = await User.deleteMany({
      $or: [
        { password: { $exists: false } },
        { provider: { $exists: false } }
      ]
    })
    
    console.log(`\n✅ Removed ${result.deletedCount} seed users`)
    console.log('✅ Only registered users remain in the database')
    
    // Show remaining users
    const remainingUsers = await User.find()
    console.log(`\n${remainingUsers.length} users remaining:`)
    remainingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('Error removing seed users:', error)
    process.exit(1)
  }
}

removeSeedUsers()
