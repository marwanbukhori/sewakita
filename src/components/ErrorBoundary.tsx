import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC] px-4">
        <div className="w-full max-w-sm text-center">
          <img src="/logos/favicon-dark.svg" alt="ReRumah" className="w-14 h-14 mx-auto mb-4 rounded-2xl shadow-md" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Sesuatu tidak kena</h1>
          <p className="text-sm text-gray-500 mb-6">
            Ralat berlaku. Sila muat semula halaman ini.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors active:scale-95"
          >
            Muat Semula
          </button>
        </div>
      </div>
    )
  }
}
