import React from 'react'

interface KeywordChipProps {
  label: string
  selected?: boolean
  onClick?: () => void
}

export default function KeywordChip({ label, selected = false, onClick }: KeywordChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 rounded-button text-body transition-all ${
        selected
          ? 'bg-primary text-white shadow-md'
          : 'bg-white text-text-primary border-2 border-border hover:border-primary'
      }`}
    >
      {label}
    </button>
  )
}
