import { lazy } from 'react'

// Lazy load pages
const Dashboard = lazy(() => import('../pages').then(m => ({ default: m.Dashboard })))
const Vocabulary = lazy(() => import('../pages').then(m => ({ default: m.Vocabulary })))
const Sessions = lazy(() => import('../pages').then(m => ({ default: m.Sessions })))
const Activities = lazy(() => import('../pages').then(m => ({ default: m.Activities })))
const Settings = lazy(() => import('../pages').then(m => ({ default: m.Settings })))

export const routes = [
  {
    path: '/',
    element: Dashboard,
    label: 'Dashboard'
  },
  {
    path: '/vocabulary',
    element: Vocabulary,
    label: 'Vocabulary'
  },
  {
    path: '/sessions',
    element: Sessions,
    label: 'Sessions'
  },
  {
    path: '/activities',
    element: Activities,
    label: 'Activities'
  },
  {
    path: '/settings',
    element: Settings,
    label: 'Settings'
  }
] 