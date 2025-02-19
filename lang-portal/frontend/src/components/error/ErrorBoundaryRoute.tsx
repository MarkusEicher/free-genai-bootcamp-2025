import React from 'react';
import { Route, RouteProps } from 'react-router-dom';
import { ApiErrorBoundary } from './ApiErrorBoundary';

interface ErrorBoundaryRouteProps extends Omit<RouteProps, 'children'> {
  children: React.ReactNode;
}

export const ErrorBoundaryRoute: React.FC<ErrorBoundaryRouteProps> = ({
  children,
  ...routeProps
}) => {
  const handleError = (error: Error) => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Route Error:', error);
    }
  };

  return (
    <Route {...routeProps}>
      <ApiErrorBoundary onError={handleError}>
        {children}
      </ApiErrorBoundary>
    </Route>
  );
}; 