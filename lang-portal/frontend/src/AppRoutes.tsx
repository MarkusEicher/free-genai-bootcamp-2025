import React from 'react';
import { Switch } from 'react-router-dom';
import { ErrorBoundaryRoute } from './components/error/ErrorBoundaryRoute';
import { Dashboard } from './pages/Dashboard';
import { Vocabulary } from './pages/Vocabulary';
import { Activities } from './pages/Activities';
import { NotFound } from './pages/NotFound';

export const AppRoutes: React.FC = () => {
  return (
    <Switch>
      <ErrorBoundaryRoute exact path="/">
        <Dashboard />
      </ErrorBoundaryRoute>

      <ErrorBoundaryRoute exact path="/vocabulary">
        <Vocabulary />
      </ErrorBoundaryRoute>

      <ErrorBoundaryRoute exact path="/vocabulary/:id">
        <Vocabulary />
      </ErrorBoundaryRoute>

      <ErrorBoundaryRoute exact path="/activities">
        <Activities />
      </ErrorBoundaryRoute>

      <ErrorBoundaryRoute exact path="/activities/:id">
        <Activities />
      </ErrorBoundaryRoute>

      <ErrorBoundaryRoute path="*">
        <NotFound />
      </ErrorBoundaryRoute>
    </Switch>
  );
}; 