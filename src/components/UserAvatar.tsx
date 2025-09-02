'use client'

import React, { memo } from 'react'
import { User } from '@/types'
import { cn, getInitials, generateAvatarUrl } from '@/utils'

interface UserAvatarProps {
  user: User
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showName?: boolean
  onClick?: () => void
}

export const UserAvatar = memo<UserAvatarProps>(({
  user,
  size = 'md',
  className,
  showName = false,
  onClick,
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-12 w-12 text-base',
  }

  const avatarUrl = user.avatar || generateAvatarUrl(user.name, user.color)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full border-2 border-background bg-muted overflow-hidden cursor-pointer transition-transform hover:scale-105',
          sizeClasses[size],
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
        title={user.name}
      >
        {user.avatar ? (
          <img
            src={avatarUrl}
            alt={user.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-white font-medium"
            style={{ backgroundColor: user.color }}
          >
            {getInitials(user.name)}
          </div>
        )}
        
        {/* Fallback initials (hidden by default, shown when image fails) */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center text-white font-medium',
            user.avatar ? 'hidden' : ''
          )}
          style={{ backgroundColor: user.color }}
        >
          {getInitials(user.name)}
        </div>
      </div>
      
      {showName && (
        <span className="text-sm font-medium truncate">{user.name}</span>
      )}
    </div>
  )
})

UserAvatar.displayName = 'UserAvatar'
