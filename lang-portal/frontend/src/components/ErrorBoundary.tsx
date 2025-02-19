import React, { Component, ErrorInfo, ReactNode } from 'react'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'

interface Props {
  children: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-red-600">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="mb-4">{this.state.error?.message}</p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Wrapper component to integrate with React Query
export function QueryErrorBoundary({ children }: Props) {
  const { reset } = useQueryErrorResetBoundary()
  
  return (
    <ErrorBoundary onReset={reset}>
      {children}
    </ErrorBoundary>
  )
} 