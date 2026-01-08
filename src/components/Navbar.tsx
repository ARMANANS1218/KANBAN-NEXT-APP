'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import { logout } from '@/store/authSlice'
import { useBoards } from '@/hooks/useBoards'
import toast from 'react-hot-toast'
import {
  LogOut,
  User,
  Layers,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Plus,
} from 'lucide-react'

const PREDEFINED_AVATARS = [
  { id: 'avatar-1', color: 'bg-blue-500' },
  { id: 'avatar-2', color: 'bg-red-500' },
  { id: 'avatar-3', color: 'bg-green-500' },
  { id: 'avatar-4', color: 'bg-purple-500' },
  { id: 'avatar-5', color: 'bg-yellow-500' },
  { id: 'avatar-6', color: 'bg-pink-500' },
]

interface NavbarProps {
  showUserMenu?: boolean
}

export default function Navbar({ showUserMenu = true }: NavbarProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { boards, loadBoards } = useBoards()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isBoardsDropdownOpen, setIsBoardsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const boardsDropdownRef = useRef<HTMLDivElement>(null)

  // Load boards when component mounts
  useEffect(() => {
    if (user) {
      loadBoards()
    }
  }, [user, loadBoards])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
      if (
        boardsDropdownRef.current &&
        !boardsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBoardsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Logged out successfully')
    router.push('/auth/login')
  }

  const getAvatarColor = (avatarId: string) => {
    const avatar = PREDEFINED_AVATARS.find((a) => a.id === avatarId)
    return avatar?.color || 'bg-blue-500'
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!user || !showUserMenu) {
    return (
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                K
              </div>
              <span className="font-bold text-lg hidden sm:block">Kanban</span>
            </Link>
            <div className="flex gap-4">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/boards" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              K
            </div>
            <span className="font-bold text-lg hidden sm:block">Kanban</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* User Menu - Desktop */}
          <div className="hidden sm:flex items-center gap-4">
            {/* View Boards Dropdown */}
            <div className="relative" ref={boardsDropdownRef}>
              <button
                onClick={() => setIsBoardsDropdownOpen(!isBoardsDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <Layers className="h-4 w-4" />
                View Boards
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    isBoardsDropdownOpen ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {/* Boards Dropdown Menu */}
              {isBoardsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Your Boards ({boards.length})
                    </p>
                  </div>
                  
                  {boards.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Layers className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No boards yet
                      </p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {boards.map((board) => (
                        <button
                          key={board._id}
                          onClick={() => {
                            router.push(`/boards/${board._id}`)
                            setIsBoardsDropdownOpen(false)
                          }}
                          className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <span className="truncate flex-1 text-left">{board.title}</span>
                          <ExternalLink className="h-3 w-3 text-gray-400 ml-2 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => {
                        router.push('/boards')
                        setIsBoardsDropdownOpen(false)
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Board
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {user.profileImage ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`w-8 h-8 rounded-full ${getAvatarColor(
                      user.avatar || 'avatar-1'
                    )} flex items-center justify-center text-white text-sm font-bold`}
                  >
                    {getUserInitials(user.name)}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${
                    isDropdownOpen ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-50">
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <hr className="my-1 border-gray-200 dark:border-gray-600" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden pb-4 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {user.email}
              </p>
            </div>
            
            {/* View Boards Section */}
            <div className="px-4 py-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Your Boards ({boards.length})
                </p>
                <button
                  onClick={() => {
                    router.push('/boards')
                    setIsMobileMenuOpen(false)
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              </div>
              {boards.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
                  No boards yet
                </p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {boards.slice(0, 5).map((board) => (
                    <button
                      key={board._id}
                      onClick={() => {
                        router.push(`/boards/${board._id}`)
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full text-left px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded truncate"
                    >
                      {board.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <hr className="my-2 border-gray-200 dark:border-gray-600" />
            
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
