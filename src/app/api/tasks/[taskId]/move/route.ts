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
    const {
      sourceColumnId,
      destinationColumnId,
      sourceIndex,
      destinationIndex,
    } = await request.json()
    
    // Get the task being moved
    const task = await TaskModel.findById(taskId)
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }
    
    // Update task's column and order
    task.columnId = destinationColumnId
    task.order = destinationIndex
    task.updatedAt = new Date()
    
    // Handle reordering tasks in source column (if different from destination)
    if (sourceColumnId !== destinationColumnId) {
      // Update orders in source column
      await TaskModel.updateMany(
        {
          columnId: sourceColumnId,
          order: { $gt: sourceIndex },
          _id: { $ne: taskId }
        },
        { $inc: { order: -1 } }
      )
    }
    
    // Update orders in destination column
    await TaskModel.updateMany(
      {
        columnId: destinationColumnId,
        order: { $gte: destinationIndex },
        _id: { $ne: taskId }
      },
      { $inc: { order: 1 } }
    )
    
    // Save the moved task
    await task.save()
    await task.populate('assignees', 'name email avatar color')
    
    // Get all affected tasks for frontend updates
    const affectedTasks = await TaskModel.find({
      $or: [
        { columnId: sourceColumnId },
        { columnId: destinationColumnId }
      ]
    }).populate('assignees', 'name email avatar color')
    
    return NextResponse.json({
      success: true,
      data: {
        task,
        affectedTasks,
      },
    })
  } catch (error) {
    console.error('Error moving task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to move task' },
      { status: 500 }
    )
  }
}
