import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { TaskModel } from '@/lib/models'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const data = await request.json()
    const { title, description, priority, tags, assignees, columnId, boardId, dueDate } = data
    
    // Get the highest order in the column
    const lastTask = await TaskModel.findOne({ columnId }).sort({ order: -1 })
    const order = lastTask ? lastTask.order + 1 : 0
    
    const task = new TaskModel({
      title,
      description,
      priority: priority || 'medium',
      tags: tags || [],
      assignees: assignees || [],
      columnId,
      boardId,
      order,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    })
    
    const savedTask = await task.save()
    await savedTask.populate('assignees', 'name email avatar color')
    
    return NextResponse.json({
      success: true,
      data: savedTask,
    })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
