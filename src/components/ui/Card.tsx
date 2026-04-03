import type { ReactNode } from 'react'

type CardVariant = 'default' | 'elevated' | 'outlined' | 'hero'

interface CardProps {
  variant?: CardVariant
  padding?: string
  className?: string
  children: ReactNode
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white border border-gray-200 rounded-xl',
  elevated: 'bg-white rounded-xl shadow-card',
  outlined: 'bg-white border border-gray-200 rounded-xl',
  hero: 'bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-2xl',
}

export default function Card({ variant = 'default', padding = 'p-4', className = '', children }: CardProps) {
  return (
    <div className={`${variantStyles[variant]} ${padding} ${className}`}>
      {children}
    </div>
  )
}
