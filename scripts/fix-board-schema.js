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

async function fixBoardSchema() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Drop the boards collection to reset the schema
    const db = mongoose.connection.db
    const collections = await db.listCollections({ name: 'boards' }).toArray()
    
    if (collections.length > 0) {
      console.log('Found boards collection, dropping it...')
      await db.collection('boards').drop()
      console.log('✅ Boards collection dropped')
    } else {
      console.log('No boards collection found')
    }
    
    console.log('✅ Schema reset complete. You can now create boards with the correct schema.')
    process.exit(0)
  } catch (error) {
    console.error('Error fixing board schema:', error)
    process.exit(1)
  }
}

fixBoardSchema()
