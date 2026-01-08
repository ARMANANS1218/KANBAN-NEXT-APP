import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { TaskModel, BoardModel } from '@/lib/models'
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

// Helper to verify board access
async function verifyBoardAccess(boardId: string, userId: string): Promise<boolean> {
  const board = await BoardModel.findById(boardId)
  if (!board) return false
  
  return board.owner.toString() === userId || board.members.some((m: any) => m.toString() === userId)
}

// GET - Fetch single task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const userId = extractUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const task = await TaskModel.findById(params.id)
      .populate('assignees', 'name email avatar color profileImage')
      .populate('createdBy', 'name email avatar color')
    
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }
    
    // Verify access to board
    if (!(await verifyBoardAccess(task.boardId.toString(), userId))) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: task,
    })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// PATCH - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const userId = extractUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const task = await TaskModel.findById(params.id)
    
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }
    
    // Verify access to board
    if (!(await verifyBoardAccess(task.boardId.toString(), userId))) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }
    
    const data = await request.json()
    const {
      title,
      description,
      priority,
      tags,
      assignees,
      columnId,
      position,
      dueDate,
      status,
    } = data
    
    // Update fields if provided
    if (title !== undefined) task.title = title.trim()
    if (description !== undefined) task.description = description.trim()
    if (priority !== undefined) task.priority = priority
    if (tags !== undefined) task.tags = tags
    if (assignees !== undefined) task.assignees = assignees
    if (columnId !== undefined) task.columnId = columnId
    if (position !== undefined) task.position = position
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null
    if (status !== undefined) task.status = status
    
    task.updatedAt = new Date()
    
    const updatedTask = await task.save()
    await updatedTask.populate('assignees', 'name email avatar color profileImage')
    await updatedTask.populate('createdBy', 'name email avatar color')
    
    return NextResponse.json({
      success: true,
      data: updatedTask,
    })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE - Remove task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const userId = extractUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const task = await TaskModel.findById(params.id)
    
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }
    
    // Verify access to board
    if (!(await verifyBoardAccess(task.boardId.toString(), userId))) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Delete the task
    await TaskModel.findByIdAndDelete(params.id)
    
    return NextResponse.json({
      success: true,
      data: { _id: params.id },
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
