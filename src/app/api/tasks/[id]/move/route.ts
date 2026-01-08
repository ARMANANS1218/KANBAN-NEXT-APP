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
    return decoded.userId
  } catch {
    return null
  }
}

// Helper to verify board access
async function verifyBoardAccess(boardId: string, userId: string): Promise<boolean> {
  const board = await BoardModel.findById(boardId)
  if (!board) return false
  
  return board.owner.toString() === userId || board.members.some(m => m.toString() === userId)
}

// PUT - Move a task to a different column/position
export async function PUT(
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
    
    const { sourceColumnId, destinationColumnId, sourceIndex, destinationIndex } = await request.json()
    
    // Get the task to move
    const task = await TaskModel.findById(params.id)
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }
    
    // Verify user has access to the board
    if (!(await verifyBoardAccess(task.boardId.toString(), userId))) {
      return NextResponse.json(
        { success: false, error: 'Board not found or access denied' },
        { status: 403 }
      )
    }
    
    const isSameColumn = sourceColumnId === destinationColumnId
    
    if (isSameColumn) {
      // Moving within the same column
      const tasksInColumn = await TaskModel.find({
        columnId: sourceColumnId,
        boardId: task.boardId,
        _id: { $ne: params.id }
      }).sort({ position: 1 })
      
      // Update positions
      const updates: any[] = []
      
      tasksInColumn.forEach((t, idx) => {
        let newPosition = idx
        
        if (sourceIndex < destinationIndex) {
          // Moving down
          if (idx >= sourceIndex && idx < destinationIndex) {
            newPosition = idx // Shift up
          } else if (idx >= destinationIndex) {
            newPosition = idx + 1
          }
        } else {
          // Moving up
          if (idx >= destinationIndex && idx < sourceIndex) {
            newPosition = idx + 1 // Shift down
          }
        }
        
        if (t.position !== newPosition) {
          updates.push(TaskModel.updateOne({ _id: t._id }, { position: newPosition }))
        }
      })
      
      // Update the moved task
      task.position = destinationIndex
      await task.save()
      
      // Execute all updates
      await Promise.all(updates)
      
    } else {
      // Moving to a different column
      
      // Get tasks in source column (excluding the moved task)
      const sourceColumnTasks = await TaskModel.find({
        columnId: sourceColumnId,
        boardId: task.boardId,
        _id: { $ne: params.id }
      }).sort({ position: 1 })
      
      // Get tasks in destination column
      const destColumnTasks = await TaskModel.find({
        columnId: destinationColumnId,
        boardId: task.boardId
      }).sort({ position: 1 })
      
      const updates: any[] = []
      
      // Update source column positions (close the gap)
      sourceColumnTasks.forEach((t, idx) => {
        if (idx >= sourceIndex) {
          updates.push(TaskModel.updateOne({ _id: t._id }, { position: idx }))
        }
      })
      
      // Update destination column positions (make room)
      destColumnTasks.forEach((t, idx) => {
        if (idx >= destinationIndex) {
          updates.push(TaskModel.updateOne({ _id: t._id }, { position: idx + 1 }))
        }
      })
      
      // Update the moved task
      task.columnId = destinationColumnId
      task.position = destinationIndex
      await task.save()
      
      // Execute all updates
      await Promise.all(updates)
    }
    
    // Fetch all affected tasks for the response
    const affectedTasks = await TaskModel.find({
      boardId: task.boardId,
      $or: [
        { columnId: sourceColumnId },
        { columnId: destinationColumnId }
      ]
    })
      .populate('assignees', 'name email avatar color profileImage')
      .populate('createdBy', 'name email avatar color profileImage')
      .sort({ position: 1 })
    
    await task.populate('assignees', 'name email avatar color profileImage')
    await task.populate('createdBy', 'name email avatar color profileImage')
    
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
