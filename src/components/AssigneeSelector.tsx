import React, { useState } from 'react'
import { User, Check, X } from 'lucide-react'
import { useAppSelector } from '@/store'

interface AssigneeSelectorProps {
  selected: any[]
  onChange: (assignees: any[]) => void
  boardMembers: any[]
  disabled?: boolean
}

export const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  selected,
  onChange,
  boardMembers,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const currentUser = useAppSelector(state => state.auth.user)

  const toggleAssignee = (member: any) => {
    const isSelected = selected.some(a => a._id === member._id)
    
    if (isSelected) {
      onChange(selected.filter(a => a._id !== member._id))
    } else {
      onChange([...selected, member])
    }
  }

  const removeAssignee = (memberId: string) => {
    onChange(selected.filter(a => a._id !== memberId))
  }

  return (
    <div className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <User className="inline w-4 h-4 mr-2" />
        Assign To
      </label>
      
      {/* Selected Assignees */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map(assignee => (
          <div
            key={assignee._id}
            className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full text-sm"
          >
            <img
              src={assignee.avatar || `https://ui-avatars.com/api/?name=${assignee.name}`}
              alt={assignee.name}
              className="w-5 h-5 rounded-full"
            />
            <span>{assignee.name}</span>
            <button
              onClick={() => removeAssignee(assignee._id)}
              className="hover:text-red-600"
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          {selected.length > 0 ? `${selected.length} assigned` : 'Select assignees...'}
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
            {boardMembers.map(member => {
              const isSelected = selected.some(a => a._id === member._id)
              return (
                <button
                  key={member._id}
                  onClick={() => toggleAssignee(member)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between border-b dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`}
                      alt={member.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{member.name}</span>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-green-500" />}
                </button>
              )
            })}
            
            {boardMembers.length === 0 && (
              <div className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">
                No team members available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
