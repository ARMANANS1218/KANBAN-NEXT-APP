import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { BoardModel, TaskModel } from '@/lib/models'
import { verifyToken } from '@/lib/jwt'

// Helper to get user ID from token
function extractUserId(request: NextRequest): string | null {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1]
    if (!token) return null
    
    const decoded = verifyToken(token)
    return decoded?.userId || null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const userId = extractUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Fetch boards where user is owner or member
    const boards = await BoardModel.find({
      $or: [
        { owner: userId },
        { members: userId }
      ]
    })
      .populate('owner', 'name email avatar color profileImage')
      .populate('members', 'name email avatar color profileImage')
      .sort({ updatedAt: -1 })
    
    return NextResponse.json({
      success: true,
      data: boards,
    })
  } catch (error) {
    console.error('Error fetching boards:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch boards' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const userId = extractUserId(request)
    console.log('POST /api/boards: userId extracted:', userId)
    
    if (!userId) {
      console.error('POST /api/boards: no userId, returning 401')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const data = await request.json()
    console.log('POST /api/boards: request data:', data)
    
    const { title, description, members } = data
    
    if (!title || !title.trim()) {
      console.error('POST /api/boards: no title provided')
      return NextResponse.json(
        { success: false, error: 'Board title is required' },
        { status: 400 }
      )
    }
    
    // Create board with current user as owner
    const memberArray = members ? (Array.isArray(members) ? members : [members]) : []
    
    // Always include owner in members
    if (!memberArray.includes(userId)) {
      memberArray.push(userId)
    }
    
    console.log('POST /api/boards: creating board with members:', memberArray)
    
    const board = new BoardModel({
      title,
      description: description || '',
      owner: userId,
      members: memberArray,
      columns: [
        { title: 'To Do', position: 0 },
        { title: 'In Progress', position: 1 },
        { title: 'Done', position: 2 }
      ],
    })
    
    const savedBoard = await board.save()
    console.log('POST /api/boards: board saved with id:', savedBoard._id)
    
    await savedBoard.populate('owner', 'name email avatar color')
    await savedBoard.populate('members', 'name email avatar color')
    
    console.log('POST /api/boards: success, returning board')
    return NextResponse.json({
      success: true,
      data: savedBoard,
    })
  } catch (error) {
    console.error('Error creating board:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create board' },
      { status: 500 }
    )
  }
}
