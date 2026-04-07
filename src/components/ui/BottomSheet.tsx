import { useEffect, type ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
      />

      {/* Mobile: bottom sheet / Desktop: centered dialog */}
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
        <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col animate-[slideUp_300ms_cubic-bezier(0.4,0,0.2,1)] sm:animate-[scaleIn_200ms_cubic-bezier(0.4,0,0.2,1)]">
          {/* Drag handle (mobile only) */}
          <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Title */}
          {title && (
            <div className="px-5 pt-2 pb-3 sm:pt-5 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
          )}

          {/* Scrollable content */}
          <div className="px-5 pb-8 overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
