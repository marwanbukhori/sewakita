import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  helperText?: string
  error?: string
}

export default function Select({ label, helperText, error, className = '', id, children, ...rest }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full h-11 px-3 text-sm font-medium text-gray-800 bg-white border rounded-xl shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23788494%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10 focus:outline-none focus:ring-2 focus:border-primary-500 transition-colors ${
          error
            ? 'border-danger-500 focus:ring-danger-500/20'
            : 'border-gray-200 hover:border-gray-300 focus:ring-primary-500/20'
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger-500">{error}</p>}
      {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  )
}
