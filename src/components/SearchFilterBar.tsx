'use client'

import React, { useState, useCallback } from 'react'
import { Filter, X, Users, Tag, AlertTriangle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { setFilterOptions, clearFilters } from '@/store/uiSlice'
import { FilterOptions } from '@/types'
import { Button } from './ui/button'
import { Input } from './ui/input'

export const SearchFilterBar: React.FC = () => {
  const dispatch = useAppDispatch()
  const filterOptions = useAppSelector(state => state.ui.filterOptions)
  const users = useAppSelector(state => state.users.users)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Get unique tags from all tasks
  const allTags = useAppSelector(state => {
    const uniqueTags = new Set<string>()
    state.tasks.tasks.forEach(task => {
      task.tags.forEach(tag => uniqueTags.add(tag))
    })
    return Array.from(uniqueTags)
  })

  const handleFilterChange = useCallback((updates: Partial<FilterOptions>) => {
    dispatch(setFilterOptions(updates))
  }, [dispatch])

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters())
  }, [dispatch])

  const toggleAssignee = useCallback((userId: string) => {
    const newAssignees = filterOptions.assignees.includes(userId)
      ? filterOptions.assignees.filter(id => id !== userId)
      : [...filterOptions.assignees, userId]
    
    handleFilterChange({ assignees: newAssignees })
  }, [filterOptions.assignees, handleFilterChange])

  const toggleTag = useCallback((tag: string) => {
    const newTags = filterOptions.tags.includes(tag)
      ? filterOptions.tags.filter(t => t !== tag)
      : [...filterOptions.tags, tag]
    
    handleFilterChange({ tags: newTags })
  }, [filterOptions.tags, handleFilterChange])

  const togglePriority = useCallback((priority: 'low' | 'medium' | 'high' | 'urgent') => {
    const newPriorities = filterOptions.priorities.includes(priority)
      ? filterOptions.priorities.filter(p => p !== priority)
      : [...filterOptions.priorities, priority]
    
    handleFilterChange({ priorities: newPriorities })
  }, [filterOptions.priorities, handleFilterChange])

  const hasActiveFilters = 
    filterOptions.assignees.length > 0 ||
    filterOptions.tags.length > 0 ||
    filterOptions.priorities.length > 0

  const priorityColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
  }

  return (
    <div className="relative">
      <Button
        variant={hasActiveFilters ? "default" : "ghost"}
        size="icon"
        onClick={() => setIsFilterOpen(!isFilterOpen)}
        aria-label="Filter tasks"
        className="relative h-8 w-8 sm:h-10 sm:w-10"
      >
        <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
        {hasActiveFilters && (
          <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full" />
        )}
      </Button>

      {isFilterOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* Filter Panel */}
          <div
            className="absolute right-0 top-full mt-2 w-[90vw] max-w-sm sm:w-80 bg-card border border-border rounded-lg shadow-lg z-50"
          >
              <div className="p-3 sm:p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Filter Tasks</h3>
                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFilters}
                        className="text-xs"
                      >
                        Clear all
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsFilterOpen(false)}
                      className="h-6 w-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Assignees Filter */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <label className="text-sm font-medium">Assigned to</label>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {users.map(user => (
                        <label
                          key={user._id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={filterOptions.assignees.includes(user._id)}
                            onChange={() => toggleAssignee(user._id)}
                            className="rounded border-border"
                          />
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center text-xs text-white font-medium"
                              style={{ backgroundColor: user.color }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm">{user.name}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Tags Filter */}
                  {allTags.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <label className="text-sm font-medium">Tags</label>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {allTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                              filterOptions.tags.includes(tag)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-foreground border-border hover:bg-accent'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Priority Filter */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <label className="text-sm font-medium">Priority</label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(['low', 'medium', 'high', 'urgent'] as const).map(priority => (
                        <button
                          key={priority}
                          onClick={() => togglePriority(priority)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs border transition-colors ${
                            filterOptions.priorities.includes(priority)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-foreground border-border hover:bg-accent'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${priorityColors[priority]}`} />
                          <span className="capitalize">{priority}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  )
}
