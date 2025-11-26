import React from 'react'

interface TagProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning'
  className?: string
}

export default function Tag({ children, variant = 'default', className = '' }: TagProps) {
  const variantStyles = {
    default: 'bg-primary-light text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning'
  }

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-caption ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  )
}
