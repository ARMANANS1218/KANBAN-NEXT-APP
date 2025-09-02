import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { UserModel } from '@/lib/models'
import { generateUserColor } from '@/utils'

export async function GET() {
  try {
    await connectDB()
    
    const users = await UserModel.find().sort({ name: 1 })
    
    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const data = await request.json()
    const { name, email } = data
    
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      )
    }
    
    const user = new UserModel({
      name,
      email,
      color: generateUserColor(),
    })
    
    const savedUser = await user.save()
    
    return NextResponse.json({
      success: true,
      data: savedUser,
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
