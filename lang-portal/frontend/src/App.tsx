import { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './hooks/useApi'
import { Layout, LoadingSpinner } from './components/common'
import { routes } from './routes/routes'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {routes.map(({ path, element: Element }) => (
                <Route
                  key={path}
                  path={path}
                  element={<Element />}
                />
              ))}
              <Route
                path="*"
                element={<div>404 - Page Not Found</div>}
              />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
