'use client'

import React, { useState } from 'react'
import { Menu, X, Settings, Search } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { SearchFilterBar } from './SearchFilterBar'

interface MobileMenuProps {
  onSearch?: (query: string) => void
  searchValue?: string
  onThemeToggle?: () => void
  themeIcon?: React.ReactNode
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  onSearch,
  searchValue = '',
  onThemeToggle,
  themeIcon
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-8 w-8 sm:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed inset-y-0 right-0 w-80 max-w-[90vw] bg-background border-l border-border z-50 sm:hidden">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="font-semibold text-lg">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Tasks</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tasks..."
                      className="pl-9"
                      value={searchValue}
                      onChange={(e) => onSearch?.(e.target.value)}
                    />
                  </div>
                </div>

                {/* Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filters</label>
                  <SearchFilterBar />
                </div>

                {/* Theme */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Theme</label>
                  <Button
                    variant="outline"
                    onClick={onThemeToggle}
                    className="w-full justify-start"
                  >
                    {themeIcon}
                    <span className="ml-2">Toggle Theme</span>
                  </Button>
                </div>

                {/* Settings */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Settings</label>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
