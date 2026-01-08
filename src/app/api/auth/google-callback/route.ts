import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { User } from '@/models/User'
import { generateToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const { googleId, email, name, picture } = await request.json()

    // Validation
    if (!googleId || !email) {
      return NextResponse.json(
        { error: 'Google ID and email are required' },
        { status: 400 }
      )
    }

    // Find or create user
    let user = await User.findOne({ $or: [{ googleId }, { email }] })

    if (!user) {
      // Create new user from Google
      user = new User({
        name: name || email.split('@')[0],
        email,
        googleId,
        avatar: 'avatar-1',
        profileImage: picture || undefined,
        provider: 'google',
        isEmailVerified: true,
      })
      await user.save()
    } else if (!user.googleId) {
      // Link Google to existing account
      user.googleId = googleId
      user.provider = 'google'
      if (picture && !user.profileImage) {
        user.profileImage = picture
      }
      await user.save()
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.email)

    // Return user
    const userResponse = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      profileImage: user.profileImage,
      provider: user.provider,
    }

    return NextResponse.json(
      {
        user: userResponse,
        token,
        message: 'Google login successful',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
