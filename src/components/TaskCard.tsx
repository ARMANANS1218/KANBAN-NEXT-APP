'use client'

import React, { memo } from 'react'
import { MoreHorizontal, Calendar, User, Tag, Clock } from 'lucide-react'
import { Draggable } from '@hello-pangea/dnd'
import { Task, User as UserType } from '@/types'
import { cn, formatRelativeTime, getPriorityColor } from '@/utils'
import { UserAvatar } from './UserAvatar'
import { Button } from './ui/button'

interface TaskCardProps {
  task: Task
  index: number
  isDragDisabled?: boolean
  onClick?: () => void
}

export const TaskCard = memo<TaskCardProps>(({ task, index, isDragDisabled = false, onClick }) => {
  const priorityColor = getPriorityColor(task.priority)

  return (
    <Draggable draggableId={task._id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'group relative bg-card border border-border rounded-lg p-3 sm:p-4 shadow-sm cursor-pointer',
            'hover:shadow-md hover:border-primary/20 transition-shadow duration-150',
            snapshot.isDragging && 'shadow-lg border-primary/50 rotate-1 scale-105',
            snapshot.isDropAnimating && 'shadow-xl'
          )}
          onClick={onClick}
          style={{
            ...provided.draggableProps.style,
            transform: snapshot.isDragging 
              ? `${provided.draggableProps.style?.transform} rotate(1deg) scale(1.05)`
              : provided.draggableProps.style?.transform
          }}
        >
          {/* Priority indicator */}
          <div
            className={cn(
              'absolute top-0 left-0 w-full h-1 rounded-t-lg',
              priorityColor
            )}
          />

          {/* Card header */}
          <div className="flex items-start justify-between mb-2 sm:mb-3">
            <h3 className="font-medium text-xs sm:text-sm leading-tight line-clamp-2 flex-1 pr-2">
              {task.title}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 h-5 w-5 sm:h-6 sm:w-6 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                // Handle task menu
              }}
            >
              <MoreHorizontal className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </Button>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
              {task.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
                >
                  <Tag className="h-2 w-2 mr-0.5 sm:mr-1" />
                  <span className="truncate max-w-[60px] sm:max-w-none">{tag}</span>
                </span>
              ))}
              {task.tags.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{task.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Due date */}
          {task.dueDate && (
            <div className="flex items-center gap-1 mb-2 sm:mb-3 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className="truncate">{formatRelativeTime(new Date(task.dueDate))}</span>
            </div>
          )}
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            {/* Assignees */}
            <div className="flex items-center">
              {task.assignees.length > 0 ? (
                <div className="flex -space-x-1">
                  {task.assignees.slice(0, 3).map((assignee: UserType) => (
                    <UserAvatar
                      key={assignee._id}
                      user={assignee}
                      size="sm"
                      className="border-2 border-background"
                    />
                  ))}
                  {task.assignees.length > 3 && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium border-2 border-background">
                      +{task.assignees.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Unassigned</span>
                </div>
              )}
            </div>

            {/* Created time */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(new Date(task.createdAt))}</span>
            </div>
          </div>

          {/* Drag handle indicator */}
          {!isDragDisabled && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-30 transition-opacity">
              <div className="flex flex-col gap-1">
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
})

TaskCard.displayName = 'TaskCard'
