'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store'
import { useBoards } from '@/hooks/useBoards'
import Navbar from '@/components/Navbar'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'

export default function BoardsPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const { boards, isLoading, createBoard, loadBoards } = useBoards()
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [hasLoadedBoards, setHasLoadedBoards] = useState(false)

  // Memoize authentication check
  const shouldRedirect = useMemo(() => !isAuthenticated, [isAuthenticated])

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/auth/login')
    } else if (!hasLoadedBoards && isAuthenticated) {
      setHasLoadedBoards(true)
      loadBoards()
    }
  }, [shouldRedirect, isAuthenticated, router, loadBoards, hasLoadedBoards])

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newBoardTitle.trim()) {
      toast.error('Board title cannot be empty')
      return
    }

    setIsCreating(true)
    try {
      console.log('Creating board with title:', newBoardTitle)
      const newBoard = await createBoard({
        title: newBoardTitle.trim(),
        description: '',
        members: [],
      })
      
      console.log('Board created successfully:', newBoard)
      if (newBoard && newBoard._id) {
        setNewBoardTitle('')
        toast.success('Board created!')
        router.push(`/boards/${newBoard._id}`)
      } else {
        toast.error('Board created but response invalid')
      }
    } catch (error) {
      console.error('Error creating board:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create board'
      toast.error(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  // Show loading state while boards are being fetched
  if (isLoading && boards.length === 0) {
    return (
      <div>
        <Navbar />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your boards...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Your Boards
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and organize your projects
            </p>
          </div>

          {/* Create Board Form */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Create a New Board</h2>
            <form onSubmit={handleCreateBoard} className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter board name..."
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                disabled={isCreating}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isCreating || !newBoardTitle.trim()}
                className="flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Boards Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading boards...</p>
              </div>
            </div>
          ) : boards.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-12 text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No boards yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first board to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boards.map((board) => (
                <button
                  key={board._id}
                  onClick={() => router.push(`/boards/${board._id}`)}
                  className="bg-white dark:bg-gray-900 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-left hover:border-blue-500 border-2 border-transparent"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {board.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {board.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {board.members?.length || 0} members
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {board.columns?.length || 0} columns
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
