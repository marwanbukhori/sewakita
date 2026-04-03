import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import Button from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; to: string }
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
        <Icon size={28} className="text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1 max-w-[240px] mx-auto">{description}</p>}
      {action && (
        <Link to={action.to} className="inline-block mt-4">
          <Button variant="primary" size="md">{action.label}</Button>
        </Link>
      )}
    </div>
  )
}
