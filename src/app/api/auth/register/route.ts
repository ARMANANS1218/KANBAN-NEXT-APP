import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { User } from '@/models/User'
import { generateToken } from '@/lib/jwt'
import { generateUserColor } from '@/utils'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { name, email, password, phone, avatar } = await request.json()

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone: phone || '',
      avatar: avatar || 'avatar-1',
      color: generateUserColor(),
      provider: 'local',
      isEmailVerified: false,
    })

    await user.save()

    const token = generateToken(user._id.toString(), user.email)

    // Return user without password
    const userResponse = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      profileImage: user.profileImage,
      color: user.color,
      provider: user.provider,
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: userResponse,
          token,
        },
        message: 'User registered successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
