import type { ReactNode } from 'react'

type CardVariant = 'default' | 'elevated' | 'outlined' | 'hero'

interface CardProps {
  variant?: CardVariant
  padding?: string
  pressable?: boolean
  className?: string
  children: ReactNode
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white rounded-2xl shadow-card',
  elevated: 'bg-white rounded-2xl shadow-md',
  outlined: 'bg-white rounded-2xl border border-gray-200',
  hero: 'bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-2xl shadow-md',
}

export default function Card({ variant = 'default', padding = 'p-4', pressable = false, className = '', children }: CardProps) {
  return (
    <div className={`${variantStyles[variant]} ${padding} ${pressable ? 'cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all duration-150' : ''} ${className}`}>
      {children}
    </div>
  )
}
