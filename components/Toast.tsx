'use client'

import React, { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const bgColor = {
    success: 'bg-success',
    error: 'bg-error',
    warning: 'bg-warning'
  }[type]

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-button shadow-lg z-50 animate-fade-in`}>
      {message}
    </div>
  )
}
