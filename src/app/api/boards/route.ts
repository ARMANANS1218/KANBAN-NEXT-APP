import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { BoardModel } from '@/lib/models'

export async function GET() {
  try {
    await connectDB()
    
    const boards = await BoardModel.find()
      .populate('members', 'name email avatar color')
      .populate({
        path: 'columns',
        populate: {
          path: 'tasks',
          populate: {
            path: 'assignees',
            select: 'name email avatar color'
          }
        }
      })
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
    
    const data = await request.json()
    const { title, description, members } = data
    
    const board = new BoardModel({
      title,
      description,
      members: members || [],
      owner: members?.[0] || '507f1f77bcf86cd799439011', // Demo user ID
      columns: [],
    })
    
    const savedBoard = await board.save()
    await savedBoard.populate('members', 'name email avatar color')
    
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
