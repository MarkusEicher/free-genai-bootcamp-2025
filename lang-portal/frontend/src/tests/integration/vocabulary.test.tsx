import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { VocabularyPage, VocabularyDetailsPage, VocabularyGroupsPage } from '../../pages'
import { server } from '../mocks/server'
import { http } from 'msw'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
)

describe('Vocabulary Integration Tests', () => {
  beforeAll(() => server.listen())
  afterEach(() => {
    queryClient.clear()
    server.resetHandlers()
  })
  afterAll(() => server.close())

  describe('VocabularyPage', () => {
    test('loads and displays vocabulary items', async () => {
      render(<VocabularyPage />, { wrapper })
      
      await waitFor(() => {
        expect(screen.getByText('Test Word 1')).toBeInTheDocument()
      })
      expect(screen.getByText('Translation 1')).toBeInTheDocument()
    })

    test('handles search functionality', async () => {
      render(<VocabularyPage />, { wrapper })
      
      const searchInput = screen.getByPlaceholderText('Search vocabulary...')
      fireEvent.change(searchInput, { target: { value: 'Test' } })
      
      await waitFor(() => {
        expect(screen.getByText('Test Word 1')).toBeInTheDocument()
        expect(screen.queryByText('Other Word')).not.toBeInTheDocument()
      })
    })
  })

  describe('VocabularyDetailsPage', () => {
    test('loads and displays vocabulary details', async () => {
      server.use(
        http.get('/api/vocabulary/1', () => {
          return Response.json({
            id: 1,
            word: 'Test Word',
            translation: 'Test Translation',
            examples: ['Example 1'],
            progress: 0.5
          })
        })
      )

      render(<VocabularyDetailsPage />, { wrapper })
      
      await waitFor(() => {
        expect(screen.getByText('Test Word')).toBeInTheDocument()
        expect(screen.getByText('Test Translation')).toBeInTheDocument()
        expect(screen.getByText('Example 1')).toBeInTheDocument()
      })
    })
  })

  describe('VocabularyGroupsPage', () => {
    test('loads and displays groups', async () => {
      render(<VocabularyGroupsPage />, { wrapper })
      
      await waitFor(() => {
        expect(screen.getByText('Test Group 1')).toBeInTheDocument()
      })
    })

    test('creates new group', async () => {
      render(<VocabularyGroupsPage />, { wrapper })
      
      const input = screen.getByPlaceholderText('Enter group name...')
      fireEvent.change(input, { target: { value: 'New Group' } })
      fireEvent.click(screen.getByText('Create Group'))
      
      await waitFor(() => {
        expect(screen.getByText('New Group')).toBeInTheDocument()
      })
    })
  })
}) 