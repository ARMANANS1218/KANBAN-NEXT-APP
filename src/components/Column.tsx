'use client'

import React, { memo, useMemo } from 'react'
import { Plus, MoreHorizontal } from 'lucide-react'
import { Droppable } from '@hello-pangea/dnd'
import { FixedSizeList as List } from 'react-window'
import { Column as ColumnType, Task } from '@/types'
import { cn } from '@/utils'
import { TaskCard } from './TaskCard'
import { Button } from './ui/button'
import { useTasks } from '@/hooks/useTasks'

interface ColumnProps {
  column: ColumnType
  tasks: Task[]
  boardId: string
  onTaskClick?: (task: Task) => void
  onAddTask?: (columnId: string) => void
  isDragDisabled?: boolean
}

// Virtualized task renderer for performance
const VirtualizedTaskItem = memo<{
  index: number
  style: any
  data: {
    tasks: Task[]
    onTaskClick?: (task: Task) => void
    isDragDisabled?: boolean
  }
}>(({ index, style, data }) => {
  const { tasks, onTaskClick, isDragDisabled } = data
  const task = tasks[index]

  if (!task) return null

  return (
    <div style={style}>
      <div className="px-1 sm:px-2 pb-2 sm:pb-3">
        <TaskCard
          task={task}
          index={index}
          isDragDisabled={isDragDisabled}
          onClick={() => onTaskClick?.(task)}
        />
      </div>
    </div>
  )
})

VirtualizedTaskItem.displayName = 'VirtualizedTaskItem'

export const Column = memo<ColumnProps>(({
  column,
  tasks,
  boardId,
  onTaskClick,
  onAddTask,
  isDragDisabled = false,
}) => {
  // Use virtualization for large task lists (>20 tasks for better performance)
  const shouldVirtualize = tasks.length > 20

  const taskItemData = useMemo(() => ({
    tasks,
    onTaskClick,
    isDragDisabled,
  }), [tasks, onTaskClick, isDragDisabled])

  const handleAddTask = () => {
    onAddTask?.(column._id)
  }

  return (
    <div
      className="flex flex-col bg-muted/30 rounded-lg border border-border/50 min-h-[400px] sm:min-h-[500px] max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-160px)] lg:max-h-[calc(100vh-200px)]"
      style={{ 
        width: 'clamp(260px, 85vw, 320px)', 
        minWidth: 'clamp(260px, 85vw, 320px)' 
      }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border/50">
        <div className="flex items-center gap-2 sm:gap-3">
          <h3 className="font-semibold text-sm sm:text-base truncate">{column.title}</h3>
          <span className="flex items-center justify-center h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-muted text-xs font-medium">
            {tasks.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAddTask}
            className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-accent"
            aria-label={`Add task to ${column.title}`}
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-accent"
            aria-label={`Column options for ${column.title}`}
          >
            <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 overflow-hidden">
        <Droppable droppableId={column._id} type="TASK">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                'h-full transition-colors duration-200',
                snapshot.isDraggingOver && 'bg-accent/20'
              )}
            >
              {shouldVirtualize ? (
                // Virtualized list for performance with many tasks
                <List
                  height={350}
                  width="100%"
                  itemCount={tasks.length}
                  itemSize={120}
                  itemData={taskItemData}
                  className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
                >
                  {VirtualizedTaskItem}
                </List>
              ) : (
                // Regular list for smaller task counts
                <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 max-h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                  {tasks.map((task, index) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      index={index}
                      isDragDisabled={isDragDisabled}
                      onClick={() => onTaskClick?.(task)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}

              {/* Empty state */}
              {tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <p className="text-sm mb-2">No tasks yet</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddTask}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add first task
                    </Button>
                  </div>
                </div>
              )}

              {/* Drop zone indicator */}
              {snapshot.isDraggingOver && (
                <div className="mx-2 mb-2 h-20 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center bg-primary/5 animate-pulse">
                  <p className="text-sm text-primary font-medium">Drop task here</p>
                </div>
              )}
              
              {!shouldVirtualize && provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  )
})

Column.displayName = 'Column'
