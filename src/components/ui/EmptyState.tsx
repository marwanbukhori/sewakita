import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; to: string }
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <Icon className="mx-auto text-gray-300 mb-3" size={40} />
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      {action && (
        <Link
          to={action.to}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium mt-4 hover:bg-primary-700 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
