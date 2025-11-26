import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-caption text-text-secondary mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 rounded-button border border-border bg-white text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${error ? 'border-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-caption text-error mt-1">{error}</p>
      )}
    </div>
  )
}
