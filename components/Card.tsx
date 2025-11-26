import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-card p-5 rounded-card shadow-card ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
