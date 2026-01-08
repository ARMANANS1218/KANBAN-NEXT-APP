'use client'

import Image from 'next/image'

const PREDEFINED_AVATARS = [
  { id: 'avatar-1', initials: 'A1', color: 'bg-blue-500' },
  { id: 'avatar-2', initials: 'A2', color: 'bg-red-500' },
  { id: 'avatar-3', initials: 'A3', color: 'bg-green-500' },
  { id: 'avatar-4', initials: 'A4', color: 'bg-purple-500' },
  { id: 'avatar-5', initials: 'A5', color: 'bg-yellow-500' },
  { id: 'avatar-6', initials: 'A6', color: 'bg-pink-500' },
]

interface AvatarSelectorProps {
  selectedAvatar: string
  onSelectAvatar: (avatar: string) => void
  disabled?: boolean
}

export default function AvatarSelector({
  selectedAvatar,
  onSelectAvatar,
  disabled = false,
}: AvatarSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Choose Profile Avatar</label>
      <div className="grid grid-cols-3 gap-3">
        {PREDEFINED_AVATARS.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onSelectAvatar(avatar.id)}
            disabled={disabled}
            className={`p-3 rounded-lg border-2 transition-all ${
              selectedAvatar === avatar.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div
              className={`w-12 h-12 rounded-full ${avatar.color} flex items-center justify-center text-white font-bold mx-auto`}
            >
              {avatar.initials}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
