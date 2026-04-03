import { Link } from 'react-router-dom'

interface SectionHeaderProps {
  title: string
  action?: { label: string; to: string }
}

export default function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h2>
      {action && (
        <Link to={action.to} className="text-sm font-medium text-primary-600 hover:text-primary-700">
          {action.label}
        </Link>
      )}
    </div>
  )
}
