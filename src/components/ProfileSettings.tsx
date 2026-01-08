'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  updateProfileStart,
  updateProfileSuccess,
  updateProfileFailure,
} from '@/store/authSlice'
import { useBoards } from '@/hooks/useBoards'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Upload, Loader2, Layers, ExternalLink } from 'lucide-react'
import AvatarSelector from './auth/AvatarSelector'

const PREDEFINED_AVATARS = [
  { id: 'avatar-1', initials: 'A1', color: 'bg-blue-500' },
  { id: 'avatar-2', initials: 'A2', color: 'bg-red-500' },
  { id: 'avatar-3', initials: 'A3', color: 'bg-green-500' },
  { id: 'avatar-4', initials: 'A4', color: 'bg-purple-500' },
  { id: 'avatar-5', initials: 'A5', color: 'bg-yellow-500' },
  { id: 'avatar-6', initials: 'A6', color: 'bg-pink-500' },
]

export default function ProfileSettings() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { user, token, isLoading } = useAppSelector((state) => state.auth)
  const { boards, loadBoards } = useBoards()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: 'avatar-1',
  })
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone || '',
        avatar: user.avatar || 'avatar-1',
      })
      if (user.profileImage) {
        setProfileImage(user.profileImage)
      }
      // Load boards when user is available
      loadBoards()
    }
  }, [user, loadBoards])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAvatarSelect = (avatar: string) => {
    setFormData((prev) => ({
      ...prev,
      avatar,
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For now, just create a local URL
    // In production, upload to cloud storage
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast.error('Not authenticated')
      return
    }

    setIsSaving(true)
    dispatch(updateProfileStart())

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          avatar: formData.avatar,
          profileImage: profileImage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        dispatch(updateProfileFailure(data.error || 'Update failed'))
        toast.error(data.error || 'Failed to update profile')
        return
      }

      dispatch(updateProfileSuccess(data.user))
      toast.success('Profile updated successfully!')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred'
      dispatch(updateProfileFailure(errorMessage))
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          Please log in to access profile settings
        </p>
      </div>
    )
  }

  const selectedAvatarData = PREDEFINED_AVATARS.find(
    (a) => a.id === formData.avatar
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Profile Settings */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">Profile Picture</h3>

            {/* Current Avatar Display */}
            <div className="flex justify-center">
              {profileImage ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500">
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : selectedAvatarData ? (
                <div
                  className={`w-24 h-24 rounded-full ${selectedAvatarData.color} flex items-center justify-center text-white text-2xl font-bold border-4 border-blue-500`}
                >
                  {selectedAvatarData.initials}
                </div>
              ) : null}
            </div>

            {/* Upload Custom Image */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Custom Image</label>
              <div className="flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <label className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isSaving}
                  />
                </label>
              </div>
            </div>

            {/* Or Select Predefined Avatar */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <AvatarSelector
                selectedAvatar={formData.avatar}
                onSelectAvatar={handleAvatarSelect}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg">Personal Information</h3>

            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Email cannot be changed
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Auth Provider Info */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Account linked with:{' '}
                <span className="font-semibold capitalize">
                  {user.provider === 'google' ? 'Google' : 'Email'}
                </span>
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Right Column - Your Boards */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Your Boards</h2>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Layers className="h-5 w-5" />
              All Boards
            </h3>
            <button
              type="button"
              onClick={() => router.push('/boards')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Create New
            </button>
          </div>

          {boards.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                No boards created yet.
              </p>
              <button
                type="button"
                onClick={() => router.push('/boards')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first board →
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {boards.map((board) => (
                <button
                  key={board._id}
                  type="button"
                  onClick={() => router.push(`/boards/${board._id}`)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {board.title}
                    </p>
                    {board.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                        {board.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {board.columns?.length || 0} columns
                    </p>
                  </div>
                  <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 ml-3 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {boards.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Total: <span className="font-semibold">{boards.length}</span> board{boards.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
