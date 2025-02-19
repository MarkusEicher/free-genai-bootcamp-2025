import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ApiError } from '../../api/config';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ApiErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  private getErrorMessage(error: Error | null): string {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 404:
          return 'The requested resource was not found.';
        case 403:
          return 'You do not have permission to access this resource.';
        case 500:
          return 'An internal server error occurred. Please try again later.';
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }
    return 'An unexpected error occurred. Please try again.';
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {this.getErrorMessage(this.state.error)}
              </h3>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 