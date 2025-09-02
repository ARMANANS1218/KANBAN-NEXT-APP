import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { TaskModel } from '@/lib/models'

export async function GET(
  request: NextRequest,
  { params }: { params: { boardId: string } }
) {
  try {
    await connectDB()
    
    const { boardId } = params
    
    const tasks = await TaskModel.find({ boardId })
      .populate('assignees', 'name email avatar color')
      .sort({ order: 1, createdAt: 1 })
    
    return NextResponse.json({
      success: true,
      data: tasks,
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}
