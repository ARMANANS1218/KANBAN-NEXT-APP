import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { TaskModel } from '@/lib/models'

export async function PUT(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    await connectDB()
    
    const { taskId } = params
    const data = await request.json()
    
    const task = await TaskModel.findByIdAndUpdate(
      taskId,
      { ...data, updatedAt: new Date() },
      { new: true }
    ).populate('assignees', 'name email avatar color')
    
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    await connectDB()
    
    const { taskId } = params
    
    const task = await TaskModel.findByIdAndDelete(taskId)
    
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
