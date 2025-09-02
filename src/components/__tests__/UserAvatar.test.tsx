import { render, screen } from '@testing-library/react'
import { UserAvatar } from '../UserAvatar'
import { User } from '@/types'

const mockUser: User = {
  _id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  color: '#3b82f6',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('UserAvatar', () => {
  it('renders user initials when no avatar is provided', () => {
    render(<UserAvatar user={mockUser} />)
    
    const initials = screen.getByText('JD')
    expect(initials).toBeInTheDocument()
  })

  it('renders user name when showName is true', () => {
    render(<UserAvatar user={mockUser} showName />)
    
    const name = screen.getByText('John Doe')
    expect(name).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<UserAvatar user={mockUser} size="sm" />)
    
    let avatar = screen.getByTitle('John Doe')
    expect(avatar).toHaveClass('h-6', 'w-6', 'text-xs')

    rerender(<UserAvatar user={mockUser} size="lg" />)
    avatar = screen.getByTitle('John Doe')
    expect(avatar).toHaveClass('h-12', 'w-12', 'text-base')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<UserAvatar user={mockUser} onClick={handleClick} />)
    
    const avatar = screen.getByTitle('John Doe')
    avatar.click()
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('displays user avatar image when provided', () => {
    const userWithAvatar = {
      ...mockUser,
      avatar: 'https://example.com/avatar.jpg',
    }
    
    render(<UserAvatar user={userWithAvatar} />)
    
    const image = screen.getByAltText('John Doe')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('applies custom className', () => {
    const { container } = render(
      <UserAvatar user={mockUser} className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
