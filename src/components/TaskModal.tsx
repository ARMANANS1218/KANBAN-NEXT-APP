'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, Trash2, Calendar, User, Tag, AlertTriangle } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Task, CreateTaskData, UpdateTaskData } from '@/types'
import { useTasks } from '@/hooks/useTasks'
import { useAppSelector } from '@/store'
import { generateId } from '@/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { UserAvatar } from './UserAvatar'

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  tags: z.array(z.string()).default([]),
  assignees: z.array(z.string()).default([]),
  dueDate: z.string().optional(),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  boardId: string
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  boardId,
}) => {
  const { createTask, updateTask, deleteTask } = useTasks(boardId)
  const users = useAppSelector(state => state.users.users)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newTag, setNewTag] = useState('')

  const isNewTask = task?._id.startsWith('temp-')
  const isEditMode = !!task && !isNewTask

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      tags: [],
      assignees: [],
      dueDate: '',
    },
  })

  const watchedTags = watch('tags')
  const watchedAssignees = watch('assignees')

  // Reset form when task changes
  useEffect(() => {
    if (task && isOpen) {
      reset({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority,
        tags: task.tags || [],
        assignees: task.assignees.map(a => a._id) || [],
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      })
    }
  }, [task, isOpen, reset])

  const onSubmit = async (data: TaskFormData) => {
    if (!task) return

    setIsSubmitting(true)
    try {
      if (isNewTask) {
        // Create new task
        const createData: CreateTaskData = {
          title: data.title,
          description: data.description || '',
          priority: data.priority,
          tags: data.tags,
          assignees: data.assignees,
          columnId: task.columnId,
          boardId,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        }

        await createTask(createData)
        toast.success('Task created successfully')
      } else {
        // Update existing task
        const updateData: UpdateTaskData = {
          _id: task._id,
          title: data.title,
          description: data.description,
          priority: data.priority,
          tags: data.tags,
          assignees: data.assignees,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        }

        await updateTask(updateData)
        toast.success('Task updated successfully')
      }

      onClose()
    } catch (error) {
      toast.error(isNewTask ? 'Failed to create task' : 'Failed to update task')
      console.error('Task save error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!task || isNewTask) return
    
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        setIsSubmitting(true)
        await deleteTask(task._id)
        toast.success('Task deleted successfully')
        onClose()
      } catch (error) {
        toast.error('Failed to delete task')
        console.error('Task delete error:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const addTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      setValue('tags', [...watchedTags, newTag.trim()], { shouldDirty: true })
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove), { shouldDirty: true })
  }

  const toggleAssignee = (userId: string) => {
    const newAssignees = watchedAssignees.includes(userId)
      ? watchedAssignees.filter(id => id !== userId)
      : [...watchedAssignees, userId]
    
    setValue('assignees', newAssignees, { shouldDirty: true })
  }

  const priorityColors = {
    low: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    urgent: 'text-red-600 bg-red-50 border-red-200',
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isNewTask ? 'Create New Task' : 'Edit Task'}
            {isEditMode && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                <span>Last updated {new Date(task.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title *
            </label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="title"
                  placeholder="Enter task title..."
                />
              )}
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="description"
                  placeholder="Enter task description..."
                  rows={3}
                />
              )}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                Priority
              </label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {(['low', 'medium', 'high', 'urgent'] as const).map(priority => (
                      <option key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium mb-1">
                <Calendar className="inline h-4 w-4 mr-1" />
                Due Date
              </label>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="dueDate"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                  />
                )}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Tag className="inline h-4 w-4 mr-1" />
              Tags
            </label>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {watchedTags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                Add
              </Button>
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Assignees
            </label>
            
            <div className="space-y-2 max-h-40 overflow-y-auto border border-input rounded-md p-2">
              {users.map(user => (
                <label
                  key={user._id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={watchedAssignees.includes(user._id)}
                    onChange={() => toggleAssignee(user._id)}
                    className="rounded border-border"
                  />
                  <UserAvatar user={user} size="sm" showName />
                </label>
              ))}
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (!isDirty && isEditMode)}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : isNewTask ? 'Create Task' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
