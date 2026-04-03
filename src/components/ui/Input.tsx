import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
}

export default function Input({ label, helperText, error, className = '', id, ...rest }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full h-11 px-3 text-base bg-white border rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-primary-500 ${
          error
            ? 'border-danger-500 focus:ring-danger-500/20'
            : 'border-gray-200 focus:ring-primary-500/20'
        } ${className}`}
        {...rest}
      />
      {error && <p className="text-xs text-danger-500">{error}</p>}
      {helperText && !error && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  )
}
