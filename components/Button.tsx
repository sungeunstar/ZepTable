import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'px-6 py-3 rounded-button text-body font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-white text-primary border-2 border-primary hover:bg-primary-light',
    ghost: 'bg-transparent text-primary hover:bg-primary-light'
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
