import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface QuickAction {
  icon: LucideIcon
  label: string
  to: string
  color?: string
  badge?: number
}

interface QuickActionsProps {
  actions: QuickAction[]
}

export default function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => (
        <Link
          key={action.to}
          to={action.to}
          className="flex flex-col items-center gap-1.5 py-2 group"
        >
          <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 group-hover:scale-105 group-hover:shadow-sm group-active:scale-90 ${action.color || 'bg-primary-50 text-primary-600'}`}>
            <action.icon size={22} />
            {action.badge !== undefined && action.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {action.badge}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-600 text-center leading-tight font-medium">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  )
}
