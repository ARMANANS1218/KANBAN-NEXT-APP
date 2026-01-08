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
  
  return board.owner.toString() === userId || board.members?.some((m: any) => m.toString() === userId)
}

// GET - Fetch tasks for a board or filter
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
    
    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get('boardId')
    const columnId = searchParams.get('columnId')
    const assigneeId = searchParams.get('assigneeId')
    
    // Build query
    const query: any = {}
    
    if (boardId) {
      // Verify user has access to this board
      if (!(await verifyBoardAccess(boardId, userId))) {
        return NextResponse.json(
          { success: false, error: 'Board not found or access denied' },
          { status: 403 }
        )
      }
      query.boardId = boardId
    }
    
    if (columnId) {
      query.columnId = columnId
    }
    
    if (assigneeId) {
      query.assignees = assigneeId
    }
    
    const tasks = await TaskModel.find(query)
      .populate('assignees', 'name email avatar color profileImage')
      .populate('createdBy', 'name email avatar color')
      .sort({ position: 1 })
    
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

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const userId = extractUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
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
      boardId, 
      dueDate,
      position
    } = data
    
    // Validate required fields
    if (!title || !boardId || !columnId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, boardId, columnId' },
        { status: 400 }
      )
    }
    
    // Verify user has access to the board
    if (!(await verifyBoardAccess(boardId, userId))) {
      return NextResponse.json(
        { success: false, error: 'Board not found or access denied' },
        { status: 403 }
      )
    }
    
    // Get the highest position in the column if not provided
    let taskPosition = position
    if (taskPosition === undefined) {
      const lastTask = await TaskModel.findOne({ columnId, boardId })
        .sort({ position: -1 })
      taskPosition = lastTask ? lastTask.position + 1 : 0
    }
    
    const task = new TaskModel({
      title: title.trim(),
      description: description?.trim() || '',
      priority: priority || 'medium',
      tags: tags || [],
      assignees: assignees || [],
      columnId,
      boardId,
      position: taskPosition,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: userId,
    })
    
    const savedTask = await task.save()
    await savedTask.populate('assignees', 'name email avatar color profileImage')
    await savedTask.populate('createdBy', 'name email avatar color')
    
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
