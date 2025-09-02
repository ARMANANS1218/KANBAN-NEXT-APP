import { generateId, formatDate, formatRelativeTime, getPriorityColor, getInitials, generateAvatarUrl, debounce, throttle, reorder, moveItemBetweenLists, isValidEmail, isValidObjectId, generateUserColor, sanitizeHtml, copyToClipboard } from '@/utils'

// Mock timers for debounce/throttle tests
jest.useFakeTimers()

describe('Utility Functions', () => {
  describe('generateId', () => {
    it('should generate a unique string ID', () => {
      const id1 = generateId()
      const id2 = generateId()
      
      expect(typeof id1).toBe('string')
      expect(typeof id2).toBe('string')
      expect(id1).not.toBe(id2)
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15')
      const formatted = formatDate(date)
      expect(formatted).toMatch(/Jan 15, 2024/)
    })
  })

  describe('formatRelativeTime', () => {
    it('should return "just now" for recent dates', () => {
      const now = new Date()
      expect(formatRelativeTime(now)).toBe('just now')
    })

    it('should return minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      expect(formatRelativeTime(date)).toBe('5 minutes ago')
    })

    it('should return hours ago', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      expect(formatRelativeTime(date)).toBe('2 hours ago')
    })

    it('should return days ago', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      expect(formatRelativeTime(date)).toBe('3 days ago')
    })

    it('should return formatted date for older dates', () => {
      const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      const result = formatRelativeTime(date)
      expect(result).toMatch(/\w+ \d{1,2}, \d{4}/)
    })
  })

  describe('getPriorityColor', () => {
    it('should return correct colors for priorities', () => {
      expect(getPriorityColor('urgent')).toBe('bg-red-500 text-white')
      expect(getPriorityColor('high')).toBe('bg-orange-500 text-white')
      expect(getPriorityColor('medium')).toBe('bg-yellow-500 text-black')
      expect(getPriorityColor('low')).toBe('bg-green-500 text-white')
      expect(getPriorityColor('unknown')).toBe('bg-gray-500 text-white')
    })
  })

  describe('getInitials', () => {
    it('should return initials from name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Jane Smith Johnson')).toBe('JS')
      expect(getInitials('A')).toBe('A')
      expect(getInitials('')).toBe('')
    })
  })

  describe('generateAvatarUrl', () => {
    it('should generate avatar URL with initials', () => {
      const url = generateAvatarUrl('John Doe')
      expect(url).toContain('ui-avatars.com')
      expect(url).toContain('JD')
    })

    it('should use custom color when provided', () => {
      const url = generateAvatarUrl('John Doe', '#ff0000')
      expect(url).toContain('background=ff0000')
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', () => {
      const fn = jest.fn()
      const debouncedFn = debounce(fn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(fn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    it('should throttle function calls', () => {
      const fn = jest.fn()
      const throttledFn = throttle(fn, 100)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(fn).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(100)
      throttledFn()
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('reorder', () => {
    it('should reorder array items', () => {
      const items = ['a', 'b', 'c', 'd']
      const result = reorder(items, 1, 3)
      expect(result).toEqual(['a', 'c', 'd', 'b'])
    })
  })

  describe('moveItemBetweenLists', () => {
    it('should move item between arrays', () => {
      const source = ['a', 'b', 'c']
      const dest = ['x', 'y', 'z']
      const result = moveItemBetweenLists(source, dest, 1, 2)
      
      expect(result.sourceList).toEqual(['a', 'c'])
      expect(result.destinationList).toEqual(['x', 'y', 'b', 'z'])
    })
  })

  describe('isValidEmail', () => {
    it('should validate email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
      expect(isValidEmail('invalid.email')).toBe(false)
      expect(isValidEmail('missing@.com')).toBe(false)
    })
  })

  describe('isValidObjectId', () => {
    it('should validate MongoDB ObjectIds', () => {
      expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true)
      expect(isValidObjectId('invalid-id')).toBe(false)
      expect(isValidObjectId('123')).toBe(false)
    })
  })

  describe('generateUserColor', () => {
    it('should generate a valid hex color', () => {
      const color = generateUserColor()
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })

  describe('sanitizeHtml', () => {
    it('should remove dangerous HTML', () => {
      const dangerous = '<script>alert("xss")</script><p>Safe content</p>'
      const result = sanitizeHtml(dangerous)
      expect(result).not.toContain('<script>')
      expect(result).toContain('<p>Safe content</p>')
    })

    it('should remove event handlers', () => {
      const dangerous = '<div onclick="alert()">Click me</div>'
      const result = sanitizeHtml(dangerous)
      expect(result).not.toContain('onclick')
    })
  })

  describe('copyToClipboard', () => {
    beforeEach(() => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn(() => Promise.resolve()),
        },
      })
      
      // Mock secure context
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: true,
      })
    })

    it('should copy text to clipboard', async () => {
      const text = 'Hello, World!'
      await copyToClipboard(text)
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)
    })
  })
})

afterEach(() => {
  jest.clearAllTimers()
})
