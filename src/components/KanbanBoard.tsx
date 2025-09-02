'use client'

import React, { useEffect, useCallback, useState } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { Plus, Filter, Search, Settings, Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import toast from 'react-hot-toast'
import { Board, Task, Column as ColumnType } from '@/types'
import { useBoards } from '@/hooks/useBoards'
import { useTasks } from '@/hooks/useTasks'
import { useSocket } from '@/hooks/useSocket'
import { useAppDispatch, useAppSelector } from '@/store'
import { setSelectedTask, setTaskModalOpen, setFilterOptions } from '@/store/uiSlice'
import { reorder, moveItemBetweenLists, generateId, debounce } from '@/utils'
import { Column } from './Column'
import { SearchFilterBar } from './SearchFilterBar'
import { TaskModal } from './TaskModal'
import { AddColumnModal } from './AddColumnModal'
import { MobileMenu } from './MobileMenu'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface KanbanBoardProps {
  boardId: string
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ boardId }) => {
  const dispatch = useAppDispatch()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false)
  
  // Hooks
  const { currentBoard, selectBoard, getBoardById, loadBoards, createColumn } = useBoards()
  const { 
    tasksByColumn, 
    isLoading, 
    error, 
    loadTasks, 
    moveTask, 
    getTasksForColumn,
    hasPendingOperations 
  } = useTasks(boardId)
  const { socket } = useSocket(boardId)
  
  // UI state
  const selectedTask = useAppSelector(state => state.ui.selectedTask)
  const isTaskModalOpen = useAppSelector(state => state.ui.isTaskModalOpen)
  const filterOptions = useAppSelector(state => state.ui.filterOptions)

  // Effect to handle mounting (for theme)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load board and tasks on mount
  useEffect(() => {
    const loadBoardData = async () => {
      try {
        // First, try to get the board from the store
        let board = getBoardById(boardId)
        
        // If not found, load all boards first
        if (!board) {
          await loadBoards()
          board = getBoardById(boardId)
        }
        
        // If we found the board, select it and load tasks
        if (board) {
          selectBoard(board)
          loadTasks(boardId)
        } else {
          console.error(`Board with ID ${boardId} not found`)
        }
      } catch (error) {
        console.error('Error loading board data:', error)
      }
    }
    
    loadBoardData()
  }, [boardId, getBoardById, selectBoard, loadTasks, loadBoards])

  // Handle drag end - optimized with useCallback
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId, type } = result

    // No destination or same position - early return
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return
    }

    // Handle task movement
    if (type === 'TASK') {
      const sourceColumnId = source.droppableId
      const destColumnId = destination.droppableId
      
      // Optimistic update - don't await to make drag feel faster
      moveTask({
        taskId: draggableId,
        sourceColumnId,
        destinationColumnId: destColumnId,
        sourceIndex: source.index,
        destinationIndex: destination.index,
      }).then(() => {
        toast.success('Task moved successfully')
      }).catch((error) => {
        toast.error('Failed to move task')
        console.error('Error moving task:', error)
      })
    }
  }, [moveTask])

  // Handle task click
  const handleTaskClick = useCallback((task: Task) => {
    dispatch(setSelectedTask(task))
    dispatch(setTaskModalOpen(true))
  }, [dispatch])

  // Handle add task
  const handleAddTask = useCallback((columnId: string) => {
    // Create a temporary task for the modal
    const tempTask: Task = {
      _id: `temp-${generateId()}`,
      title: '',
      description: '',
      priority: 'medium',
      tags: [],
      assignees: [],
      columnId,
      boardId,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    dispatch(setSelectedTask(tempTask))
    dispatch(setTaskModalOpen(true))
  }, [dispatch, boardId])

  // Handle add column
  const handleAddColumn = useCallback(async (title: string) => {
    if (currentBoard) {
      await createColumn(currentBoard._id, title)
    }
  }, [createColumn, currentBoard])

  // Handle search
  const handleSearch = useCallback(
    debounce((search: string) => {
      dispatch(setFilterOptions({ search }))
    }, 300),
    [dispatch]
  )

  // Theme toggle
  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const getThemeIcon = () => {
    if (!mounted) return <Monitor className="h-4 w-4" />
    if (theme === 'light') return <Sun className="h-4 w-4" />
    if (theme === 'dark') return <Moon className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  // Memoized column rendering for better performance
  const renderColumns = useCallback(() => {
    if (!currentBoard?.columns) return []
    
    return currentBoard.columns.map((column: ColumnType) => {
      const columnTasks = getTasksForColumn(column._id)
      
      return (
        <Column
          key={column._id}
          column={column}
          tasks={columnTasks}
          boardId={boardId}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
          isDragDisabled={isLoading}
        />
      )
    })
  }, [currentBoard?.columns, getTasksForColumn, boardId, handleTaskClick, handleAddTask, isLoading])

  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading board...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading board: {error}</p>
          <Button onClick={() => loadTasks(boardId)}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-border/50 bg-card/50 backdrop-blur-sm gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none">
            <h1 className="text-lg sm:text-xl font-bold truncate">{currentBoard.title}</h1>
            {currentBoard.description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{currentBoard.description}</p>
            )}
          </div>
          
          {/* Connection status */}
          <div className="flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-muted-foreground">
              {socket?.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          {/* Pending operations indicator */}
          {hasPendingOperations && (
            <div className="flex items-center gap-2 text-xs text-yellow-600">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="hidden sm:inline">Syncing...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Search - Hidden on mobile */}
          <div className="relative flex-1 sm:flex-none hidden sm:block">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-7 sm:pl-9 w-full sm:w-48 lg:w-64 h-8 sm:h-10 text-sm"
              onChange={(e) => handleSearch(e.target.value)}
              defaultValue={filterOptions.search}
            />
          </div>
          
          {/* Filter button - Hidden on mobile */}
          <div className="hidden sm:block">
            <SearchFilterBar />
          </div>
          
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={cycleTheme}
            aria-label="Toggle theme"
            className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex"
          >
            {getThemeIcon()}
          </Button>
          
          {/* Settings - Hidden on mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label="Settings"
            className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex"
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>

          {/* Mobile Menu */}
          <MobileMenu
            onSearch={handleSearch}
            searchValue={filterOptions.search}
            onThemeToggle={cycleTheme}
            themeIcon={getThemeIcon()}
          />
        </div>
      </header>

      {/* Board Content */}
      <main className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="h-full overflow-x-auto overflow-y-hidden">
            <div className="flex gap-3 sm:gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6 h-full min-w-max">
              {renderColumns()}
              
              {/* Add Column Button */}
              <div className="flex items-start">
                <Button
                  variant="outline"
                  className="w-64 sm:w-72 lg:w-80 h-12 sm:h-14 lg:h-16 border-dashed border-2 hover:border-primary/50 hover:bg-accent/20 text-sm sm:text-base"
                  onClick={() => setIsAddColumnModalOpen(true)}
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Add Column
                </Button>
              </div>
            </div>
          </div>
        </DragDropContext>
      </main>

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          dispatch(setTaskModalOpen(false))
          dispatch(setSelectedTask(null))
        }}
        boardId={boardId}
      />

      {/* Add Column Modal */}
      <AddColumnModal
        isOpen={isAddColumnModalOpen}
        onClose={() => setIsAddColumnModalOpen(false)}
        onSubmit={handleAddColumn}
        isLoading={isLoading}
      />
    </div>
  )
}
