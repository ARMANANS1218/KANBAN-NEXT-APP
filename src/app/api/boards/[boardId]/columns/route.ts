import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Board } from '@/models/Board'

export async function POST(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    await connectDB()
    
    const { title } = await request.json()
    const { boardId } = params

    if (!title) {
      return NextResponse.json(
        { error: 'Column title is required' },
        { status: 400 }
      )
    }

    // Find the board
    const board = await Board.findById(boardId)
    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    // Create new column
    const newColumn = {
      _id: new (require('mongoose').Types.ObjectId)(),
      title,
      position: board.columns.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Add column to board
    board.columns.push(newColumn)
    board.updatedAt = new Date()
    
    await board.save()

    return NextResponse.json(newColumn, { status: 201 })
  } catch (error) {
    console.error('Error creating column:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
